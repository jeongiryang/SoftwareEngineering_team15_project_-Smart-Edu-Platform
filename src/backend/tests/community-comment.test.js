const mockUsers = [];
const mockPosts = [];
const mockComments = [];
let mockNextUserId = 1;
let mockNextPostId = 1;
let mockNextCommentId = 1;

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
    user: mockBuildAuthor(comment.userId),
    _count: {
      replies: mockComments.filter((item) => item.parentId === comment.id).length
    },
    replies: mockComments
      .filter((item) => item.parentId === comment.id)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((item) => ({
        ...item,
        user: mockBuildAuthor(item.userId),
        _count: { replies: 0 }
      }))
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
  deleteComment: jest.fn(async (id, userId) => {
    const index = mockComments.findIndex(
      (comment) => comment.id === Number(id) && comment.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockComments.splice(index, 1);

    return 1;
  }),
  deletePost: jest.fn(async (id, userId) => {
    const index = mockPosts.findIndex(
      (post) => post.id === Number(id) && post.userId === Number(userId)
    );

    if (index === -1) {
      return 0;
    }

    mockComments
      .filter((comment) => comment.postId === Number(id))
      .forEach((comment) => {
        const commentIndex = mockComments.findIndex((item) => item.id === comment.id);
        mockComments.splice(commentIndex, 1);
      });
    mockPosts.splice(index, 1);

    return 1;
  }),
  findCommentByIdAndUserId: jest.fn(async (id, userId) => {
    const comment = mockComments.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    return comment ? mockBuildRepositoryComment(comment) : null;
  }),
  findCommentById: jest.fn(async (id) => {
    const comment = mockComments.find((item) => item.id === Number(id));

    return comment ? mockBuildRepositoryComment(comment) : null;
  }),
  findCommentReactionSummaries: jest.fn(async (commentIds) => {
    const summaries = new Map();

    commentIds.forEach((id) => {
      summaries.set(Number(id), { likeCount: 0, dislikeCount: 0, myReaction: null });
    });

    return summaries;
  }),
  findCommentsByPostId: jest.fn(async ({ postId, page, pageSize }) => {
    const filteredComments = mockComments
      .filter((comment) => comment.postId === Number(postId) && !comment.parentId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const start = (page - 1) * pageSize;

    return {
      comments: filteredComments.slice(start, start + pageSize).map(mockBuildRepositoryComment),
      total: filteredComments.length
    };
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
  updateComment: jest.fn(async (id, userId, data) => {
    const comment = mockComments.find(
      (item) => item.id === Number(id) && item.userId === Number(userId)
    );

    if (!comment) {
      return null;
    }

    Object.assign(comment, data, { updatedAt: new Date() });

    return mockBuildRepositoryComment(comment);
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

const mockBroadcastRealtimeEvent = jest.fn(() => ({ clientCount: 0, event: {} }));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEvent: (...args) => mockBroadcastRealtimeEvent(...args)
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
      title: 'Question title',
      content: 'Question content',
      ...overrides
    });

  return response.body.post;
}

async function createTestComment(token, postId, overrides = {}) {
  const response = await request(app)
    .post(`/api/community/posts/${postId}/comments`)
    .set(createAuthHeader(token))
    .send({
      content: 'First comment',
      ...overrides
    });

  return response.body.comment;
}

function expectSafeCommentPayload(payload) {
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
  mockComments.length = 0;
  mockNextUserId = 1;
  mockNextPostId = 1;
  mockNextCommentId = 1;
  jest.clearAllMocks();
});

describe('Community Comment API', () => {
  it.each([
    { method: 'get', path: '/api/community/posts/1/comments' },
    { method: 'post', path: '/api/community/posts/1/comments', body: { content: 'comment' } },
    { method: 'patch', path: '/api/community/comments/1', body: { content: 'updated' } },
    { method: 'delete', path: '/api/community/comments/1' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path, body }) => {
    const response = await request(app)[method](path).send(body || {});

    expect(response.status).toBe(401);
  });

  it('lists comments for an existing post without sensitive fields', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    await createTestComment(token, post.id, { content: 'first' });
    await createTestComment(token, post.id, { content: 'second' });

    const response = await request(app)
      .get(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.comments).toHaveLength(2);
    expect(response.body.comments.map((comment) => comment.content)).toEqual(['first', 'second']);
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1
    });
    expectSafeCommentPayload(response.body);
  });

  it('rejects comment list requests with invalid postId', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/posts/abc/comments')
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
  });

  it('returns 404 when listing comments for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/posts/999/comments')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
  });

  it.each([
    { query: { page: '0' } },
    { query: { page: '-1' } },
    { query: { page: 'abc' } },
    { query: { pageSize: '0' } },
    { query: { pageSize: '51' } },
    { query: { pageSize: 'abc' } }
  ])('rejects invalid comment pagination query %p', async ({ query }) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .get(`/api/community/posts/${post.id}/comments`)
      .query(query)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
  });

  it('passes comment pagination options to repository', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .get(`/api/community/posts/${post.id}/comments`)
      .query({ page: 2, pageSize: 1 })
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(communityRepository.findCommentsByPostId).toHaveBeenCalledWith({
      postId: post.id,
      page: 2,
      pageSize: 1
    });
  });

  it('creates a comment for the current user without sensitive fields', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token))
      .send({ content: '  useful explanation  ' });

    expect(response.status).toBe(201);
    expect(response.body.comment).toEqual(
      expect.objectContaining({
        postId: post.id,
        userId: user.id,
        content: 'useful explanation',
        author: {
          id: user.id,
          name: user.name
        }
      })
    );
    expect(mockBroadcastRealtimeEvent).toHaveBeenCalledWith('community.comment.created', {
      comment: expect.objectContaining({
        postId: post.id,
        commentId: response.body.comment.id,
        parentId: null,
        isReply: false,
        preview: 'useful explanation',
        author: {
          id: user.id,
          name: user.name
        }
      })
    });
    expectSafeCommentPayload(response.body);
  });

  it('creates a reply for a top-level comment and returns it under the parent list', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const parent = await createTestComment(token, post.id, { content: 'parent comment' });

    const replyResponse = await request(app)
      .post(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token))
      .send({ parentId: parent.id, content: 'reply comment' });

    expect(replyResponse.status).toBe(201);
    expect(replyResponse.body.comment).toEqual(
      expect.objectContaining({
        postId: post.id,
        parentId: parent.id,
        content: 'reply comment'
      })
    );
    expect(mockBroadcastRealtimeEvent).toHaveBeenLastCalledWith('community.reply.created', {
      comment: expect.objectContaining({
        postId: post.id,
        commentId: replyResponse.body.comment.id,
        parentId: parent.id,
        isReply: true,
        preview: 'reply comment'
      })
    });

    const listResponse = await request(app)
      .get(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token));

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.comments).toHaveLength(1);
    expect(listResponse.body.comments[0]).toEqual(
      expect.objectContaining({
        id: parent.id,
        replyCount: 1,
        replies: [
          expect.objectContaining({
            parentId: parent.id,
            content: 'reply comment'
          })
        ]
      })
    );
  });

  it('rejects replies to replies', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const parent = await createTestComment(token, post.id, { content: 'parent comment' });
    const reply = await createTestComment(token, post.id, {
      parentId: parent.id,
      content: 'first reply'
    });

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token))
      .send({ parentId: reply.id, content: 'nested reply' });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects replies when parent comment belongs to another post', async () => {
    const { token } = await registerTestUser();
    const firstPost = await createTestPost(token, { title: 'first' });
    const secondPost = await createTestPost(token, { title: 'second' });
    const parent = await createTestComment(token, firstPost.id);

    const response = await request(app)
      .post(`/api/community/posts/${secondPost.id}/comments`)
      .set(createAuthHeader(token))
      .send({ parentId: parent.id, content: 'wrong post reply' });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  });

  it('returns 404 when creating a comment for a missing post', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/community/posts/999/comments')
      .set(createAuthHeader(token))
      .send({ content: 'comment' });

    expect(response.status).toBe(404);
  });

  it.each([
    {},
    { content: '' },
    { content: '   ' },
    { content: null },
    { content: 123 }
  ])('rejects comment creation with invalid content %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
  });

  it.each([
    { content: 'comment', userId: 999 },
    { content: 'comment', postId: 999 },
    { content: 'comment', reported: true }
  ])('rejects unsupported comment creation fields %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);

    const response = await request(app)
      .post(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
  });

  it('updates a comment owned by the current user', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .patch(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(token))
      .send({ content: '  updated comment  ' });

    expect(response.status).toBe(200);
    expect(response.body.comment).toEqual(
      expect.objectContaining({
        id: comment.id,
        content: 'updated comment'
      })
    );
    expectSafeCommentPayload(response.body);
  });

  it('rejects comment update requests with invalid commentId', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/community/comments/abc')
      .set(createAuthHeader(token))
      .send({ content: 'updated comment' });

    expect(response.status).toBe(400);
  });

  it.each([
    {},
    { content: '' },
    { content: '   ' },
    { content: null },
    { content: 123 }
  ])('rejects comment update with invalid content %p', async (payload) => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .patch(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(token))
      .send(payload);

    expect(response.status).toBe(400);
  });

  it('rejects unsupported comment update fields', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .patch(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(token))
      .send({ content: 'updated', userId: 999 });

    expect(response.status).toBe(400);
  });

  it('returns 404 when another user updates a comment', async () => {
    const owner = await registerTestUser();
    const other = await registerTestUser();
    const post = await createTestPost(owner.token);
    const comment = await createTestComment(owner.token, post.id);

    const response = await request(app)
      .patch(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(other.token))
      .send({ content: 'hijack attempt' });

    expect(response.status).toBe(404);
    expect(communityRepository.updateComment).not.toHaveBeenCalledWith(
      comment.id,
      other.user.id,
      expect.any(Object)
    );
  });

  it('returns 404 when updating a missing comment', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/community/comments/999')
      .set(createAuthHeader(token))
      .send({ content: 'updated comment' });

    expect(response.status).toBe(404);
  });

  it('deletes a comment owned by the current user', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token);
    const comment = await createTestComment(token, post.id);

    const response = await request(app)
      .delete(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'Community comment deleted successfully' });

    const listResponse = await request(app)
      .get(`/api/community/posts/${post.id}/comments`)
      .set(createAuthHeader(token));

    expect(listResponse.body.comments).toHaveLength(0);
  });

  it('rejects comment delete requests with invalid commentId', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/community/comments/abc')
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
  });

  it('returns 404 when another user deletes a comment', async () => {
    const owner = await registerTestUser();
    const other = await registerTestUser();
    const post = await createTestPost(owner.token);
    const comment = await createTestComment(owner.token, post.id);

    const response = await request(app)
      .delete(`/api/community/comments/${comment.id}`)
      .set(createAuthHeader(other.token));

    expect(response.status).toBe(404);
    expect(communityRepository.deleteComment).not.toHaveBeenCalledWith(comment.id, other.user.id);
    expect(mockComments).toHaveLength(1);
  });

  it('returns 404 when deleting a missing comment', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/community/comments/999')
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
  });
});
