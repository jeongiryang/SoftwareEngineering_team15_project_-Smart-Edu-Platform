const mockUsers = [];
let mockNextUserId = 1;
const mockBroadcastRealtimeEventToUsers = jest.fn();

function mockPublicUser(id, overrides = {}) {
  return {
    id,
    name: `User ${id}`,
    loginId: `user_${id}`,
    ...overrides
  };
}

function mockBuildThread(overrides = {}) {
  const createdAt = new Date('2026-05-30T03:00:00Z');
  const participantA = mockPublicUser(1, { name: 'Message User', loginId: 'message_user' });
  const participantB = mockPublicUser(2, { name: 'Friend User', loginId: 'friend_user' });

  return {
    id: 1,
    participantAId: 1,
    participantBId: 2,
    participantA,
    participantB,
    lastMessageAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    readStates: [
      {
        id: 1,
        threadId: 1,
        userId: 1,
        lastReadAt: null,
        updatedAt: createdAt
      },
      {
        id: 2,
        threadId: 1,
        userId: 2,
        lastReadAt: null,
        updatedAt: createdAt
      }
    ],
    messages: [
      {
        id: 1,
        threadId: 1,
        senderId: 2,
        content: 'Focus sprint at 9?',
        createdAt,
        sender: participantB
      }
    ],
    ...overrides
  };
}

function mockAcceptedFriendship() {
  return {
    id: 1,
    requesterId: 1,
    addresseeId: 2,
    status: 'ACCEPTED',
    requester: mockPublicUser(1),
    addressee: mockPublicUser(2)
  };
}

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ loginId, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      loginId,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date('2026-05-30T03:00:00Z'),
      updatedAt: new Date('2026-05-30T03:00:00Z')
    };

    mockNextUserId += 1;
    mockUsers.push(user);

    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/friend.repository', () => ({
  createFriendRequest: jest.fn(),
  deleteFriendship: jest.fn(),
  findAcceptedFriendshipBetween: jest.fn(async () => mockAcceptedFriendship()),
  findAcceptedFriendshipsForUser: jest.fn(async () => []),
  findFriendshipBetween: jest.fn(),
  findFriendshipById: jest.fn(),
  findFriendshipsWithUsers: jest.fn(async () => []),
  findPendingRequestsForUser: jest.fn(async () => []),
  findUsersByKeyword: jest.fn(async () => []),
  updateFriendship: jest.fn()
}));

jest.mock('../src/repositories/message.repository', () => ({
  countUnreadMessages: jest.fn(async () => 1),
  createDirectMessage: jest.fn(async ({ threadId, senderId, content }) => {
    const createdAt = new Date('2026-05-30T03:05:00Z');
    const sender = senderId === 1
      ? mockPublicUser(1, { name: 'Message User', loginId: 'message_user' })
      : mockPublicUser(2, { name: 'Friend User', loginId: 'friend_user' });
    const message = {
      id: 2,
      threadId,
      senderId,
      content,
      createdAt,
      sender
    };

    return {
      message,
      thread: mockBuildThread({
        lastMessageAt: createdAt,
        messages: [message]
      })
    };
  }),
  findMessageThreadBetween: jest.fn(async () => mockBuildThread()),
  findMessageThreadById: jest.fn(async (threadId) => (Number(threadId) === 1 ? mockBuildThread() : null)),
  findMessageThreadSummaryById: jest.fn(async (threadId) => (Number(threadId) === 1 ? mockBuildThread() : null)),
  findMessageThreadsForUser: jest.fn(async () => [mockBuildThread()]),
  findOrCreateMessageThread: jest.fn(async () => mockBuildThread({ messages: [] })),
  markMessageThreadRead: jest.fn(async (threadId, userId) => ({
    id: 1,
    threadId,
    userId,
    lastReadAt: new Date('2026-05-30T03:06:00Z'),
    updatedAt: new Date('2026-05-30T03:06:00Z')
  })),
  normalizeParticipantPair: jest.fn((userId, friendId) => {
    const participantAId = Math.min(Number(userId), Number(friendId));
    const participantBId = Math.max(Number(userId), Number(friendId));

    return { participantAId, participantBId };
  })
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEvent: jest.fn(),
  broadcastRealtimeEventToUsers: (...args) => mockBroadcastRealtimeEventToUsers(...args),
  getOnlineUserIds: jest.fn(() => [])
}));

