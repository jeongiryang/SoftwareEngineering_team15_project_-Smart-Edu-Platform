const mockUsers = [];
const mockPosts = [];
const mockComments = [];
const mockReports = [];
let mockNextUserId = 1;
let mockNextPostId = 1;
let mockNextCommentId = 1;
let mockNextReportId = 1;

function mockBuildAuthor(userId) {
  const user = mockUsers.find((item) => item.id === Number(userId));

  return user
    ? {
        id: user.id,
        name: user.name
      }
    : null;
}

function mockBuildRepositoryPost(post) {
  return {
    ...post,
    user: mockBuildAuthor(post.userId),
    _count: {
      comments: mockComments.filter((comment) => comment.postId === post.id).length
    }
  };
}

function mockBuildRepositoryComment(comment) {
  return {
    ...comment,
    user: mockBuildAuthor(comment.userId)
  };
}

function mockBuildReport(overrides = {}) {
  const now = new Date(Date.now() + mockNextReportId);
  const report = {
    id: mockNextReportId,
    reporterId: overrides.reporterId,
    targetType: overrides.targetType,
    postId: overrides.postId ?? null,
    commentId: overrides.commentId ?? null,
    reason: overrides.reason,
    status: 'PENDING',
    resolvedById: null,
    resolvedAt: null,
    resolutionNote: null,
    createdAt: now,
    updatedAt: now
  };

  mockNextReportId += 1;
  mockReports.push(report);

  return report;
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

jest.mock('../src/repositories/community.repository', () => ({
  createComment: jest.fn(async (postId, userId, data) => {
    const now = new Date(Date.now() + mockNextCommentId);
    const comment = {
      id: mockNextCommentId,
      postId: Number(postId),
      userId: Number(userId),
      reported: false,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    mockNextCommentId += 1;
    mockComments.push(comment);

    return mockBuildRepositoryComment(comment);
  }),
  createCommentReport: jest.fn(async (commentId, reporterId, data) => {
    const comment = mockComments.find((item) => item.id === Number(commentId));
    const report = mockBuildReport({
      reporterId: Number(reporterId),
      targetType: 'COMMENT',
      commentId: Number(commentId),
      reason: data.reason
    });

    comment.reported = true;

    return report;
  }),
  createPost: jest.fn(async (userId, data) => {
    const now = new Date(Date.now() + mockNextPostId);
    const post = {
      id: mockNextPostId,
      userId: Number(userId),
      reported: false,
      ...data,
      createdAt: now,
      updatedAt: now
    };

    mockNextPostId += 1;
    mockPosts.push(post);

    return mockBuildRepositoryPost(post);
  }),
  createPostReport: jest.fn(async (postId, reporterId, data) => {
    const post = mockPosts.find((item) => item.id === Number(postId));
    const report = mockBuildReport({
      reporterId: Number(reporterId),
      targetType: 'POST',
      postId: Number(postId),
      reason: data.reason
    });

    post.reported = true;

    return report;
  }),
  findCommentById: jest.fn(async (id) => {
    const comment = mockComments.find((item) => item.id === Number(id));

    return comment ? mockBuildRepositoryComment(comment) : null;
  }),
  findCommentReportByReporterAndCommentId: jest.fn(async (reporterId, commentId) =>
    mockReports.find(
      (report) =>
        report.reporterId === Number(reporterId) && report.commentId === Number(commentId)
    ) || null
  ),
  findPostById: jest.fn(async (id) => {
    const post = mockPosts.find((item) => item.id === Number(id));

    return post ? mockBuildRepositoryPost(post) : null;
  }),
  findPostReportByReporterAndPostId: jest.fn(async (reporterId, postId) =>
    mockReports.find(
      (report) => report.reporterId === Number(reporterId) && report.postId === Number(postId)
    ) || null
  )
}));

const request = require('supertest');
const app = require('../src/app');
const communityRepository = require('../src/repositories/community.repository');
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

async function createTestPost(token, overrides = {}) {
  const response = await request(app)
    .post('/api/community/posts')
    .set(createAuthHeader(token))
    .send({
      category: 'QUESTION',
      title: 'Report target post',
      content: 'Report target content',
      ...overrides
    });

  return response.body.post;
}

async function createTestComment(token, postId, overrides = {}) {
  const response = await request(app)
    .post(`/api/community/posts/${postId}/comments`)
    .set(createAuthHeader(token))
    .send({
      content: 'Report target comment',
      ...overrides
    });

  return response.body.comment;
}

function expectSafeReportPayload(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('resolvedById');
  expect(serialized).not.toContain('resolvedAt');
  expect(serialized).not.toContain('resolutionNote');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockPosts.length = 0;
  mockComments.length = 0;
  mockReports.length = 0;
  mockNextUserId = 1;
  mockNextPostId = 1;
  mockNextCommentId = 1;
  mockNextReportId = 1;
  jest.clearAllMocks();
});

describe('Community Report API', () => {
  it.each([
    { method: 'post', path: '/api/community/posts/1/reports' },
    { method: 'post', path: '/api/community/comments/1/reports' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({ reason: 'spam' });

    expect(response.status).toBe(401);
  });

  it.each([
    '/api/community/posts/abc/reports',
    '/api/community/posts/0/reports',
    '/api/community/comments/abc/reports',
    '/api/community/comments/-1/reports'
  ])('rejects invalid report target id "%s"', async (path) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post(path)
      .set(createAuthHeader(token))
      .send({ reason: 'spam' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when reporting a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts/999/reports')
      .set(createAuthHeader(token))
      .send({ reason: 'spam' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when reporting a missing comment', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/comments/999/reports')
      .set(createAuthHeader(token))
      .send({ reason: 'spam' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it.each([{}, { reason: '' }, { reason: '   ' }, { reason: 123 }, { reason: null }])(
    'rejects post report invalid reason %p',
    async (payload) => {
      const { token } = await registerTestUser();
      const post = await createTestPost(token);

      const response = await request(app)
        .post(`/api/community/posts/${post.id}/reports`)
        .set(createAuthHeader(token))
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }
  );

  it.each([{}, { reason: '' }, { reason: '   ' }, { reason: 123 }, { reason: null }])(
    'rejects comment report invalid reason %p',
    async (payload) => {
      const { token } = await registerTestUser();
      const post = await createTestPost(token);
      const comment = await createTestComment(token, post.id);

      const response = await request(app)
        .post(`/api/community/comments/${comment.id}/reports`)
        .set(createAuthHeader(token))
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    }
  );

  it('rejects post report reasons longer than 500 characters', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'a'.repeat(501) });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects comment report reasons longer than 500 characters', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'a'.repeat(501) });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    { reason: 'spam', userId: 999 },
    { reason: 'spam', reporterId: 999 },
    { reason: 'spam', postId: 999 },
    { reason: 'spam', commentId: 999 },
    { reason: 'spam', status: 'RESOLVED' },
    { reason: 'spam', resolvedById: 1 },
    { reason: 'spam', resolvedAt: '2026-05-28T00:00:00.000Z' },
    { reason: 'spam', resolutionNote: 'done' }
  ])('rejects unsupported post report fields %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects unsupported comment report fields', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'spam', status: 'DISMISSED' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('creates a post report and marks the post as reported', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: '  inappropriate content  ' });

    expect(response.status).toBe(201);
    expect(response.body.report).toEqual(
      expect.objectContaining({
        id: 1,
        targetType: 'POST',
        postId: post.id,
        commentId: null,
        reason: 'inappropriate content',
        status: 'PENDING'
      })
    );
    expect(mockReports).toHaveLength(1);
    expect(mockReports[0]).toEqual(expect.objectContaining({ reporterId: user.id }));
    expect(mockPosts.find((item) => item.id === post.id).reported).toBe(true);
    expect(communityRepository.createPostReport).toHaveBeenCalledWith(post.id, user.id, {
      reason: 'inappropriate content'
    });
    expectSafeReportPayload(response.body);
  });

  it('creates a comment report and marks the comment as reported', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'abusive comment' });

    expect(response.status).toBe(201);
    expect(response.body.report).toEqual(
      expect.objectContaining({
        id: 1,
        targetType: 'COMMENT',
        postId: null,
        commentId: comment.id,
        reason: 'abusive comment',
        status: 'PENDING'
      })
    );
    expect(mockReports).toHaveLength(1);
    expect(mockReports[0]).toEqual(expect.objectContaining({ reporterId: user.id }));
    expect(mockComments.find((item) => item.id === comment.id).reported).toBe(true);
    expect(communityRepository.createCommentReport).toHaveBeenCalledWith(comment.id, user.id, {
      reason: 'abusive comment'
    });
    expectSafeReportPayload(response.body);
  });

  it('returns 409 when the same user reports the same post twice', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'first report' });
    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'second report' });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
    expect(mockReports).toHaveLength(1);
  });

  it('returns 409 when the same user reports the same comment twice', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'first report' });
    const response = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(token))
      .send({ reason: 'second report' });

    expect(response.status).toBe(409);
    expect(response.body.code).toBe('CONFLICT');
    expect(mockReports).toHaveLength(1);
  });

  it('allows different users to report the same post and comment', async () => {
    const owner = await registerTestUser();
    const firstReporter = await registerTestUser();
    const secondReporter = await registerTestUser();
    const post = await createTestPost(owner.token);
    const comment = await createTestComment(owner.token, post.id);

    const firstPostReport = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(firstReporter.token))
      .send({ reason: 'first post report' });
    const secondPostReport = await request(app)
      .post(`/api/community/posts/${post.id}/reports`)
      .set(createAuthHeader(secondReporter.token))
      .send({ reason: 'second post report' });
    const firstCommentReport = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(firstReporter.token))
      .send({ reason: 'first comment report' });
    const secondCommentReport = await request(app)
      .post(`/api/community/comments/${comment.id}/reports`)
      .set(createAuthHeader(secondReporter.token))
      .send({ reason: 'second comment report' });

    expect(firstPostReport.status).toBe(201);
    expect(secondPostReport.status).toBe(201);
    expect(firstCommentReport.status).toBe(201);
    expect(secondCommentReport.status).toBe(201);
    expect(mockReports).toHaveLength(4);
  });
});

