const mockUsers = [
  {
    id: 1,
    loginId: 'reporter_user',
    name: 'Reporter User',
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
  },
  {
    id: 3,
    loginId: 'author_user',
    name: 'Author User',
    passwordHash: 'hashed-author-password',
    role: 'USER',
    status: 'ACTIVE'
  }
];

const mockPosts = [];
const mockComments = [];
const mockReports = [];

function mockClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mockSelectSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

function mockIncludeReport(report) {
  const post = report.postId ? mockPosts.find((item) => item.id === report.postId) : null;
  const comment = report.commentId ? mockComments.find((item) => item.id === report.commentId) : null;
  const reporter = mockUsers.find((item) => item.id === report.reporterId);
  const resolvedBy = report.resolvedById
    ? mockUsers.find((item) => item.id === report.resolvedById)
    : null;

  return mockClone({
    ...report,
    reporter: mockSelectSafeUser(reporter),
    resolvedBy: mockSelectSafeUser(resolvedBy),
    post: post
      ? {
          id: post.id,
          category: post.category,
          title: post.title,
          reported: post.reported,
          user: mockSelectSafeUser(mockUsers.find((item) => item.id === post.userId))
        }
      : null,
    comment: comment
      ? {
          id: comment.id,
          postId: comment.postId,
          content: comment.content,
          reported: comment.reported,
          user: mockSelectSafeUser(mockUsers.find((item) => item.id === comment.userId)),
          post: {
            id: comment.postId,
            title: mockPosts.find((item) => item.id === comment.postId)?.title
          }
        }
      : null
  });
}

function resetMockData() {
  mockPosts.length = 0;
  mockPosts.push(
    {
      id: 101,
      userId: 3,
      category: 'QUESTION',
      title: 'Reported question',
      content: 'This post was reported.',
      reported: true
    },
    {
      id: 102,
      userId: 3,
      category: 'FREE',
      title: 'Clean post',
      content: 'This post has no pending reports.',
      reported: false
    }
  );

  mockComments.length = 0;
  mockComments.push(
    {
      id: 201,
      postId: 101,
      userId: 3,
      content: 'Reported comment',
      reported: true
    },
    {
      id: 202,
      postId: 102,
      userId: 3,
      content: 'Clean comment',
      reported: false
    }
  );

  const now = new Date('2026-05-28T00:00:00.000Z');
  mockReports.length = 0;
  mockReports.push(
    {
      id: 301,
      reporterId: 1,
      targetType: 'POST',
      postId: 101,
      commentId: null,
      reason: 'Spam post',
      status: 'PENDING',
      resolvedById: null,
      resolvedAt: null,
      resolutionNote: null,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 302,
      reporterId: 1,
      targetType: 'COMMENT',
      postId: null,
      commentId: 201,
      reason: 'Bad comment',
      status: 'PENDING',
      resolvedById: null,
      resolvedAt: null,
      resolutionNote: null,
      createdAt: new Date('2026-05-28T00:01:00.000Z'),
      updatedAt: new Date('2026-05-28T00:01:00.000Z')
    },
    {
      id: 303,
      reporterId: 1,
      targetType: 'POST',
      postId: 102,
      commentId: null,
      reason: 'Already dismissed',
      status: 'DISMISSED',
      resolvedById: 2,
      resolvedAt: new Date('2026-05-28T00:02:00.000Z'),
      resolutionNote: 'No issue',
      createdAt: new Date('2026-05-28T00:02:00.000Z'),
      updatedAt: new Date('2026-05-28T00:02:00.000Z')
    }
  );
}

jest.mock('../src/repositories/user.repository', () => ({
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null)
}));