const request = require('supertest');
const app = require('../src/app');
const friendRepository = require('../src/repositories/friend.repository');
const messageRepository = require('../src/repositories/message.repository');
const messageService = require('../src/services/message.service');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    token: response.body.token,
    user: response.body.user
  };
}

beforeEach(() => {
  mockUsers.length = 0;
  mockNextUserId = 1;
  mockBroadcastRealtimeEventToUsers.mockClear();
  jest.clearAllMocks();
});

describe('Direct Message API', () => {
  it.each([
    { method: 'get', path: '/api/messages/threads' },
    { method: 'post', path: '/api/messages/threads' },
    { method: 'post', path: '/api/messages/threads/1/messages' },
    { method: 'post', path: '/api/messages/threads/1/read' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('lists direct message threads without exposing sensitive fields', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/messages/threads')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.threads).toHaveLength(1);
    expect(response.body.threads[0]).toEqual(
      expect.objectContaining({
        id: 1,
        unreadCount: 1,
        friend: expect.objectContaining({
          id: 2,
          loginId: 'friend_user'
        }),
        lastMessage: expect.objectContaining({
          content: 'Focus sprint at 9?'
        })
      })
    );
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('starts a direct message thread only with an accepted friend', async () => {
    const { token } = await registerTestUser();
    await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads')
      .set(createAuthHeader(token))
      .send({ friendId: 2 });

    expect(response.status).toBe(201);
    expect(response.body.thread.friend.id).toBe(2);
    expect(friendRepository.findAcceptedFriendshipBetween).toHaveBeenCalledWith(1, 2);
    expect(messageRepository.findOrCreateMessageThread).toHaveBeenCalledWith(1, 2);
  });

  it('blocks direct message thread creation for non-friends', async () => {
    friendRepository.findAcceptedFriendshipBetween.mockResolvedValueOnce(null);
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads')
      .set(createAuthHeader(token))
      .send({ friendId: 2 });

    expect(response.status).toBe(403);
  });

  it('sends a direct message and broadcasts it to both participants', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads/1/messages')
      .set(createAuthHeader(token))
      .send({ content: 'Let us review math together.' });

    expect(response.status).toBe(201);
    expect(response.body.message).toEqual(
      expect.objectContaining({
        threadId: 1,
        senderId: 1,
        content: 'Let us review math together.'
      })
    );
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'directMessage.created',
      expect.objectContaining({
        message: expect.objectContaining({
          content: 'Let us review math together.'
        }),
        thread: expect.objectContaining({
          id: 1
        })
      })
    );
  });

  it('blocks message sending when the current user is not a thread participant', async () => {
    messageRepository.findMessageThreadSummaryById.mockResolvedValueOnce(
      mockBuildThread({
        participantAId: 2,
        participantBId: 3,
        participantA: mockPublicUser(2),
        participantB: mockPublicUser(3)
      })
    );
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads/1/messages')
      .set(createAuthHeader(token))
      .send({ content: 'blocked' });

    expect(response.status).toBe(403);
    expect(mockBroadcastRealtimeEventToUsers).not.toHaveBeenCalled();
  });

  it('marks a direct message thread as read and broadcasts read state', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads/1/read')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.read).toEqual(
      expect.objectContaining({
        threadId: 1,
        userId: 1,
        lastReadAt: expect.any(String)
      })
    );
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenCalledWith(
      expect.arrayContaining([1, 2]),
      'directMessage.read',
      expect.objectContaining({
        threadId: 1,
        userId: 1
      })
    );
  });

  it('returns direct message typing recipients only for valid thread participants', async () => {
    const result = await messageService.getDirectMessageTypingRecipients(1, 1);

    expect(result).toEqual({
      threadId: 1,
      senderId: 1,
      participantIds: [1, 2]
    });
    expect(friendRepository.findAcceptedFriendshipBetween).toHaveBeenCalledWith(1, 2);
  });

  it('rejects empty direct message content', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/messages/threads/1/messages')
      .set(createAuthHeader(token))
      .send({ content: '   ' });

    expect(response.status).toBe(400);
  });
});
