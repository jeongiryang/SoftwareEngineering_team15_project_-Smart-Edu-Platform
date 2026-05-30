const mockUsers = [
  {
    id: 1,
    loginId: 'dev_user',
    name: '일반 사용자',
    passwordHash: 'hashed-user-password',
    role: 'USER',
    status: 'ACTIVE'
  },
  {
    id: 2,
    loginId: 'admin_user',
    name: '관리자 사용자',
    passwordHash: 'hashed-admin-password',
    role: 'ADMIN',
    status: 'ACTIVE'
  }
];

const mockPosts = [
  {
    id: 991,
    userId: 1,
    category: 'QUESTION',
    title: '학습 질문',
    content: '디자인 패턴 질문입니다.',
    reported: false,
    user: { id: 1, loginId: 'dev_user', name: '일반 사용자' }
  },
  {
    id: 992,
    userId: 1,
    category: 'FREE',
    title: '부적절한 광고',
    content: '스팸 링크',
    reported: true,
    user: { id: 1, loginId: 'dev_user', name: '일반 사용자' }
  }
];

const mockComments = [
  {
    id: 991,
    postId: 991,
    userId: 1,
    content: '좋은 질문이네요.',
    reported: false,
    user: { id: 1, loginId: 'dev_user', name: '일반 사용자' },
    post: { id: 991, title: '학습 질문' }
  },
  {
    id: 992,
    postId: 991,
    userId: 1,
    content: '부적절한 욕설',
    reported: true,
    user: { id: 1, loginId: 'dev_user', name: '일반 사용자' },
    post: { id: 991, title: '학습 질문' }
  }
];

const mockChallenges = [
  {
    id: 991,
    creatorId: 1,
    title: '집중 챌린지',
    description: '공부합시다',
    goalMinutes: 60,
    status: 'IN_PROGRESS'
  }
];

const mockActions = [];

// Mock repositories
jest.mock('../src/repositories/user.repository', () => ({
  findUserById: jest.fn(async (id) => mockUsers.find((u) => u.id === Number(id)) || null),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((u) => u.loginId === loginId) || null)
}));

