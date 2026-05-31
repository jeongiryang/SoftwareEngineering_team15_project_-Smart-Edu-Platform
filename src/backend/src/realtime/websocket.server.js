const crypto = require('crypto');
const { findAcceptedFriendshipsForUser } = require('../repositories/friend.repository');
const { findUserById } = require('../repositories/user.repository');
const { getDirectMessageTypingRecipients } = require('../services/message.service');
const { verifyToken } = require('../utils/jwt');

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const DEFAULT_WEBSOCKET_PATH = '/ws';
const clients = new Set();
const socketUsers = new Map();
const userSockets = new Map();

function createWebSocketAcceptValue(secWebSocketKey) {
  return crypto
    .createHash('sha1')
    .update(`${secWebSocketKey}${WEBSOCKET_GUID}`)
    .digest('base64');
}

function encodeTextFrame(text) {
  const payload = Buffer.from(text);
  const payloadLength = payload.length;

  if (payloadLength < 126) {
    return Buffer.concat([Buffer.from([0x81, payloadLength]), payload]);
  }

  if (payloadLength <= 0xffff) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payloadLength), 2);
  return Buffer.concat([header, payload]);
}

function encodeControlFrame(opcode, payload = Buffer.alloc(0)) {
  return Buffer.concat([Buffer.from([0x80 | opcode, payload.length]), payload]);
}

function readClientFrame(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 2) {
    return null;
  }

  const opcode = buffer[0] & 0x0f;
  const masked = (buffer[1] & 0x80) === 0x80;
  let length = buffer[1] & 0x7f;
  let offset = 2;

  if (length === 126) {
    if (buffer.length < offset + 2) {
      return null;
    }
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    if (buffer.length < offset + 8) {
      return null;
    }
    const bigLength = buffer.readBigUInt64BE(offset);
    if (bigLength > BigInt(Number.MAX_SAFE_INTEGER)) {
      return null;
    }
    length = Number(bigLength);
    offset += 8;
  }

  if (!masked || buffer.length < offset + 4 + length) {
    return null;
  }

  const mask = buffer.subarray(offset, offset + 4);
  offset += 4;

  const payload = Buffer.alloc(length);
  for (let index = 0; index < length; index += 1) {
    payload[index] = buffer[offset + index] ^ mask[index % 4];
  }

  return { opcode, payload };
}

function removeClient(socket) {
  clients.delete(socket);
}

function normalizeUserId(userId) {
  const numericUserId = Number(userId);
  return Number.isInteger(numericUserId) && numericUserId > 0 ? numericUserId : null;
}

function getFriendUserId(friendship, userId) {
  if (!friendship) {
    return null;
  }

  if (friendship.requesterId === userId) {
    return normalizeUserId(friendship.addresseeId);
  }

  if (friendship.addresseeId === userId) {
    return normalizeUserId(friendship.requesterId);
  }

  return null;
}

async function getAcceptedFriendIds(userId) {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return [];
  }

  const friendships = await findAcceptedFriendshipsForUser(normalizedUserId);

  return friendships
    .map((friendship) => getFriendUserId(friendship, normalizedUserId))
    .filter(Boolean);
}

function isUserOnline(userId) {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId) {
    return false;
  }

  const sockets = userSockets.get(normalizedUserId);
  return Boolean(sockets?.size);
}

function getOnlineUserIds(candidateUserIds = []) {
  return candidateUserIds
    .map(normalizeUserId)
    .filter(Boolean)
    .filter((userId) => isUserOnline(userId));
}

function sendFrame(socket, frame) {
  if (!socket || socket.destroyed || !socket.writable) {
    removeClient(socket);
    unregisterPresenceSocket(socket).catch(() => {});
    return false;
  }

  try {
    socket.write(frame);
    return true;
  } catch (error) {
    removeClient(socket);
    unregisterPresenceSocket(socket).catch(() => {});
    socket.destroy();
    return false;
  }
}

function sendJson(socket, event) {
  return sendFrame(socket, encodeTextFrame(JSON.stringify(event)));
}

function normalizeEvent(type, payload = {}) {
  return {
    type,
    payload,
    sentAt: new Date().toISOString()
  };
}

function broadcastRealtimeEvent(type, payload = {}) {
  const event = normalizeEvent(type, payload);

  clients.forEach((socket) => {
    sendJson(socket, event);
  });

  return {
    clientCount: clients.size,
    event
  };
}

function broadcastRealtimeEventToUsers(userIds = [], type, payload = {}) {
  const targetUserIds = [...new Set(userIds.map(normalizeUserId).filter(Boolean))];
  const event = normalizeEvent(type, payload);
  let sentCount = 0;

  targetUserIds.forEach((userId) => {
    const sockets = userSockets.get(userId);

    if (!sockets) {
      return;
    }

    sockets.forEach((socket) => {
      if (sendJson(socket, event)) {
        sentCount += 1;
      }
    });
  });

  return {
    clientCount: sentCount,
    event,
    userIds: targetUserIds
  };
}

function registerSocketUser(socket, user) {
  const userId = normalizeUserId(user?.id);

  if (!userId) {
    return { userId: null, wasOnline: false };
  }

  const wasOnline = isUserOnline(userId);
  socketUsers.set(socket, {
    id: userId,
    loginId: user.loginId,
    name: user.name
  });

  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }

  userSockets.get(userId).add(socket);

  return { userId, wasOnline };
}

async function sendPresenceSnapshot(socket, userId) {
  const friendIds = await getAcceptedFriendIds(userId);
  const onlineFriendIds = getOnlineUserIds(friendIds);

  sendJson(socket, normalizeEvent('friends.presence.snapshot', { onlineFriendIds }));
}

