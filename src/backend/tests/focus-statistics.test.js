const mockUsers = [];
const mockTasks = [];
let mockNextUserId = 1;
let mockNextTaskId = 1;
let mockNextFocusSessionId = 1;

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ email, name, passwordHash }) => {
    const user = {
      id: mockNextUserId++,
      email,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };

    mockUsers.push(user);

    return user;
  }),
  findUserByEmail: jest.fn(async (email) => mockUsers.find((user) => user.email === email) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/task.repository', () => ({
  findTaskByIdAndUser: jest.fn(async (id, userId) => (
    mockTasks.find((task) => task.id === Number(id) && task.userId === Number(userId)) || null
  ))
}));

jest.mock('../src/repositories/focus.repository', () => ({
  findFocusSessionsByUserId: jest.fn(async () => []),
  findFocusSessionsByUserIdAndDateRange: jest.fn(async () => []),
  createFocusSession: jest.fn(async (userId, data) => ({
    id: mockNextFocusSessionId++,
    userId,
    ...data,
    createdAt: new Date('2026-05-26T00:00:00.000Z')
  }))
}));

jest.mock('../src/repositories/statistics.repository', () => ({
  findFocusSessionsByUserIdAndDateRange: jest.fn(async () => []),
  findTasksByUserIdAndDateRange: jest.fn(async () => [])
}));

const request = require('supertest');
const app = require('../src/app');
const focusRepository = require('../src/repositories/focus.repository');
const statisticsRepository = require('../src/repositories/statistics.repository');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return { token: response.body.token, user: response.body.user };
}

beforeEach(() => {
  mockUsers.length = 0;
  mockTasks.length = 0;
  mockNextUserId = 1;
  mockNextTaskId = 1;
  mockNextFocusSessionId = 1;
  jest.clearAllMocks();
});

describe('Focus & Statistics API', () => {
  it('rejects unauthenticated focus session requests', async () => {
    const response = await request(app)
      .post('/api/focus-sessions')
      .send({
        startedAt: '2026-05-25T10:00:00.000Z',
        endedAt: '2026-05-25T11:00:00.000Z',
        durationMs: 3600000
      });

    expect(response.status).toBe(401);
  });

  it('records a focus session successfully', async () => {
    const { token, user } = await registerTestUser();
    mockTasks.push({
      id: mockNextTaskId++,
      userId: user.id,
      title: 'Math task',
      status: 'TODO'
    });

    const response = await request(app)
      .post('/api/focus-sessions')
      .set(createAuthHeader(token))
      .send({
        taskId: 1,
        startedAt: '2026-05-25T10:00:00.000Z',
        endedAt: '2026-05-25T11:00:00.000Z',
        durationMs: 3600000,
        memo: 'Deep focus'
      });

    expect(response.status).toBe(201);
    expect(response.body.focusSession).toEqual(
      expect.objectContaining({
        id: 1,
        userId: user.id,
        taskId: 1,
        durationMs: 3600000,
        memo: 'Deep focus'
      })
    );
  });

  it('rejects invalid focus session payloads', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/focus-sessions')
      .set(createAuthHeader(token))
      .send({
        startedAt: 'invalid-date',
        endedAt: '2026-05-25T11:00:00.000Z',
        durationMs: -10
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when taskId does not belong to the current user', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/focus-sessions')
      .set(createAuthHeader(token))
      .send({
        taskId: 999,
        startedAt: '2026-05-25T10:00:00.000Z',
        endedAt: '2026-05-25T11:00:00.000Z',
        durationMs: 3600000
      });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('lists focus sessions for the current user', async () => {
    const { token, user } = await registerTestUser();

    focusRepository.findFocusSessionsByUserId.mockResolvedValue([
      {
        id: 1,
        userId: user.id,
        taskId: null,
        startedAt: new Date('2026-05-25T10:00:00.000Z'),
        endedAt: new Date('2026-05-25T11:00:00.000Z'),
        durationMs: 3600000,
        memo: 'Morning session',
        createdAt: new Date('2026-05-26T00:00:00.000Z')
      }
    ]);

    const response = await request(app)
      .get('/api/focus-sessions')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.focusSessions).toHaveLength(1);
    expect(response.body.focusSessions[0]).toEqual(
      expect.objectContaining({
        id: 1,
        userId: user.id,
        durationMs: 3600000,
        memo: 'Morning session'
      })
    );
  });

  it('filters focus sessions by date range when startDate and endDate are provided', async () => {
    const { token, user } = await registerTestUser();

    focusRepository.findFocusSessionsByUserIdAndDateRange.mockResolvedValue([
      {
        id: 2,
        userId: user.id,
        taskId: 1,
        startedAt: new Date('2026-05-20T10:00:00.000Z'),
        endedAt: new Date('2026-05-20T10:30:00.000Z'),
        durationMs: 1800000,
        memo: null,
        createdAt: new Date('2026-05-26T00:00:00.000Z')
      }
    ]);

    const response = await request(app)
      .get('/api/focus-sessions?startDate=2026-05-01&endDate=2026-05-31')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(focusRepository.findFocusSessionsByUserIdAndDateRange).toHaveBeenCalled();
    expect(response.body.focusSessions[0]).toEqual(
      expect.objectContaining({
        id: 2,
        userId: user.id,
        durationMs: 1800000
      })
    );
  });

  it('rejects incomplete focus session date filters', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/focus-sessions?startDate=2026-05-01')
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('calculates summary statistics correctly', async () => {
    const { token } = await registerTestUser();

    statisticsRepository.findFocusSessionsByUserIdAndDateRange.mockResolvedValue([
      {
        id: 1,
        durationMs: 1800000,
        startedAt: new Date('2026-05-01T10:00:00.000Z')
      },
      {
        id: 2,
        durationMs: 5400000,
        startedAt: new Date('2026-05-02T10:00:00.000Z')
      }
    ]);
    statisticsRepository.findTasksByUserIdAndDateRange.mockResolvedValue([
      { id: 1, status: 'DONE' },
      { id: 2, status: 'IN_PROGRESS' },
      { id: 3, status: 'DONE' }
    ]);

    const response = await request(app)
      .get('/api/statistics/summary?startDate=2026-05-01&endDate=2026-05-31')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.summary).toEqual({
      totalMinutes: 120,
      completionRate: 67,
      sessionCount: 2,
      taskCount: 3
    });
  });

  it('returns heatmap data grouped by date', async () => {
    const { token } = await registerTestUser();

    statisticsRepository.findFocusSessionsByUserIdAndDateRange.mockResolvedValue([
      {
        id: 1,
        durationMs: 1800000,
        startedAt: new Date('2026-05-10T10:00:00.000Z')
      },
      {
        id: 2,
        durationMs: 1200000,
        startedAt: new Date('2026-05-10T15:00:00.000Z')
      },
      {
        id: 3,
        durationMs: 3600000,
        startedAt: new Date('2026-05-11T09:00:00.000Z')
      }
    ]);

    const response = await request(app)
      .get('/api/statistics/heatmap?startDate=2026-05-01&endDate=2026-05-31')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.heatmap).toEqual({
      '2026-05-10': {
        durationMs: 3000000,
        sessionCount: 2
      },
      '2026-05-11': {
        durationMs: 3600000,
        sessionCount: 1
      }
    });
  });

  it('rejects invalid statistics date ranges', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/statistics/summary?startDate=2026-05-31&endDate=2026-05-01')
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });
});