describe('Community Report repository', () => {
  afterEach(() => {
    jest.dontMock('../src/utils/prisma');
  });

  it('creates post reports and updates the reported flag in one transaction', async () => {
    jest.resetModules();

    const report = {
      id: 1,
      targetType: 'POST',
      postId: 3,
      commentId: null,
      reason: 'spam',
      status: 'PENDING',
      createdAt: new Date('2026-05-28T00:00:00.000Z')
    };
    const mockTx = {
      communityReport: {
        create: jest.fn().mockResolvedValue(report)
      },
      boardPost: {
        update: jest.fn().mockResolvedValue({ id: 3, reported: true })
      }
    };
    const mockPrisma = {
      $transaction: jest.fn(async (callback) => callback(mockTx))
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const result = await realCommunityRepository.createPostReport(3, 7, { reason: 'spam' });

    expect(result).toBe(report);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.communityReport.create).toHaveBeenCalledWith({
      data: {
        reporterId: 7,
        targetType: 'POST',
        postId: 3,
        commentId: null,
        status: 'PENDING',
        reason: 'spam'
      },
      select: expect.objectContaining({
        id: true,
        targetType: true,
        postId: true,
        commentId: true,
        reason: true,
        status: true,
        createdAt: true
      })
    });
    expect(mockTx.boardPost.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { reported: true }
    });
  });

  it('creates comment reports and updates the reported flag in one transaction', async () => {
    jest.resetModules();

    const report = {
      id: 1,
      targetType: 'COMMENT',
      postId: null,
      commentId: 5,
      reason: 'spam',
      status: 'PENDING',
      createdAt: new Date('2026-05-28T00:00:00.000Z')
    };
    const mockTx = {
      communityReport: {
        create: jest.fn().mockResolvedValue(report)
      },
      comment: {
        update: jest.fn().mockResolvedValue({ id: 5, reported: true })
      }
    };
    const mockPrisma = {
      $transaction: jest.fn(async (callback) => callback(mockTx))
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const result = await realCommunityRepository.createCommentReport(5, 7, { reason: 'spam' });

    expect(result).toBe(report);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.communityReport.create).toHaveBeenCalledWith({
      data: {
        reporterId: 7,
        targetType: 'COMMENT',
        postId: null,
        commentId: 5,
        status: 'PENDING',
        reason: 'spam'
      },
      select: expect.objectContaining({
        id: true,
        targetType: true,
        postId: true,
        commentId: true,
        reason: true,
        status: true,
        createdAt: true
      })
    });
    expect(mockTx.comment.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { reported: true }
    });
  });
});