async function notifyFriendsPresence(userId, online) {
  const friendIds = await getAcceptedFriendIds(userId);

  if (!friendIds.length) {
    return { clientCount: 0 };
  }

  return broadcastRealtimeEventToUsers(friendIds, 'friends.presence.updated', {
    userId,
    online,
    updatedAt: new Date().toISOString()
  });
}

async function unregisterPresenceSocket(socket) {
  const socketUser = socketUsers.get(socket);

  if (!socketUser) {
    return;
  }

  socketUsers.delete(socket);

  const sockets = userSockets.get(socketUser.id);
  if (!sockets) {
    return;
  }

  sockets.delete(socket);

  if (sockets.size > 0) {
    return;
  }

  userSockets.delete(socketUser.id);
  await notifyFriendsPresence(socketUser.id, false);
}

async function authenticatePresenceSocket(socket, token) {
  const normalizedToken = typeof token === 'string' ? token.trim() : '';

  if (!normalizedToken) {
    sendJson(socket, normalizeEvent('friends.presence.auth_failed', { reason: 'missing_token' }));
    return;
  }

  try {
    const payload = verifyToken(normalizedToken);
    const user = await findUserById(payload.userId);

    if (!user || user.status !== 'ACTIVE') {
      sendJson(socket, normalizeEvent('friends.presence.auth_failed', { reason: 'invalid_user' }));
      return;
    }

    const existingSocketUser = socketUsers.get(socket);
    if (existingSocketUser && existingSocketUser.id !== normalizeUserId(user.id)) {
      await unregisterPresenceSocket(socket);
    }

    const { userId, wasOnline } = registerSocketUser(socket, user);

    await sendPresenceSnapshot(socket, userId);

    if (!wasOnline) {
      await notifyFriendsPresence(userId, true);
    }
  } catch (error) {
    sendJson(socket, normalizeEvent('friends.presence.auth_failed', { reason: 'invalid_token' }));
  }
}

async function handleDirectMessageTyping(socket, payload = {}) {
  const socketUser = socketUsers.get(socket);

  if (!socketUser) {
    sendJson(socket, normalizeEvent('directMessage.typing.auth_failed', { reason: 'unauthenticated' }));
    return;
  }

  try {
    const result = await getDirectMessageTypingRecipients(socketUser.id, payload.threadId);
    const isTyping = Boolean(payload.isTyping);

    broadcastRealtimeEventToUsers(result.participantIds, 'directMessage.typing', {
      threadId: result.threadId,
      userId: result.senderId,
      isTyping,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    sendJson(socket, normalizeEvent('directMessage.typing.denied', { reason: 'not_allowed' }));
  }
}

async function handleClientMessage(socket, rawMessage) {
  let message;

  try {
    message = JSON.parse(rawMessage);
  } catch (error) {
    return;
  }

  if (!message || typeof message.type !== 'string') {
    return;
  }

  if (message.type === 'presence.authenticate') {
    await authenticatePresenceSocket(socket, message.payload?.token);
    return;
  }

  if (message.type === 'presence.refresh') {
    const socketUser = socketUsers.get(socket);

    if (socketUser) {
      await sendPresenceSnapshot(socket, socketUser.id);
    }
    return;
  }

  if (message.type === 'directMessage.typing') {
    await handleDirectMessageTyping(socket, message.payload);
  }
}

async function handleClientData(socket, chunk) {
  const frame = readClientFrame(chunk);

  if (!frame) {
    return;
  }

  if (frame.opcode === 0x8) {
    sendFrame(socket, encodeControlFrame(0x8));
    socket.end();
    removeClient(socket);
    await unregisterPresenceSocket(socket);
    return;
  }

  if (frame.opcode === 0x9) {
    sendFrame(socket, encodeControlFrame(0xA, frame.payload));
    return;
  }

  if (frame.opcode === 0x1) {
    await handleClientMessage(socket, frame.payload.toString('utf8'));
  }
}

function setupWebSocketServer(server, options = {}) {
  const path = options.path || DEFAULT_WEBSOCKET_PATH;

  server.on('upgrade', (request, socket) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (requestUrl.pathname !== path) {
      socket.destroy();
      return;
    }

    const upgradeHeader = request.headers.upgrade || '';
    const websocketKey = request.headers['sec-websocket-key'];

    if (upgradeHeader.toLowerCase() !== 'websocket' || !websocketKey) {
      socket.destroy();
      return;
    }

    const acceptValue = createWebSocketAcceptValue(websocketKey);
    socket.write([
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptValue}`,
      '',
      ''
    ].join('\r\n'));

    clients.add(socket);
    socket.on('data', (chunk) => {
      handleClientData(socket, chunk).catch(() => {
        // Presence failure should not break public realtime broadcast delivery.
      });
    });
    socket.on('close', () => {
      removeClient(socket);
      unregisterPresenceSocket(socket).catch(() => {});
    });
    socket.on('error', () => {
      removeClient(socket);
      unregisterPresenceSocket(socket).catch(() => {});
    });
  });

  return {
    broadcast: broadcastRealtimeEvent,
    getClientCount: () => clients.size
  };
}

module.exports = {
  DEFAULT_WEBSOCKET_PATH,
  broadcastRealtimeEventToUsers,
  broadcastRealtimeEvent,
  createWebSocketAcceptValue,
  encodeTextFrame,
  getOnlineUserIds,
  readClientFrame,
  setupWebSocketServer
};