jest.mock('../src/repositories/admin.repository', () => ({
  findAllUsers: jest.fn(async () => [...mockUsers]),
  findUserById: jest.fn(async (id) => mockUsers.find((u) => u.id === Number(id)) || null),
  updateUserStatusAndLog: jest.fn(async (adminId, userId, status, reason) => {
    const userIndex = mockUsers.findIndex((u) => u.id === Number(userId));
    if (userIndex !== -1) {
      mockUsers[userIndex].status = status;
      mockActions.push({
        id: mockActions.length + 1,
        adminId,
        targetType: 'USER',
        targetId: userId,
        actionType: 'SUSPEND_USER',
        reason,
        createdAt: new Date(),
        admin: { id: adminId, loginId: 'admin_user', name: '관리자 사용자' }
      });
      return mockUsers[userIndex];
    }
    return null;
  }),
  findReportedPosts: jest.fn(async () => mockPosts.filter((p) => p.reported)),
  findReportedComments: jest.fn(async () => mockComments.filter((c) => c.reported)),
  findAdminActions: jest.fn(async () => [...mockActions]),
  findPostById: jest.fn(async (id) => mockPosts.find((p) => p.id === Number(id)) || null),
  deletePostAndLog: jest.fn(async (adminId, postId, reason) => {
    const postIndex = mockPosts.findIndex((p) => p.id === Number(postId));
    if (postIndex !== -1) {
      const deletedPost = mockPosts.splice(postIndex, 1)[0];
      // delete comments belonging to the post
      for (let i = mockComments.length - 1; i >= 0; i--) {
        if (mockComments[i].postId === Number(postId)) {
          mockComments.splice(i, 1);
        }
      }
      mockActions.push({
        id: mockActions.length + 1,
        adminId,
        targetType: 'POST',
        targetId: postId,
        actionType: 'HIDE_POST',
        reason,
        createdAt: new Date(),
        admin: { id: adminId, loginId: 'admin_user', name: '관리자 사용자' }
      });
      return deletedPost;
    }
    return null;
  }),
  dismissPostReport: jest.fn(async (postId) => {
    const postIndex = mockPosts.findIndex((p) => p.id === Number(postId));
    if (postIndex !== -1) {
      mockPosts[postIndex].reported = false;
      return mockPosts[postIndex];
    }
    return null;
  }),
  findCommentById: jest.fn(async (id) => mockComments.find((c) => c.id === Number(id)) || null),
  deleteCommentAndLog: jest.fn(async (adminId, commentId, reason) => {
    const commentIndex = mockComments.findIndex((c) => c.id === Number(commentId));
    if (commentIndex !== -1) {
      const deletedComment = mockComments.splice(commentIndex, 1)[0];
      mockActions.push({
        id: mockActions.length + 1,
        adminId,
        targetType: 'COMMENT',
        targetId: commentId,
        actionType: 'DELETE_COMMENT',
        reason,
        createdAt: new Date(),
        admin: { id: adminId, loginId: 'admin_user', name: '관리자 사용자' }
      });
      return deletedComment;
    }
    return null;
  }),
  dismissCommentReport: jest.fn(async (commentId) => {
    const commentIndex = mockComments.findIndex((c) => c.id === Number(commentId));
    if (commentIndex !== -1) {
      mockComments[commentIndex].reported = false;
      return mockComments[commentIndex];
    }
    return null;
  }),
  findChallengeById: jest.fn(async (id) => mockChallenges.find((ch) => ch.id === Number(id)) || null),
  closeChallengeAndLog: jest.fn(async (adminId, challengeId, reason) => {
    const chIndex = mockChallenges.findIndex((ch) => ch.id === Number(challengeId));
    if (chIndex !== -1) {
      mockChallenges[chIndex].status = 'CLOSED';
      mockActions.push({
        id: mockActions.length + 1,
        adminId,
        targetType: 'CHALLENGE',
        targetId: challengeId,
        actionType: 'MODERATE_CHALLENGE',
        reason,
        createdAt: new Date(),
        admin: { id: adminId, loginId: 'admin_user', name: '관리자 사용자' }
      });
      return mockChallenges[chIndex];
    }
    return null;
  })
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEventToUsers: jest.fn()
}));

const request = require('supertest');
const app = require('../src/app');
const { broadcastRealtimeEventToUsers } = require('../src/realtime/websocket.server');
const { signToken } = require('../src/utils/jwt');
const { createAuthHeader } = require('./helpers/auth.helper');
const { expectNoPasswordHash } = require('./helpers/assert.helper');

const protectedAdminEndpoints = [
  { method: 'get', path: '/api/admin/users' },
  {
    method: 'patch',
    path: '/api/admin/users/1/status',
    body: { status: 'SUSPENDED', reason: 'policy violation' }
  },
  { method: 'get', path: '/api/admin/reports' },
  {
    method: 'patch',
    path: '/api/admin/posts/992/moderation',
    body: { action: 'KEEP' }
  },
  {
    method: 'patch',
    path: '/api/admin/comments/992/moderation',
    body: { action: 'KEEP' }
  },
  {
    method: 'patch',
    path: '/api/admin/challenges/991/moderation',
    body: { action: 'CLOSE' }
  }
];

function sendAdminRequest({ method, path, token, body }) {
  const requestBuilder = request(app)[method](path);

  if (token) {
    requestBuilder.set(createAuthHeader(token));
  }

  if (body) {
    requestBuilder.send(body);
  }

  return requestBuilder;
}

