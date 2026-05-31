const mockUsers = [];
const mockChatRooms = [];
const mockChatMessages = [];
let mockNextUserId = 1;
let mockNextRoomId = 1;
let mockNextMessageId = 1;

function mockBuildRoom(room) {
  return {
    ...room,
    messages: mockChatMessages
      .filter((message) => message.roomId === room.id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20)
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
      status: 'ACTIVE'
    };
    mockNextUserId += 1;
    mockUsers.push(user);
    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/ai.repository', () => ({
  createAIChatMessage: jest.fn(async (userId, roomId, data) => {
    const room = mockChatRooms.find((item) => item.id === Number(roomId) && item.userId === Number(userId));
    const createdAt = new Date(`2026-05-31T12:${String(mockNextMessageId).padStart(2, '0')}:00Z`);
    const message = {
      id: mockNextMessageId,
      roomId: Number(roomId),
      userId,
      question: data.question,
      answer: data.answer,
      isMock: data.isMock || false,
      isTruncated: data.isTruncated || false,
      source: data.source || 'AI_QNA',
      createdAt
    };
    mockNextMessageId += 1;
    mockChatMessages.push(message);

    if (room) {
      room.title = data.roomTitle || room.title;
      room.updatedAt = createdAt;
    }

    return {
      message,
      room: mockBuildRoom(room)
    };
  }),
  createAIChatRoom: jest.fn(async (userId, data = {}) => {
    const createdAt = new Date(`2026-05-31T11:${String(mockNextRoomId).padStart(2, '0')}:00Z`);
    const room = {
      id: mockNextRoomId,
      userId,
      title: data.title || 'AI 대화',
      isPinned: data.isPinned || false,
      createdAt,
      updatedAt: createdAt
    };
    mockNextRoomId += 1;
    mockChatRooms.push(room);
    return mockBuildRoom(room);
  }),
  createAIQuestion: jest.fn(),
  createAIRecommendation: jest.fn(),
  createWrongAnswerNote: jest.fn(),
  deleteAIChatRoom: jest.fn(async (roomId) => {
    const index = mockChatRooms.findIndex((room) => room.id === Number(roomId));
    const [deleted] = mockChatRooms.splice(index, 1);

    for (let messageIndex = mockChatMessages.length - 1; messageIndex >= 0; messageIndex -= 1) {
      if (mockChatMessages[messageIndex].roomId === Number(roomId)) {
        mockChatMessages.splice(messageIndex, 1);
      }
    }

    return deleted;
  }),
  findAIChatRoomByIdAndUserId: jest.fn(async (roomId, userId) => {
    const room = mockChatRooms.find((item) => item.id === Number(roomId) && item.userId === Number(userId));
    return room ? mockBuildRoom(room) : null;
  }),
  findAIChatRoomsByUserId: jest.fn(async (userId) =>
    mockChatRooms
      .filter((room) => room.userId === Number(userId))
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(mockBuildRoom)
  ),
  findStudyNoteByIdAndUserId: jest.fn(),
  updateAIChatRoom: jest.fn(async (roomId, data) => {
    const room = mockChatRooms.find((item) => item.id === Number(roomId));
    Object.assign(room, data, {
      updatedAt: new Date(`2026-05-31T13:${String(roomId).padStart(2, '0')}:00Z`)
    });
    return mockBuildRoom(room);
  })
}));

jest.mock('../src/repositories/schedule.repository', () => ({
  findSchedulesByUserId: jest.fn(async () => [])
}));

jest.mock('../src/repositories/task.repository', () => ({
  findTasksByUserId: jest.fn(async () => [])
}));

const request = require('supertest');
const app = require('../src/app');
const aiRepository = require('../src/repositories/ai.repository');
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
  mockChatRooms.length = 0;
  mockChatMessages.length = 0;
  mockNextUserId = 1;
  mockNextRoomId = 1;
  mockNextMessageId = 1;
  jest.clearAllMocks();
});

