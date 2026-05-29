const mockUsers = [];
const mockPosts = [];
const mockReactions = [];
let mockNextUserId = 1;
let mockNextPostId = 1;
let mockNextReactionId = 1;

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
  deleteReaction: jest.fn(async (postId, userId) => {
    const index = mockReactions.findIndex(
      (reaction) => reaction.postId === Number(postId) && reaction.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockReactions.splice(index, 1);

    return 1;
  }),
  findPostById: jest.fn(async (id) => {
    const post = mockPosts.find((item) => item.id === Number(id));

    return post ? mockBuildRepositoryPost(post) : null;
  }),
  upsertReaction: jest.fn(async (postId, userId, type) => {
    const existingReaction = mockReactions.find(
      (reaction) => reaction.postId === Number(postId) && reaction.userId === Number(userId)
    );

    if (existingReaction) {
      existingReaction.type = type;
      existingReaction.updatedAt = new Date(Date.now() + mockNextReactionId);

      return existingReaction;
    }

    const now = new Date(Date.now() + mockNextReactionId);
    const reaction = {
      id: mockNextReactionId,
      postId: Number(postId),
      userId: Number(userId),
      type,
      createdAt: now,
      updatedAt: now
    };

    mockNextReactionId += 1;
    mockReactions.push(reaction);

    return reaction;
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
      title: 'Reaction target post',
      content: 'Reaction target content',
      ...overrides
    });

  return response.body.post;
}

function expectSafeReactionPayload(payload) {
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
  mockReactions.length = 0;
  mockNextUserId = 1;
  mockNextPostId = 1;
  mockNextReactionId = 1;
  jest.clearAllMocks();
});

describe('Community Reaction API', () => {
  it.each([
    { method: 'post', path: '/api/community/posts/1/reactions', body: { type: 'LIKE' } },
    { method: 'delete', path: '/api/community/posts/1/reactions' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path, body }) => {
    const response = await request(app)[method](path).send(body || {});

    expect(response.status).toBe(401);
  });

  it.each([
    { method: 'post', path: '/api/community/posts/abc/reactions', body: { type: 'LIKE' } },
    { method: 'post', path: '/api/community/posts/0/reactions', body: { type: 'LIKE' } },
    { method: 'delete', path: '/api/community/posts/-1/reactions' },
    { method: 'delete', path: '/api/community/posts/abc/reactions' }
  ])('rejects invalid postId for $method $path', async ({ method, path, body }) => {
    const { token } = await registerTestUser();

    const response = await request(app)[method](path)
      .set(createAuthHeader(token))
      .send(body || {});

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 when creating a reaction for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts/999/reactions')
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when deleting a reaction for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/community/posts/999/reactions')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it.each([
    {},
    { type: 'LOVE' },
    { type: '' },
    { type: null },
    { type: 123 }
  ])('rejects invalid reaction payload %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it.each([
    { type: 'LIKE', userId: 999 },
    { type: 'LIKE', postId: 999 },
    { type: 'LIKE', reported: true }
  ])('rejects unsupported reaction fields %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('creates a LIKE reaction for the current user without sensitive fields', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });

    expect(response.status).toBe(201);
    expect(response.body.reaction).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: user.id,
        type: 'LIKE'
      })
    );
    expect(mockReactions).toHaveLength(1);
    expect(communityRepository.upsertReaction).toHaveBeenCalledWith(post.id, user.id, 'LIKE');
    expectSafeReactionPayload(response.body);
  });

  it('creates a DISLIKE reaction for the current user', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'DISLIKE' });

    expect(response.status).toBe(201);
    expect(response.body.reaction).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: user.id,
        type: 'DISLIKE'
      })
    );
    expect(mockReactions).toHaveLength(1);
  });

  it('does not create duplicate rows when the same type is requested again', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const firstResponse = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });
    const secondResponse = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });

    expect(firstResponse.status).toBe(201);
    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body.reaction.id).toBe(firstResponse.body.reaction.id);
    expect(secondResponse.body.reaction.type).toBe('LIKE');
    expect(mockReactions).toHaveLength(1);
  });

  it('switches a LIKE reaction to DISLIKE', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });
    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'DISLIKE' });

    expect(response.status).toBe(201);
    expect(response.body.reaction.type).toBe('DISLIKE');
    expect(mockReactions).toHaveLength(1);
  });

  it('switches a DISLIKE reaction to LIKE', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'DISLIKE' });
    const response = await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });

    expect(response.status).toBe(201);
    expect(response.body.reaction.type).toBe('LIKE');
    expect(mockReactions).toHaveLength(1);
  });

  it('deletes the current user reaction', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token))
      .send({ type: 'LIKE' });

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Community reaction deleted successfully' });
    expect(mockReactions).toHaveLength(0);
  });

  it('returns 404 when deleting a missing current user reaction', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('does not affect other users reactions when deleting the current user reaction', async () => {
    const owner = await registerTestUser();
    const other = await registerTestUser();
    const post = await createTestPost(owner.token);

    await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(owner.token))
      .send({ type: 'LIKE' });
    await request(app)
      .post(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(other.token))
      .send({ type: 'DISLIKE' });

    const response = await request(app)
      .delete(`/api/community/posts/${post.id}/reactions`)
      .set(createAuthHeader(owner.token));

    expect(response.status).toBe(200);
    expect(mockReactions).toHaveLength(1);
    expect(mockReactions[0]).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: other.user.id,
        type: 'DISLIKE'
      })
    );
  });
});