jest.mock('../src/repositories/admin.repository', () => ({
  findCommunityReports: jest.fn(async ({ status, targetType, page, pageSize }) => {
    let reports = [...mockReports];

    if (status) {
      reports = reports.filter((report) => report.status === status);
    }

    if (targetType) {
      reports = reports.filter((report) => report.targetType === targetType);
    }

    reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = reports.length;
    const start = (page - 1) * pageSize;

    return {
      reports: reports.slice(start, start + pageSize).map(mockIncludeReport),
      total
    };
  }),
  findCommunityReportById: jest.fn(async (id) => {
    const report = mockReports.find((item) => item.id === Number(id));
    return report ? mockIncludeReport(report) : null;
  }),
  processCommunityReport: jest.fn(async (report, adminId, { status, resolutionNote }) => {
    const reportIndex = mockReports.findIndex((item) => item.id === Number(report.id));

    if (reportIndex === -1) {
      return null;
    }

    mockReports[reportIndex] = {
      ...mockReports[reportIndex],
      status,
      resolvedById: adminId,
      resolvedAt: new Date('2026-05-28T01:00:00.000Z'),
      resolutionNote,
      updatedAt: new Date('2026-05-28T01:00:00.000Z')
    };

    const updatedReport = mockReports[reportIndex];

    if (updatedReport.targetType === 'POST' && updatedReport.postId) {
      const pendingCount = mockReports.filter(
        (item) =>
          item.targetType === 'POST' &&
          item.postId === updatedReport.postId &&
          item.status === 'PENDING'
      ).length;
      const post = mockPosts.find((item) => item.id === updatedReport.postId);

      if (post) {
        post.reported = pendingCount > 0;
      }
    }

    if (updatedReport.targetType === 'COMMENT' && updatedReport.commentId) {
      const pendingCount = mockReports.filter(
        (item) =>
          item.targetType === 'COMMENT' &&
          item.commentId === updatedReport.commentId &&
          item.status === 'PENDING'
      ).length;
      const comment = mockComments.find((item) => item.id === updatedReport.commentId);

      if (comment) {
        comment.reported = pendingCount > 0;
      }
    }

    return mockIncludeReport(updatedReport);
  })
}));

const request = require('supertest');
const app = require('../src/app');
const { signToken } = require('../src/utils/jwt');
const { createAuthHeader } = require('./helpers/auth.helper');

function expectNoSensitiveFields(value) {
  const serialized = JSON.stringify(value);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
}

