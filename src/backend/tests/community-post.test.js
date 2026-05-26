const mockUsers = [];
const mockPosts = [];
let mockNextUserId = 1;
let mockNextPostId = 1;

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
      comments: post.commentCount || 0
    }
  };
}

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ email, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      email,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE'
    };

    mockNextUserId += 1;
    mockUsers.push(user);

    return user;
  }),
  findUserByEmail: jest.fn(async (email) => mockUsers.find((user) => user.email === email) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null)
}));

jest.mock('../src/repositories/community.repository', () => ({
  createPost: jest.fn(async (userId, data) => {
    const now = new Date(Date.now() + mockNextPostId);
    const post = {
      id: mockNextPostId,
      userId,
      reported: false,
      ...data,
      commentCount: 0,
      createdAt: now,
      updatedAt: now
    };

    mockNextPostId += 1;
    mockPosts.push(post);

    return mockBuildRepositoryPost(post);
  }),
  deletePost: jest.fn(async (id, userId) => {
    const index = mockPosts.findIndex(
      (post) => post.id === Number(id) && post.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockPosts.splice(index, 1);

    return 1;
  }),
  findPostById: jest.fn(async (id) => {
    const post = mockPosts.find((item) => item.id === Number(id));

    return post ? mockBuildRepositoryPost(post) : null;
  }),
  findPostByIdAndUserId: jest.fn(async (id, userId) => {
    const post = mockPosts.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    return post ? mockBuildRepositoryPost(post) : null;
  }),
  findPosts: jest.fn(async ({ page, pageSize, category }) => {
    const filteredPosts = mockPosts
      .filter((post) => !category || post.category === category)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const start = (page - 1) * pageSize;

    return {
      posts: filteredPosts.slice(start, start + pageSize).map(mockBuildRepositoryPost),
      total: filteredPosts.length
    };
  }),
  updatePost: jest.fn(async (id, userId, data) => {
    const post = mockPosts.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    if (!post) {
      return null;
    }

    Object.assign(post, data, { updatedAt: new Date() });

    return mockBuildRepositoryPost(post);
  })
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
      title: '  학습 질문  ',
      content: '  수학 문제 풀이 질문입니다.  ',
      ...overrides
    });

  return response.body.post;
}

function expectSafePostPayload(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
  expect(serialized).not.toContain('@example.com');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockPosts.length = 0;
  mockNextUserId = 1;
  mockNextPostId = 1;
  jest.clearAllMocks();
});

