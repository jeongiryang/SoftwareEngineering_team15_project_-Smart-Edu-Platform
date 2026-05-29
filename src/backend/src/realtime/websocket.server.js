const crypto = require('crypto');

const WEBSOCKET_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const DEFAULT_WEBSOCKET_PATH = '/ws';
const clients = new Set();

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

function sendFrame(socket, frame) {
  if (!socket || socket.destroyed || !socket.writable) {
    removeClient(socket);
    return false;
  }

  try {
    socket.write(frame);
    return true;
  } catch (error) {
    removeClient(socket);
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

function handleClientData(socket, chunk) {
  const frame = readClientFrame(chunk);

  if (!frame) {
    return;
  }

  if (frame.opcode === 0x8) {
    sendFrame(socket, encodeControlFrame(0x8));
    socket.end();
    removeClient(socket);
    return;
  }

  if (frame.opcode === 0x9) {
    sendFrame(socket, encodeControlFrame(0xA, frame.payload));
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
    socket.on('data', (chunk) => handleClientData(socket, chunk));
    socket.on('close', () => removeClient(socket));
    socket.on('error', () => removeClient(socket));
  });

  return {
    broadcast: broadcastRealtimeEvent,
    getClientCount: () => clients.size
  };
}

module.exports = {
  DEFAULT_WEBSOCKET_PATH,
  broadcastRealtimeEvent,
  createWebSocketAcceptValue,
  encodeTextFrame,
  readClientFrame,
  setupWebSocketServer
};
