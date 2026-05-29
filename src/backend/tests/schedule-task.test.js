const mockUsers = [];
const mockSchedules = [];
const mockTasks = [];
let mockNextUserId = 1;
let mockNextScheduleId = 1;
let mockNextTaskId = 1;

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

jest.mock('../src/repositories/schedule.repository', () => ({
  createSchedule: jest.fn(async (userId, data) => {
    const now = new Date();
    const schedule = {
      id: mockNextScheduleId,
      userId,
      subject: null,
      endAt: null,
      priority: 'MEDIUM',
      memo: null,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    mockNextScheduleId += 1;
    mockSchedules.push(schedule);

    return schedule;
  }),
  deleteSchedule: jest.fn(async (id) => {
    const index = mockSchedules.findIndex((schedule) => schedule.id === Number(id));
    const [deletedSchedule] = mockSchedules.splice(index, 1);

    mockTasks.forEach((task) => {
      if (task.scheduleId === Number(id)) {
        task.scheduleId = null;
      }
    });

    return deletedSchedule;
  }),
  findScheduleByIdAndUser: jest.fn(async (id, userId, includeTasks = false) => {
    const schedule = mockSchedules.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    if (!schedule) {
      return null;
    }

    if (!includeTasks) {
      return schedule;
    }

    return {
      ...schedule,
      tasks: mockTasks.filter((task) => task.scheduleId === schedule.id)
    };
  }),
  findSchedulesByUserId: jest.fn(async (userId) => mockSchedules
    .filter((schedule) => schedule.userId === Number(userId))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())),
  updateSchedule: jest.fn(async (id, data) => {
    const schedule = mockSchedules.find((item) => item.id === Number(id));

    Object.assign(schedule, data, { updatedAt: new Date() });

    return schedule;
  })
}));

jest.mock('../src/repositories/task.repository', () => ({
  createTask: jest.fn(async (userId, data) => {
    const now = new Date();
    const task = {
      id: mockNextTaskId,
      userId,
      scheduleId: null,
      status: 'TODO',
      dueDate: null,
      priority: 'MEDIUM',
      memo: null,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    mockNextTaskId += 1;
    mockTasks.push(task);

    return task;
  }),
  deleteTask: jest.fn(async (id) => {
    const index = mockTasks.findIndex((task) => task.id === Number(id));
    const [deletedTask] = mockTasks.splice(index, 1);

    return deletedTask;
  }),
  findTaskByIdAndUser: jest.fn(async (id, userId) => mockTasks.find(
    (task) => task.id === Number(id) && task.userId === Number(userId)
  ) || null),
  findTasksByUserId: jest.fn(async (userId, filters = {}) => mockTasks.filter((task) => {
    if (task.userId !== Number(userId)) {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(filters, 'scheduleId')) {
      return task.scheduleId === filters.scheduleId;
    }

    return true;
  })),
  updateTask: jest.fn(async (id, data) => {
    const task = mockTasks.find((item) => item.id === Number(id));

    Object.assign(task, data, { updatedAt: new Date() });

    return task;
  })
}));

const request = require('supertest');
const app = require('../src/app');
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

function createSchedulePayload(overrides = {}) {
  return {
    title: '  Algebra study  ',
    subject: 'Math',
    startAt: '2026-06-01T09:00:00.000Z',
    endAt: '2026-06-01T10:00:00.000Z',
    priority: 'HIGH',
    memo: 'Chapter 1',
    ...overrides
  };
}

async function createTestSchedule(token, overrides = {}) {
  const response = await request(app)
    .post('/api/schedules')
    .set(createAuthHeader(token))
    .send(createSchedulePayload(overrides));

  return response.body.schedule;
}

async function createTestTask(token, overrides = {}) {
  const response = await request(app)
    .post('/api/tasks')
    .set(createAuthHeader(token))
    .send({
      title: '  Solve worksheet  ',
      priority: 'MEDIUM',
      memo: 'Problems 1-10',
      ...overrides
    });

  return response.body.task;
}

beforeEach(() => {
  mockUsers.length = 0;
  mockSchedules.length = 0;
  mockTasks.length = 0;
  mockNextUserId = 1;
  mockNextScheduleId = 1;
  mockNextTaskId = 1;
  jest.clearAllMocks();
});

describe('Schedule API', () => {
  it('rejects unauthenticated schedule requests', async () => {
    const response = await request(app).get('/api/schedules');

    expect(response.status).toBe(401);
  });

  it('creates, lists, reads, updates, and deletes a schedule for the current user', async () => {
    const { token } = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/schedules')
      .set(createAuthHeader(token))
      .send(createSchedulePayload());

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.schedule).toEqual(
      expect.objectContaining({
        title: 'Algebra study',
        subject: 'Math',
        priority: 'HIGH',
        memo: 'Chapter 1'
      })
    );

    const scheduleId = createResponse.body.schedule.id;

    const listResponse = await request(app)
      .get('/api/schedules')
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.schedules).toHaveLength(1);

    const detailResponse = await request(app)
      .get(`/api/schedules/${scheduleId}`)
      .set(createAuthHeader(token));

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.schedule.tasks).toEqual([]);

    const updateResponse = await request(app)
      .patch(`/api/schedules/${scheduleId}`)
      .set(createAuthHeader(token))
      .send({
        title: 'Updated schedule',
        priority: 'LOW'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.schedule.title).toBe('Updated schedule');
    expect(updateResponse.body.schedule.priority).toBe('LOW');

    const deleteResponse = await request(app)
      .delete(`/api/schedules/${scheduleId}`)
      .set(createAuthHeader(token));

    expect(deleteResponse.status).toBe(200);

    const notFoundResponse = await request(app)
      .get(`/api/schedules/${scheduleId}`)
      .set(createAuthHeader(token));

    expect(notFoundResponse.status).toBe(404);
  });

  it('rejects invalid schedule payloads', async () => {
    const { token } = await registerTestUser();

    const missingRequiredResponse = await request(app)
      .post('/api/schedules')
      .set(createAuthHeader(token))
      .send({
        subject: 'Math'
      });

    expect(missingRequiredResponse.status).toBe(400);

    const invalidPriorityResponse = await request(app)
      .post('/api/schedules')
      .set(createAuthHeader(token))
      .send(createSchedulePayload({ priority: 'URGENT' }));

    expect(invalidPriorityResponse.status).toBe(400);
  });

  it('blocks access to another user schedule', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser({ loginId: 'other_schedule' });
    const schedule = await createTestSchedule(ownerToken);

    const response = await request(app)
      .get(`/api/schedules/${schedule.id}`)
      .set(createAuthHeader(otherToken));

    expect(response.status).toBe(404);
  });
});

