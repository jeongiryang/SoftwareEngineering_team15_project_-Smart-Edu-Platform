const mockUsers = [
  {
    id: 1,
    loginId: 'dev_user',
    name: 'Demo User',
    passwordHash: 'hashed-user-password',
    role: 'USER',
    status: 'ACTIVE'
  },
  {
    id: 2,
    loginId: 'admin_user',
    name: 'Admin User',
    passwordHash: 'hashed-admin-password',
    role: 'ADMIN',
    status: 'ACTIVE'
  }
];

const defaultMaintenanceSetting = {
  enabled: false,
  title: '사각사각 업데이트 중',
  message: '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.',
  estimatedEndAt: null,
  updatedAt: new Date('2026-05-29T12:00:00.000Z')
};

let mockMaintenanceSetting = { ...defaultMaintenanceSetting };

jest.mock('../src/repositories/user.repository', () => ({
  findUserById: jest.fn(async (id) => mockUsers.find((u) => u.id === Number(id)) || null),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((u) => u.loginId === loginId) || null)
}));

jest.mock('../src/repositories/system.repository', () => ({
  findMaintenanceSetting: jest.fn(async () => mockMaintenanceSetting),
  upsertMaintenanceSetting: jest.fn(async (data) => {
    mockMaintenanceSetting = {
      ...mockMaintenanceSetting,
      ...data,
      updatedAt: new Date('2026-05-29T13:00:00.000Z')
    };

    return mockMaintenanceSetting;
  })
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEvent: jest.fn(() => ({
    clientCount: 0,
    event: {
      sentAt: '2026-05-29T13:00:00.000Z'
    }
  }))
}));

const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/jwt');
const { createAuthHeader } = require('./helpers/auth.helper');
const { broadcastRealtimeEvent } = require('../src/realtime/websocket.server');

describe('System maintenance APIs', () => {
  let userToken;
  let adminToken;

  beforeAll(() => {
    userToken = signToken({ id: 1, role: 'USER' });
    adminToken = signToken({ id: 2, role: 'ADMIN' });
  });

  beforeEach(() => {
    mockMaintenanceSetting = { ...defaultMaintenanceSetting };
    broadcastRealtimeEvent.mockClear();
  });

  describe('GET /api/system/status', () => {
    it('returns public maintenance status without authentication', async () => {
      const response = await request(app).get('/api/system/status');

      expect(response.status).toBe(200);
      expect(response.body.maintenance).toMatchObject({
        enabled: false,
        title: defaultMaintenanceSetting.title,
        message: defaultMaintenanceSetting.message,
        estimatedEndAt: null
      });
      expect(response.body.maintenance).not.toHaveProperty('passwordHash');
      expect(response.body.maintenance).not.toHaveProperty('token');
    });
  });

  describe('Admin maintenance controls', () => {
    it('requires authentication for admin maintenance read', async () => {
      const response = await request(app).get('/api/admin/system/maintenance');

      expect(response.status).toBe(401);
    });

    it('rejects non-admin maintenance updates', async () => {
      const response = await request(app)
        .patch('/api/admin/system/maintenance')
        .set(createAuthHeader(userToken))
        .send({ enabled: true });

      expect(response.status).toBe(403);
      expect(mockMaintenanceSetting.enabled).toBe(false);
    });

    it('returns maintenance setting to administrator', async () => {
      const response = await request(app)
        .get('/api/admin/system/maintenance')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.maintenance.enabled).toBe(false);
    });

    it('allows administrator to enable maintenance mode', async () => {
      const response = await request(app)
        .patch('/api/admin/system/maintenance')
        .set(createAuthHeader(adminToken))
        .send({
          enabled: true,
          title: '점검 안내',
          message: '새 기능 반영을 위해 잠시 점검합니다.',
          estimatedEndAt: '2026-05-29T15:00:00.000Z'
        });

      expect(response.status).toBe(200);
      expect(response.body.maintenance.enabled).toBe(true);
      expect(response.body.maintenance.title).toBe('점검 안내');
      expect(response.body.maintenance.message).toBe('새 기능 반영을 위해 잠시 점검합니다.');
      expect(new Date(response.body.maintenance.estimatedEndAt).toISOString()).toBe('2026-05-29T15:00:00.000Z');
      expect(broadcastRealtimeEvent).toHaveBeenCalledWith(
        'maintenance.updated',
        expect.objectContaining({
          maintenance: expect.objectContaining({
            enabled: true,
            title: response.body.maintenance.title
          })
        })
      );
    });

    it('rejects invalid maintenance payloads', async () => {
      const response = await request(app)
        .patch('/api/admin/system/maintenance')
        .set(createAuthHeader(adminToken))
        .send({
          enabled: 'true',
          unsupported: 'field'
        });

      expect(response.status).toBe(400);
      expect(mockMaintenanceSetting.enabled).toBe(false);
    });

    it('rejects empty title and message', async () => {
      const response = await request(app)
        .patch('/api/admin/system/maintenance')
        .set(createAuthHeader(adminToken))
        .send({
          title: '   ',
          message: ''
        });

      expect(response.status).toBe(400);
    });

    it('broadcasts administrator notices to realtime clients', async () => {
      const response = await request(app)
        .post('/api/admin/system/notice')
        .set(createAuthHeader(adminToken))
        .send({
          level: 'warning',
          title: 'Service notice',
          message: 'Maintenance starts soon.'
        });

      expect(response.status).toBe(200);
      expect(response.body.notice).toMatchObject({
        level: 'warning',
        title: 'Service notice',
        message: 'Maintenance starts soon.'
      });
      expect(broadcastRealtimeEvent).toHaveBeenCalledWith('admin.notice', {
        notice: response.body.notice
      });
    });

    it('rejects invalid administrator notice payloads', async () => {
      const response = await request(app)
        .post('/api/admin/system/notice')
        .set(createAuthHeader(adminToken))
        .send({
          level: 'critical',
          title: 'Notice',
          message: 'Invalid level.'
        });

      expect(response.status).toBe(400);
      expect(broadcastRealtimeEvent).not.toHaveBeenCalled();
    });

    it('rejects non-admin administrator notice broadcasts', async () => {
      const response = await request(app)
        .post('/api/admin/system/notice')
        .set(createAuthHeader(userToken))
        .send({
          title: 'Notice',
          message: 'User cannot broadcast.'
        });

      expect(response.status).toBe(403);
      expect(broadcastRealtimeEvent).not.toHaveBeenCalled();
    });
  });
});
