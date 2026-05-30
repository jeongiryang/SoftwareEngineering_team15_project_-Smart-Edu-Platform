const { findAcceptedFriendshipBetween } = require('../repositories/friend.repository');
const messageRepository = require('../repositories/message.repository');
const {
  forbiddenError,
  notFoundError,
  validationError
} = require('../utils/errors');
const {
  normalizeString,
  parsePositiveInteger
} = require('../utils/validators');

const MAX_MESSAGE_LENGTH = 1000;

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    loginId: user.loginId
  };
}

function getParticipantIds(thread) {
  return [thread?.participantAId, thread?.participantBId].filter(Boolean);
}

function ensureThreadParticipant(thread, userId) {
  if (!thread || !getParticipantIds(thread).includes(userId)) {
    throw forbiddenError('You can access only your direct message threads');
  }
}

function getFriendFromThread(thread, userId) {
  if (!thread) {
    return null;
  }

  return thread.participantAId === userId
    ? sanitizeUser(thread.participantB)
    : sanitizeUser(thread.participantA);
}

function getReadState(thread, userId) {
  return (thread?.readStates || []).find((readState) => readState.userId === userId) || null;
}

function sanitizeMessage(message) {
  if (!message) {
    return null;
  }

  return {
    id: message.id,
    threadId: message.threadId,
    senderId: message.senderId,
    sender: sanitizeUser(message.sender),
    content: message.content,
    createdAt: message.createdAt
  };
}

async function getThreadUnreadCount(thread, userId) {
  const readState = getReadState(thread, userId);

  return messageRepository.countUnreadMessages({
    threadId: thread.id,
    userId,
    lastReadAt: readState?.lastReadAt || null
  });
}

async function ensureAcceptedFriendship(userId, friendId) {
  const friendship = await findAcceptedFriendshipBetween(userId, friendId);

  if (!friendship) {
    throw forbiddenError('Direct messages are available only between friends');
  }

  return friendship;
}

async function sanitizeThreadSummary(thread, userId) {
  const lastMessage = Array.isArray(thread.messages) ? thread.messages[0] : null;
  const unreadCount = await getThreadUnreadCount(thread, userId);

  return {
    id: thread.id,
    participantIds: getParticipantIds(thread),
    friend: getFriendFromThread(thread, userId),
    lastMessage: sanitizeMessage(lastMessage),
    unreadCount,
    lastMessageAt: thread.lastMessageAt,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt
  };
}

async function sanitizeThreadDetail(thread, userId) {
  const summary = await sanitizeThreadSummary(thread, userId);

  return {
    ...summary,
    messages: (thread.messages || []).map(sanitizeMessage)
  };
}

function ensureMessageContent(content) {
  const normalized = normalizeString(content);

  if (!normalized) {
    throw validationError('content is required', { field: 'content' });
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw validationError(`content must be ${MAX_MESSAGE_LENGTH} characters or fewer`, {
      field: 'content',
      maxLength: MAX_MESSAGE_LENGTH
    });
  }

  return normalized;
}

async function listMessageThreads(userId) {
  const threads = await messageRepository.findMessageThreadsForUser(userId);

  const summaries = await Promise.all(threads.map(async (thread) => {
    const friend = getFriendFromThread(thread, userId);

    if (!friend) {
      return null;
    }

    const friendship = await findAcceptedFriendshipBetween(userId, friend.id);

    if (!friendship) {
      return null;
    }

    return sanitizeThreadSummary(thread, userId);
  }));

  return summaries.filter(Boolean);
}

async function getMessageThread(userId, threadId) {
  const id = parsePositiveInteger(threadId, 'threadId');
  const thread = await messageRepository.findMessageThreadById(id);

  if (!thread) {
    throw notFoundError('Direct message thread not found');
  }

  ensureThreadParticipant(thread, userId);
  await ensureAcceptedFriendship(userId, getFriendFromThread(thread, userId).id);
  return sanitizeThreadDetail(thread, userId);
}

async function startMessageThread(userId, payload) {
  const friendId = parsePositiveInteger(payload.friendId, 'friendId');

  if (friendId === userId) {
    throw validationError('friendId must be another user', { field: 'friendId' });
  }

  await ensureAcceptedFriendship(userId, friendId);

  const thread = await messageRepository.findOrCreateMessageThread(userId, friendId);
  return sanitizeThreadSummary(thread, userId);
}

async function sendDirectMessage(userId, threadId, payload) {
  const id = parsePositiveInteger(threadId, 'threadId');
  const content = ensureMessageContent(payload.content);
  const thread = await messageRepository.findMessageThreadSummaryById(id);

  if (!thread) {
    throw notFoundError('Direct message thread not found');
  }

  ensureThreadParticipant(thread, userId);

  const friend = getFriendFromThread(thread, userId);
  await ensureAcceptedFriendship(userId, friend.id);

  const result = await messageRepository.createDirectMessage({
    threadId: id,
    senderId: userId,
    content
  });

  return {
    message: sanitizeMessage(result.message),
    thread: await sanitizeThreadSummary(result.thread, userId),
    participantIds: getParticipantIds(result.thread)
  };
}

async function markThreadRead(userId, threadId) {
  const id = parsePositiveInteger(threadId, 'threadId');
  const thread = await messageRepository.findMessageThreadSummaryById(id);

  if (!thread) {
    throw notFoundError('Direct message thread not found');
  }

  ensureThreadParticipant(thread, userId);
  await ensureAcceptedFriendship(userId, getFriendFromThread(thread, userId).id);

  const readState = await messageRepository.markMessageThreadRead(id, userId);
  const updatedThread = await messageRepository.findMessageThreadSummaryById(id);

  return {
    thread: await sanitizeThreadSummary(updatedThread, userId),
    read: {
      threadId: id,
      userId,
      lastReadAt: readState.lastReadAt
    },
    participantIds: getParticipantIds(thread)
  };
}

module.exports = {
  getMessageThread,
  listMessageThreads,
  markThreadRead,
  sendDirectMessage,
  startMessageThread
};
