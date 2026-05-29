const mockUsers = [];
const mockPosts = [];
const mockReactions = [];
const mockBookmarks = [];
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

function mockBuildEngagementSummaries(postIds, userId) {
  return new Map(
    postIds.map((postId) => {
      const id = Number(postId);
      const reactions = mockReactions.filter((reaction) => reaction.postId === id);
      const bookmarks = mockBookmarks.filter((bookmark) => bookmark.postId === id);
      const currentUserReaction = reactions.find((reaction) => reaction.userId === Number(userId));
      const currentUserBookmark = bookmarks.find((bookmark) => bookmark.userId === Number(userId));

      return [
        id,
        {
          likeCount: reactions.filter((reaction) => reaction.type === 'LIKE').length,
          dislikeCount: reactions.filter((reaction) => reaction.type === 'DISLIKE').length,
          bookmarkCount: bookmarks.length,
          myReaction: currentUserReaction?.type ?? null,
          isBookmarked: Boolean(currentUserBookmark)
        }
      ];
    })
  );
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
  findPostEngagementSummaries: jest.fn(async (postIds, userId) =>
    mockBuildEngagementSummaries(postIds, userId)
  ),
  findPosts: jest.fn(async ({ page, pageSize, category, search, sort = 'latest' }) => {
    const normalizedSearch = search ? String(search).toLowerCase() : undefined;
    const filteredPosts = mockPosts
      .filter((post) => !category || post.category === category)
      .filter((post) => {
        if (!normalizedSearch) {
          return true;
        }

        return (
          post.title.toLowerCase().includes(normalizedSearch) ||
          post.content.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        const direction = sort === 'oldest' ? 1 : -1;

        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      });
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
  expect(serialized).not.toContain('passwordHash');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockPosts.length = 0;
  mockReactions.length = 0;
  mockBookmarks.length = 0;
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

  it('lists community posts with reaction and bookmark summary for the current user', async () => {
    const currentUser = await registerTestUser();
    const otherUser = await registerTestUser();
    const targetPost = await createTestPost(currentUser.token, { title: 'Engagement target' });
    const otherPost = await createTestPost(currentUser.token, { title: 'Other engagement post' });

    mockReactions.push(
      { postId: targetPost.id, userId: currentUser.user.id, type: 'LIKE' },
      { postId: targetPost.id, userId: otherUser.user.id, type: 'DISLIKE' },
      { postId: otherPost.id, userId: otherUser.user.id, type: 'LIKE' }
    );
    mockBookmarks.push(
      { postId: targetPost.id, userId: currentUser.user.id },
      { postId: targetPost.id, userId: otherUser.user.id },
      { postId: otherPost.id, userId: otherUser.user.id }
    );

    const response = await request(app)
      .get('/api/community/posts?sort=oldest')
      .set(createAuthHeader(currentUser.token));

    expect(response.status).toBe(200);
    const targetSummary = response.body.posts.find((post) => post.id === targetPost.id);
    const otherSummary = response.body.posts.find((post) => post.id === otherPost.id);

    expect(targetSummary).toEqual(
      expect.objectContaining({
        likeCount: 1,
        dislikeCount: 1,
        bookmarkCount: 2,
        myReaction: 'LIKE',
        isBookmarked: true
      })
    );
    expect(otherSummary).toEqual(
      expect.objectContaining({
        likeCount: 1,
        dislikeCount: 0,
        bookmarkCount: 1,
        myReaction: null,
        isBookmarked: false
      })
    );
    expect(communityRepository.findPostEngagementSummaries).toHaveBeenCalledWith(
      expect.arrayContaining([targetPost.id, otherPost.id]),
      currentUser.user.id
    );
    expectSafePostPayload(response.body);
  });

  it('returns default engagement summary for posts without reactions or bookmarks', async () => {
    const { token } = await registerTestUser();
    const post = await createTestPost(token, { title: 'No engagement post' });

    const response = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(
      expect.objectContaining({
        likeCount: 0,
        dislikeCount: 0,
        bookmarkCount: 0,
        myReaction: null,
        isBookmarked: false
      })
    );
  });

  it.each([
    '/api/community/posts?page=abc',
    '/api/community/posts?page=0',
    '/api/community/posts?pageSize=-1',
    '/api/community/posts?pageSize=51',
    '/api/community/posts?category=NOTICE',
    '/api/community/posts?search=',
    '/api/community/posts?search=%20%20%20',
    '/api/community/posts?sort=popular'
  ])('rejects invalid list query "%s"', async (path) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get(path)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-string search query values', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/posts')
      .query({ search: ['math', 'science'] })
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects search query values longer than 100 characters', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/posts')
      .query({ search: 'a'.repeat(101) })
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

  it('searches community posts by title', async () => {
    const { token } = await registerTestUser();
    const targetPost = await createTestPost(token, {
      title: 'Calculus question',
      content: 'Limit problem'
    });
    await createTestPost(token, {
      title: 'Vocabulary note',
      content: 'English study'
    });

    const response = await request(app)
      .get('/api/community/posts?search=calc')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(targetPost.id);
    expect(response.body.pagination.total).toBe(1);
  });

  it('searches community posts by content', async () => {
    const { token } = await registerTestUser();
    await createTestPost(token, {
      title: 'Free talk',
      content: 'Daily study log'
    });
    const targetPost = await createTestPost(token, {
      title: 'Question',
      content: 'Geometry proof strategy'
    });

    const response = await request(app)
      .get('/api/community/posts?search=proof')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.posts).toHaveLength(1);
    expect(response.body.posts[0].id).toBe(targetPost.id);
    expect(response.body.pagination.total).toBe(1);
  });

  it('applies search with category filter and sort options', async () => {
    const { token } = await registerTestUser();
    await createTestPost(token, {
      category: 'QUESTION',
      title: 'Math question',
      content: 'calculus'
    });
    const firstFreePost = await createTestPost(token, {
      category: 'FREE',
      title: 'Math free post',
      content: 'algebra'
    });
    const secondFreePost = await createTestPost(token, {
      category: 'FREE',
      title: 'Daily note',
      content: 'math habit'
    });
    await createTestPost(token, {
      category: 'FREE',
      title: 'English free post',
      content: 'vocabulary'
    });

    const response = await request(app)
      .get('/api/community/posts?category=FREE&search=math&sort=oldest')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.posts.map((post) => post.id)).toEqual([
      firstFreePost.id,
      secondFreePost.id
    ]);
    expect(response.body.pagination.total).toBe(2);
    expect(communityRepository.findPosts).toHaveBeenLastCalledWith({
      page: 1,
      pageSize: 10,
      category: 'FREE',
      search: 'math',
      sort: 'oldest'
    });
  });

  it('sorts community posts by latest and oldest options', async () => {
    const { token } = await registerTestUser();
    const firstPost = await createTestPost(token, { title: 'First post' });
    const secondPost = await createTestPost(token, { title: 'Second post' });

    const latestResponse = await request(app)
      .get('/api/community/posts?sort=latest')
      .set(createAuthHeader(token));
    const oldestResponse = await request(app)
      .get('/api/community/posts?sort=oldest')
      .set(createAuthHeader(token));

    expect(latestResponse.status).toBe(200);
    expect(latestResponse.body.posts.map((post) => post.id)).toEqual([
      secondPost.id,
      firstPost.id
    ]);
    expect(oldestResponse.status).toBe(200);
    expect(oldestResponse.body.posts.map((post) => post.id)).toEqual([
      firstPost.id,
      secondPost.id
    ]);
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

  it('reads a single community post with current user engagement status', async () => {
    const currentUser = await registerTestUser();
    const otherUser = await registerTestUser();
    const post = await createTestPost(currentUser.token, {
      category: 'FREE',
      title: 'Engagement detail',
      content: 'Detail content'
    });

    mockReactions.push(
      { postId: post.id, userId: currentUser.user.id, type: 'DISLIKE' },
      { postId: post.id, userId: otherUser.user.id, type: 'LIKE' }
    );
    mockBookmarks.push(
      { postId: post.id, userId: currentUser.user.id },
      { postId: post.id, userId: otherUser.user.id }
    );

    const response = await request(app)
      .get(`/api/community/posts/${post.id}`)
      .set(createAuthHeader(currentUser.token));

    expect(response.status).toBe(200);
    expect(response.body.post).toEqual(
      expect.objectContaining({
        id: post.id,
        likeCount: 1,
        dislikeCount: 1,
        bookmarkCount: 2,
        myReaction: 'DISLIKE',
        isBookmarked: true
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

  it('builds search, category, sort and pagination query options', async () => {
    jest.resetModules();

    const mockPrisma = {
      boardPost: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      }
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const result = await realCommunityRepository.findPosts({
      page: 2,
      pageSize: 5,
      category: 'QUESTION',
      search: 'calculus',
      sort: 'oldest'
    });

    const expectedWhere = {
      category: 'QUESTION',
      OR: [
        {
          title: {
            contains: 'calculus',
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: 'calculus',
            mode: 'insensitive'
          }
        }
      ]
    };

    expect(result).toEqual({ posts: [], total: 0 });
    expect(mockPrisma.boardPost.findMany).toHaveBeenCalledWith({
      where: expectedWhere,
      include: expect.any(Object),
      orderBy: { createdAt: 'asc' },
      skip: 5,
      take: 5
    });
    expect(mockPrisma.boardPost.count).toHaveBeenCalledWith({ where: expectedWhere });
  });

  it('builds engagement summary queries for counts and current user status', async () => {
    jest.resetModules();

    const mockPrisma = {
      communityReaction: {
        groupBy: jest.fn().mockResolvedValue([
          { postId: 1, type: 'LIKE', _count: { id: 2 } },
          { postId: 1, type: 'DISLIKE', _count: { id: 1 } },
          { postId: 2, type: 'LIKE', _count: { id: 1 } }
        ]),
        findMany: jest.fn().mockResolvedValue([{ postId: 1, type: 'DISLIKE' }])
      },
      communityBookmark: {
        groupBy: jest.fn().mockResolvedValue([{ postId: 1, _count: { id: 3 } }]),
        findMany: jest.fn().mockResolvedValue([{ postId: 2 }])
      }
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const summaries = await realCommunityRepository.findPostEngagementSummaries([1, 2], 7);

    expect(summaries.get(1)).toEqual({
      likeCount: 2,
      dislikeCount: 1,
      bookmarkCount: 3,
      myReaction: 'DISLIKE',
      isBookmarked: false
    });
    expect(summaries.get(2)).toEqual({
      likeCount: 1,
      dislikeCount: 0,
      bookmarkCount: 0,
      myReaction: null,
      isBookmarked: true
    });
    expect(mockPrisma.communityReaction.groupBy).toHaveBeenCalledWith({
      by: ['postId', 'type'],
      where: {
        postId: {
          in: [1, 2]
        }
      },
      _count: {
        id: true
      }
    });
    expect(mockPrisma.communityBookmark.groupBy).toHaveBeenCalledWith({
      by: ['postId'],
      where: {
        postId: {
          in: [1, 2]
        }
      },
      _count: {
        id: true
      }
    });
    expect(mockPrisma.communityReaction.findMany).toHaveBeenCalledWith({
      where: {
        postId: {
          in: [1, 2]
        },
        userId: 7
      },
      select: {
        postId: true,
        type: true
      }
    });
    expect(mockPrisma.communityBookmark.findMany).toHaveBeenCalledWith({
      where: {
        postId: {
          in: [1, 2]
        },
        userId: 7
      },
      select: {
        postId: true
      }
    });
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