describe('AI chat room API', () => {
  it.each([
    { method: 'get', path: '/api/ai/chat-rooms' },
    { method: 'post', path: '/api/ai/chat-rooms' },
    { method: 'post', path: '/api/ai/chat-rooms/1/messages' },
    { method: 'patch', path: '/api/ai/chat-rooms/1' },
    { method: 'delete', path: '/api/ai/chat-rooms/1' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('creates and lists user-owned AI chat rooms without sensitive fields', async () => {
    const { token } = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({ title: '시험 대비 질문' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.chatRoom).toEqual(
      expect.objectContaining({
        id: 1,
        title: '시험 대비 질문',
        isPinned: false,
        messages: []
      })
    );

    const listResponse = await request(app)
      .get('/api/ai/chat-rooms')
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.chatRooms).toHaveLength(1);
    expect(JSON.stringify(listResponse.body)).not.toContain('passwordHash');
  });

  it('stores messages in the selected room and retitles the first default room', async () => {
    const { token } = await registerTestUser();
    const roomResponse = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({});

    const response = await request(app)
      .post(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}/messages`)
      .set(createAuthHeader(token))
      .send({
        question: '운영체제 교착상태를 설명해 줘',
        answer: '교착상태는 여러 프로세스가 서로 자원을 기다리며 멈춘 상태입니다.',
        isMock: true,
        source: 'MOCK_QNA'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toEqual(
      expect.objectContaining({
        roomId: 1,
        question: '운영체제 교착상태를 설명해 줘',
        isMock: true,
        source: 'MOCK_QNA'
      })
    );
    expect(response.body.chatRoom.title).toContain('운영체제');
    expect(response.body.chatRoom.messages).toHaveLength(1);
  });

  it('updates owned room title and pinned state', async () => {
    const { token } = await registerTestUser();
    const firstRoom = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({ title: '첫 번째 대화' });
    await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({ title: '두 번째 대화' });

    const updateResponse = await request(app)
      .patch(`/api/ai/chat-rooms/${firstRoom.body.chatRoom.id}`)
      .set(createAuthHeader(token))
      .send({ title: '고정한 시험 대비방', isPinned: true });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.chatRoom).toEqual(
      expect.objectContaining({
        id: 1,
        title: '고정한 시험 대비방',
        isPinned: true
      })
    );
    expect(aiRepository.updateAIChatRoom).toHaveBeenCalledWith(1, {
      title: '고정한 시험 대비방',
      isPinned: true
    });

    const listResponse = await request(app)
      .get('/api/ai/chat-rooms')
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.chatRooms[0]).toEqual(
      expect.objectContaining({
        id: 1,
        isPinned: true
      })
    );
  });

  it('validates chat room update payloads', async () => {
    const { token } = await registerTestUser();
    const roomResponse = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({});

    const blankTitleResponse = await request(app)
      .patch(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}`)
      .set(createAuthHeader(token))
      .send({ title: '   ' });

    expect(blankTitleResponse.status).toBe(400);

    const invalidPinResponse = await request(app)
      .patch(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}`)
      .set(createAuthHeader(token))
      .send({ isPinned: 'yes' });

    expect(invalidPinResponse.status).toBe(400);
  });

  it('blocks access to another user AI chat room', async () => {
    const owner = await registerTestUser({ loginId: 'ai-owner' });
    const other = await registerTestUser({ loginId: 'ai-other' });
    const roomResponse = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(owner.token))
      .send({});

    const messageResponse = await request(app)
      .post(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}/messages`)
      .set(createAuthHeader(other.token))
      .send({
        question: '다른 사용자 질문',
        answer: '다른 사용자 답변'
      });

    expect(messageResponse.status).toBe(404);

    const updateResponse = await request(app)
      .patch(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}`)
      .set(createAuthHeader(other.token))
      .send({ title: '권한 없는 변경', isPinned: true });

    expect(updateResponse.status).toBe(404);

    const deleteResponse = await request(app)
      .delete(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}`)
      .set(createAuthHeader(other.token));

    expect(deleteResponse.status).toBe(404);
  });

  it('validates message payloads and deletes owned rooms', async () => {
    const { token } = await registerTestUser();
    const roomResponse = await request(app)
      .post('/api/ai/chat-rooms')
      .set(createAuthHeader(token))
      .send({});

    const invalidResponse = await request(app)
      .post(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}/messages`)
      .set(createAuthHeader(token))
      .send({ question: '답변 누락' });

    expect(invalidResponse.status).toBe(400);

    const deleteResponse = await request(app)
      .delete(`/api/ai/chat-rooms/${roomResponse.body.chatRoom.id}`)
      .set(createAuthHeader(token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({ id: 1, deleted: true });
    expect(aiRepository.deleteAIChatRoom).toHaveBeenCalledWith(1);
  });
});