describe('Admin Community Report API', () => {
  let userToken;
  let adminToken;

  beforeAll(() => {
    userToken = signToken({ id: 1, role: 'USER' });
    adminToken = signToken({ id: 2, role: 'ADMIN' });
  });

  beforeEach(() => {
    resetMockData();
  });

  describe('Security and permission checks', () => {
    it.each([
      { method: 'get', path: '/api/admin/community/reports' },
      {
        method: 'patch',
        path: '/api/admin/community/reports/301',
        body: { action: 'DISMISS' }
      }
    ])('rejects unauthenticated $method $path requests', async ({ method, path, body }) => {
      const response = await request(app)[method](path).send(body);

      expect(response.status).toBe(401);
    });

    it.each([
      { method: 'get', path: '/api/admin/community/reports' },
      {
        method: 'patch',
        path: '/api/admin/community/reports/301',
        body: { action: 'DISMISS' }
      }
    ])('rejects non-admin $method $path requests', async ({ method, path, body }) => {
      const response = await request(app)[method](path)
        .set(createAuthHeader(userToken))
        .send(body);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/admin/community/reports', () => {
    it('lists community reports with pagination metadata and safe user fields', async () => {
      const response = await request(app)
        .get('/api/admin/community/reports')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(3);
      expect(response.body.pagination).toEqual({
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1
      });
      expect(response.body.reports[0]).toHaveProperty('reporter');
      expect(response.body.reports[0]).toHaveProperty('post');
      expectNoSensitiveFields(response.body);
    });

    it('filters reports by status', async () => {
      const response = await request(app)
        .get('/api/admin/community/reports?status=PENDING')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(2);
      response.body.reports.forEach((report) => {
        expect(report.status).toBe('PENDING');
      });
    });

    it('filters reports by targetType', async () => {
      const response = await request(app)
        .get('/api/admin/community/reports?targetType=COMMENT')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(1);
      expect(response.body.reports[0].targetType).toBe('COMMENT');
      expect(response.body.reports[0].comment).toHaveProperty('content');
    });

    it('applies pagination options', async () => {
      const response = await request(app)
        .get('/api/admin/community/reports?page=2&pageSize=1')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.reports).toHaveLength(1);
      expect(response.body.pagination).toEqual({
        page: 2,
        pageSize: 1,
        total: 3,
        totalPages: 3
      });
    });

    it.each([
      '/api/admin/community/reports?page=abc',
      '/api/admin/community/reports?page=0',
      '/api/admin/community/reports?pageSize=-1',
      '/api/admin/community/reports?pageSize=51',
      '/api/admin/community/reports?status=OPEN',
      '/api/admin/community/reports?targetType=USER',
      '/api/admin/community/reports?sort=latest'
    ])('rejects invalid report list query "%s"', async (path) => {
      const response = await request(app).get(path).set(createAuthHeader(adminToken));

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/community/reports/:reportId', () => {
    it('rejects invalid reportId values', async () => {
      const response = await request(app)
        .patch('/api/admin/community/reports/abc')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DISMISS' });

      expect(response.status).toBe(400);
    });

    it('returns 404 for missing reports', async () => {
      const response = await request(app)
        .patch('/api/admin/community/reports/999999')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DISMISS' });

      expect(response.status).toBe(404);
    });

    it.each([
      {},
      { action: 'KEEP' },
      { action: '' },
      { action: 123 },
      { action: 'DISMISS', resolutionNote: 123 },
      { action: 'RESOLVE', resolutionNote: 'a'.repeat(501) },
      { action: 'RESOLVE', status: 'RESOLVED' },
      { action: 'RESOLVE', resolvedById: 1 }
    ])('rejects invalid report process payload %j', async (payload) => {
      const response = await request(app)
        .patch('/api/admin/community/reports/301')
        .set(createAuthHeader(adminToken))
        .send(payload);

      expect(response.status).toBe(400);
    });

    it('dismisses a pending report and clears the post reported flag when no pending reports remain', async () => {
      const response = await request(app)
        .patch('/api/admin/community/reports/301')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DISMISS', resolutionNote: 'Not a violation' });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('DISMISSED');
      expect(response.body.report.resolvedById).toBe(2);
      expect(response.body.report.resolvedAt).toBeTruthy();
      expect(response.body.report.resolutionNote).toBe('Not a violation');
      expect(response.body.report.post.reported).toBe(false);
      expect(mockPosts.find((post) => post.id === 101).reported).toBe(false);
      expectNoSensitiveFields(response.body);
    });

    it('resolves a pending comment report and clears the comment reported flag', async () => {
      const response = await request(app)
        .patch('/api/admin/community/reports/302')
        .set(createAuthHeader(adminToken))
        .send({ action: 'RESOLVE', resolutionNote: 'Handled offline' });

      expect(response.status).toBe(200);
      expect(response.body.report.status).toBe('RESOLVED');
      expect(response.body.report.targetType).toBe('COMMENT');
      expect(response.body.report.comment.reported).toBe(false);
      expect(mockComments.find((comment) => comment.id === 201).reported).toBe(false);
      expectNoSensitiveFields(response.body);
    });

    it('keeps the target reported flag true while another pending report remains', async () => {
      mockReports.push({
        id: 304,
        reporterId: 3,
        targetType: 'POST',
        postId: 101,
        commentId: null,
        reason: 'Second pending report',
        status: 'PENDING',
        resolvedById: null,
        resolvedAt: null,
        resolutionNote: null,
        createdAt: new Date('2026-05-28T00:03:00.000Z'),
        updatedAt: new Date('2026-05-28T00:03:00.000Z')
      });

      const response = await request(app)
        .patch('/api/admin/community/reports/301')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DISMISS' });

      expect(response.status).toBe(200);
      expect(mockPosts.find((post) => post.id === 101).reported).toBe(true);
    });

    it('returns 409 when processing an already handled report', async () => {
      const response = await request(app)
        .patch('/api/admin/community/reports/303')
        .set(createAuthHeader(adminToken))
        .send({ action: 'RESOLVE' });

      expect(response.status).toBe(409);
    });
  });
});
