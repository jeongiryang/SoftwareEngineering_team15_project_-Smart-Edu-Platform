const mockUsers = [];
const mockPosts = [];
const mockBookmarks = [];
let mockNextUserId = 1;
let mockNextPostId = 1;
let mockNextBookmarkId = 1;

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
      comments: 0
    }
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

jest.mock('../src/repositories/community.repository', () => ({
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
  deleteBookmark: jest.fn(async (postId, userId) => {
    const index = mockBookmarks.findIndex(
      (bookmark) => bookmark.postId === Number(postId) && bookmark.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockBookmarks.splice(index, 1);

    return 1;
  }),
  findPostById: jest.fn(async (id) => {
    const post = mockPosts.find((item) => item.id === Number(id));

    return post ? mockBuildRepositoryPost(post) : null;
  }),
  upsertBookmark: jest.fn(async (postId, userId) => {
    const existingBookmark = mockBookmarks.find(
      (bookmark) => bookmark.postId === Number(postId) && bookmark.userId === Number(userId)
    );

    if (existingBookmark) {
      return existingBookmark;
    }

    const bookmark = {
      id: mockNextBookmarkId,
      postId: Number(postId),
      userId: Number(userId),
      createdAt: new Date(Date.now() + mockNextBookmarkId)
    };

    mockNextBookmarkId += 1;
    mockBookmarks.push(bookmark);

    return bookmark;
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
      title: 'Bookmark target post',
      content: 'Bookmark target content',
      ...overrides
    });

  return response.body.post;
}

function expectSafeBookmarkPayload(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
  expect(serialized).not.toContain('passwordHash');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockPosts.length = 0;
  mockBookmarks.length = 0;
  mockNextUserId = 1;
  mockNextPostId = 1;
  mockNextBookmarkId = 1;
  jest.clearAllMocks();
});

describe('Community Bookmark API', () => {
  it.each([
    { method: 'post', path: '/api/community/posts/1/bookmarks' },
    { method: 'delete', path: '/api/community/posts/1/bookmarks' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it.each([
    { method: 'post', path: '/api/community/posts/abc/bookmarks' },
    { method: 'post', path: '/api/community/posts/0/bookmarks' },
    { method: 'delete', path: '/api/community/posts/-1/bookmarks' },
    { method: 'delete', path: '/api/community/posts/abc/bookmarks' }
  ])('rejects invalid postId for $method $path', async ({ method, path }) => {
    const { token } = await registerTestUser();

    const response = await request(app)[method](path)
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when creating a bookmark for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts/999/bookmarks')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when deleting a bookmark for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/community/posts/999/bookmarks')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it.each([
    { userId: 999 },
    { postId: 999 },
    { reported: true }
  ])('rejects unsupported bookmark fields %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('creates a bookmark for the current user without sensitive fields', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(201);
    expect(response.body.bookmark).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: user.id
      })
    );
    expect(mockBookmarks).toHaveLength(1);
    expect(communityRepository.upsertBookmark).toHaveBeenCalledWith(post.id, user.id);
    expectSafeBookmarkPayload(response.body);
  });

  it('does not create duplicate rows when the same post is bookmarked again', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const firstResponse = await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));
    const secondResponse = await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.bookmark.id).toBe(firstResponse.body.bookmark.id);
    expect(mockBookmarks).toHaveLength(1);
  });

  it('deletes the current user bookmark', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Community bookmark deleted successfully' });
    expect(mockBookmarks).toHaveLength(0);
  });

  it('returns 404 when deleting a missing current user bookmark', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('does not affect other users bookmarks when deleting the current user bookmark', async () => {
    const owner = await registerTestUser();
    const other = await registerTestUser();
    const post = await createTestPost(owner.token);

    await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(owner.token));
    await request(app)
      .post(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(other.token));

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/bookmarks`)
      .set(createAuthHeader(owner.token));

    expect(response.status).toBe(200);
    expect(mockBookmarks).toHaveLength(1);
    expect(mockBookmarks[0]).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: other.user.id
      })
    );
  });
});