describe('Task API', () => {
  it('rejects unauthenticated task requests', async () => {
    const response = await request(app).get('/api/tasks');

    expect(response.status).toBe(401);
  });

  it('creates, lists, updates status, updates, and deletes a task for the current user', async () => {
    const { token } = await registerTestUser();
    const schedule = await createTestSchedule(token);

    const createResponse = await request(app)
      .post('/api/tasks')
      .set(createAuthHeader(token))
      .send({
        title: '  Write summary  ',
        scheduleId: schedule.id,
        dueDate: '2026-06-02T09:00:00.000Z',
        priority: 'HIGH',
        memo: 'Two pages'
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.task).toEqual(
      expect.objectContaining({
        title: 'Write summary',
        scheduleId: schedule.id,
        status: 'TODO',
        priority: 'HIGH'
      })
    );

    const taskId = createResponse.body.task.id;

    const listResponse = await request(app)
      .get(`/api/tasks?scheduleId=${schedule.id}`)
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.tasks).toHaveLength(1);

    const statusResponse = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set(createAuthHeader(token))
      .send({
        status: 'IN_PROGRESS'
      });

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.task.status).toBe('IN_PROGRESS');

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set(createAuthHeader(token))
      .send({
        title: 'Final summary',
        scheduleId: null,
        memo: null
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.task.title).toBe('Final summary');
    expect(updateResponse.body.task.scheduleId).toBeNull();

    const deleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(createAuthHeader(token));

    expect(deleteResponse.status).toBe(200);

    const secondDeleteResponse = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set(createAuthHeader(token));

    expect(secondDeleteResponse.status).toBe(404);
  });

  it('blocks task creation for another user schedule', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser({ loginId: 'other_task' });
    const schedule = await createTestSchedule(ownerToken);

    const response = await request(app)
      .post('/api/tasks')
      .set(createAuthHeader(otherToken))
      .send({
        title: 'Unauthorized task',
        scheduleId: schedule.id
      });

    expect(response.status).toBe(404);
  });

  it('blocks access to another user task', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser({ loginId: 'other_task_owner' });
    const task = await createTestTask(ownerToken);

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set(createAuthHeader(otherToken))
      .send({
        status: 'DONE'
      });

    expect(response.status).toBe(404);
  });

  it('rejects invalid task status values', async () => {
    const { token } = await registerTestUser();
    const task = await createTestTask(token);

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/status`)
      .set(createAuthHeader(token))
      .send({
        status: 'BLOCKED'
      });

    expect(response.status).toBe(400);
  });
});