describe('Community Post API', () => {
  it.each([
    { method: 'get', path: '/api/community/posts' },
    {
      method: 'post',
      path: '/api/community/posts',
      body: { category: 'QUESTION', title: '질문', content: '내용' }
    },
    { method: 'get', path: '/api/community/posts/1' },
    { method: 'patch', path: '/api/community/posts/1', body: { title: '수정' } },
    { method: 'delete', path: '/api/community/posts/1' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path, body }) => {
    const response = await request(app)[method](path).send(body || {});

    expect(response.status).toBe(401);
  });

  it('creates a community post for the current user without sensitive fields', async () => {
    const { token, user } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts')
      .set(createAuthHeader(token))
      .send({
        category: 'QUESTION',
        title: '  미적분 질문  ',
        content: '  극한 문제 풀이가 궁금합니다.  '
      });

    expect(response.status).toBe(201);
    expect(response.body.post).toEqual(
      expect.objectContaining({
        userId: user.id,
        category: 'QUESTION',
        title: '미적분 질문',
        content: '극한 문제 풀이가 궁금합니다.',
        commentCount: 0,
        author: {
          id: user.id,
          name: user.name
        }
      })
    );
    expectSafePostPayload(response.body);
  });

  it.each([
    { category: 'QUESTION', title: '', content: '내용' },
    { category: 'QUESTION', title: '제목', content: ' ' },
    { title: '제목', content: '내용' },
    { category: 'FREE', content: '내용' },
    { category: 'FREE', title: '제목' }
  ])('rejects post creation with missing or blank required fields', async (payload) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts')
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects post creation with an invalid category', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts')
      .set(createAuthHeader(token))
      .send({
        category: 'NOTICE',
        title: '공지',
        content: '잘못된 카테고리'
      });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('lists community posts with pagination metadata', async () => {
    const { token } = await registerTestUser();
    const firstPost = await createTestPost(token, { title: '첫 번째 글' });
    const secondPost = await createTestPost(token, { title: '두 번째 글' });

    const response = await request(app)
      .get('/api/community/posts?page=1&pageSize=1')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(secondPost.id);
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 1,
      total: 2,
      totalPages: 2
    });
    expect(firstPost.id).not.toBe(secondPost.id);
    expectSafePostPayload(response.body);
  });

  it.each([
    '/api/community/posts?page=abc',
    '/api/community/posts?page=0',
    '/api/community/posts?pageSize=-1',
    '/api/community/posts?pageSize=51',
    '/api/community/posts?category=NOTICE'
  ])('rejects invalid list query "%s"', async (path) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get(path)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('filters community posts by category', async () => {
    const { token } = await registerTestUser();
    await createTestPost(token, { category: 'QUESTION', title: '질문 글' });
    const freePost = await createTestPost(token, { category: 'FREE', title: '자유 글' });

    const response = await request(app)
      .get('/api/community/posts?category=FREE')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(freePost.id);
    expect(response.body.posts[0].category).toBe('FREE');
  });

  it('reads a single community post', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token, {
      category: 'STUDY_PROOF',
      title: '학습 인증',
      content: '오늘 공부 완료'
    });

    const response = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(
      expect.objectContaining({
        id: post.id,
        category: 'STUDY_PROOF',
        title: '학습 인증',
        content: '오늘 공부 완료',
        commentCount: 0
      })
    );
    expectSafePostPayload(response.body);
  });

  it.each(['abc', '0', '-1'])('rejects invalid postId "%s"', async (postId) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get(`/api/community/posts/${postId}`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for nonexistent community posts', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/posts/999999')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('updates a community post owned by the current user', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .patch(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token))
      .send({
        category: 'FREE',
        title: '  수정된 제목  ',
        content: '수정된 내용'
      });

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(
      expect.objectContaining({
        id: post.id,
        category: 'FREE',
        title: '수정된 제목',
        content: '수정된 내용'
      })
    );
  });

  it('rejects empty community post update payloads', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .patch(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    { title: ' ' },
    { content: '' },
    { category: 'NOTICE' },
    { unsupported: 'field' }
  ])('rejects invalid community post update payloads', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .patch(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('blocks other users from updating a community post', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser();
    const post = await createTestPost(ownerToken);

    const response = await request(app)
      .patch(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(otherToken))
      .send({ title: 'Unauthorized update' });

    expect(response.status).toBe(404);
    expect(communityRepository.updatePost).not.toHaveBeenCalledWith(
      post.id,
      expect.any(Number),
      expect.any(Object)
    );
  });

  it('deletes a community post and returns 404 when it is read again', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const deleteResponse = await request(app)
      .delete(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token));

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body).toEqual({
      message: 'Community post deleted successfully'
    });

    const detailResponse = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token));

    expect(detailResponse.status).toBe(404);
  });

  it('blocks other users from deleting a community post', async () => {
    const { token: ownerToken } = await registerTestUser();
    const { token: otherToken } = await registerTestUser();
    const post = await createTestPost(ownerToken);

    const deleteResponse = await request(app)
      .delete(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(otherToken));

    expect(deleteResponse.status).toBe(404);
    expect(communityRepository.deletePost).not.toHaveBeenCalledWith(post.id, expect.any(Number));

    const ownerReadResponse = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(ownerToken));

    expect(ownerReadResponse.status).toBe(200);
    expect(ownerReadResponse.body.post.title).toBe(post.title);
  });
});

describe('Community Post repository deletePost', () => {
  afterEach(() => {
    jest.dontMock('../src/utils/prisma');
  });

  it('does not delete comments when ownership is not confirmed in transaction', async () => {
    jest.resetModules();

    const transactionClient = {
      boardPost: {
        findFirst: jest.fn().mockResolvedValue(null),
        deleteMany: jest.fn()
      },
      comment: {
        deleteMany: jest.fn()
      }
    };
    const mockPrisma = {
      $transaction: jest.fn(async (callback) => callback(transactionClient))
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const deletedCount = await realCommunityRepository.deletePost(123, 456);

    expect(deletedCount).toBe(0);
    expect(transactionClient.boardPost.findFirst).toHaveBeenCalledWith({
      where: {
        id: 123,
        userId: 456
      },
      select: {
        id: true
      }
    });
    expect(transactionClient.comment.deleteMany).not.toHaveBeenCalled();
    expect(transactionClient.boardPost.deleteMany).not.toHaveBeenCalled();
  });
});