describe('Admin APIs', () => {
  let userToken;
  let adminToken;

  beforeAll(() => {
    userToken = signToken({ id: 1, role: 'USER' });
    adminToken = signToken({ id: 2, role: 'ADMIN' });
  });

  beforeEach(() => {
    // Reset state
    mockUsers[0].status = 'ACTIVE';
    mockUsers[1].status = 'ACTIVE';
    mockActions.length = 0;
    broadcastRealtimeEventToUsers.mockClear();

    // Reset posts
    mockPosts.length = 0;
    mockPosts.push(
      {
        id: 991,
        userId: 1,
        category: 'QUESTION',
        title: '학습 질문',
        content: '디자인 패턴 질문입니다.',
        reported: false,
        user: { id: 1, loginId: 'dev_user', name: '일반 사용자' }
      },
      {
        id: 992,
        userId: 1,
        category: 'FREE',
        title: '부적절한 광고',
        content: '스팸 링크',
        reported: true,
        user: { id: 1, loginId: 'dev_user', name: '일반 사용자' }
      }
    );

    // Reset comments
    mockComments.length = 0;
    mockComments.push(
      {
        id: 991,
        postId: 991,
        userId: 1,
        content: '좋은 질문이네요.',
        reported: false,
        user: { id: 1, loginId: 'dev_user', name: '일반 사용자' },
        post: { id: 991, title: '학습 질문' }
      },
      {
        id: 992,
        postId: 991,
        userId: 1,
        content: '부적절한 욕설',
        reported: true,
        user: { id: 1, loginId: 'dev_user', name: '일반 사용자' },
        post: { id: 991, title: '학습 질문' }
      }
    );

    // Reset challenges
    mockChallenges.length = 0;
    mockChallenges.push({
      id: 991,
      creatorId: 1,
      title: '집중 챌린지',
      description: '공부합시다',
      goalMinutes: 60,
      status: 'IN_PROGRESS'
    });
  });

  describe('Security and Permission checks', () => {
    it.each(protectedAdminEndpoints)(
      'fails if token is missing for $method $path (401)',
      async (endpoint) => {
        const response = await sendAdminRequest(endpoint);
        expect(response.status).toBe(401);
      }
    );

    it.each(protectedAdminEndpoints)(
      'fails if user is not an admin for $method $path (403)',
      async (endpoint) => {
        const response = await sendAdminRequest({ ...endpoint, token: userToken });
        expect(response.status).toBe(403);
      }
    );

    it('allows administrator access on protected endpoint', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
    });

    it('fails with invalid user id path parameter (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/users/abc/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'SUSPENDED' });

      expect(response.status).toBe(400);
    });

    it('fails with non-positive post id path parameter (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/posts/0/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'HIDE' });

      expect(response.status).toBe(400);
    });

    it('fails with invalid comment id path parameter (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/comments/not-number/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DELETE' });

      expect(response.status).toBe(400);
    });

    it('fails with invalid challenge id path parameter (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/challenges/not-number/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'CLOSE' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/users', () => {
    it('returns list of users for administrator', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      response.body.users.forEach((user) => {
        expectNoPasswordHash(user);
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('token');
      });
    });
  });

  describe('PATCH /api/admin/users/:userId/status', () => {
    it('updates user status and registers action', async () => {
      const response = await request(app)
        .patch('/api/admin/users/1/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'SUSPENDED', reason: '부적절한 발언' });

      expect(response.status).toBe(200);
      expect(response.body.user.status).toBe('SUSPENDED');
      expect(response.body.action.targetType).toBe('USER');
      expect(response.body.action.actionType).toBe('SUSPEND_USER');
      expect(response.body.action.status).toBe('SUSPENDED');
      expect(response.body.action.reason).toBe('부적절한 발언');
      expect(broadcastRealtimeEventToUsers).toHaveBeenCalledWith(
        [1],
        'account.status.updated',
        expect.objectContaining({
          status: 'SUSPENDED',
          reason: 'ADMIN_STATUS_CHANGE',
          message: 'Account status changed to SUSPENDED',
          changedAt: expect.any(String)
        })
      );
    });

    it('fails if administrator tries to suspend own account (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/users/2/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'SUSPENDED', reason: 'self lock test' });

      expect(response.status).toBe(400);
      expect(mockUsers[1].status).toBe('ACTIVE');
      expect(broadcastRealtimeEventToUsers).not.toHaveBeenCalled();
    });

    it('fails if administrator tries to deactivate own account (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/users/2/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'DEACTIVATED', reason: 'self lock test' });

      expect(response.status).toBe(400);
      expect(mockUsers[1].status).toBe('ACTIVE');
    });

    it('fails if target user does not exist (404)', async () => {
      const response = await request(app)
        .patch('/api/admin/users/999999/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'SUSPENDED', reason: 'missing user' });

      expect(response.status).toBe(404);
    });

    it('fails with invalid status (400)', async () => {
      const response = await request(app)
        .patch('/api/admin/users/1/status')
        .set(createAuthHeader(adminToken))
        .send({ status: 'INVALID_STATUS', reason: '오류 유도' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/reports', () => {
    it('returns reported posts, comments and admin actions', async () => {
      const response = await request(app)
        .get('/api/admin/reports')
        .set(createAuthHeader(adminToken));

      expect(response.status).toBe(200);
      expect(response.body.reportedPosts).toHaveLength(1);
      expect(response.body.reportedPosts[0].id).toBe(992);
      expect(response.body.reportedComments).toHaveLength(1);
      expect(response.body.reportedComments[0].id).toBe(992);
    });
  });

  describe('PATCH /api/admin/posts/:postId/moderation', () => {
    it('hides (deletes) post and logs action', async () => {
      const response = await request(app)
        .patch('/api/admin/posts/992/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'HIDE', reason: '광고글 삭제' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted by admin moderation');
      expect(mockPosts.find(p => p.id === 992)).toBeUndefined();
    });

    it('fails if target post does not exist (404)', async () => {
      const response = await request(app)
        .patch('/api/admin/posts/999999/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'HIDE', reason: 'missing post' });

      expect(response.status).toBe(404);
    });

    it('keeps post and dismisses report', async () => {
      const response = await request(app)
        .patch('/api/admin/posts/992/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'KEEP' });

      expect(response.status).toBe(200);
      expect(response.body.post.reported).toBe(false);
      expect(mockPosts.find(p => p.id === 992)).toBeDefined();
    });
  });

  describe('PATCH /api/admin/comments/:commentId/moderation', () => {
    it('deletes comment and logs action', async () => {
      const response = await request(app)
        .patch('/api/admin/comments/992/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DELETE', reason: '욕설 스팸' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('deleted successfully');
      expect(mockComments.find(c => c.id === 992)).toBeUndefined();
    });

    it('fails if target comment does not exist (404)', async () => {
      const response = await request(app)
        .patch('/api/admin/comments/999999/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'DELETE', reason: 'missing comment' });

      expect(response.status).toBe(404);
    });

    it('keeps comment and dismisses report', async () => {
      const response = await request(app)
        .patch('/api/admin/comments/992/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'KEEP' });

      expect(response.status).toBe(200);
      expect(response.body.comment.reported).toBe(false);
      expect(mockComments.find(c => c.id === 992)).toBeDefined();
    });
  });

  describe('PATCH /api/admin/challenges/:challengeId/moderation', () => {
    it('closes study challenge and logs action', async () => {
      const response = await request(app)
        .patch('/api/admin/challenges/991/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'CLOSE', reason: '부적절한 챌린지 강제 종료' });

      expect(response.status).toBe(200);
      expect(response.body.challenge.status).toBe('CLOSED');
      expect(response.body.message).toContain('closed successfully');
    });

    it('fails if target challenge does not exist (404)', async () => {
      const response = await request(app)
        .patch('/api/admin/challenges/999999/moderation')
        .set(createAuthHeader(adminToken))
        .send({ action: 'CLOSE', reason: 'missing challenge' });

      expect(response.status).toBe(404);
    });
  });
});
