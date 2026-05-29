const mockUsers = [];
const mockPosts = [];
const mockReactions = [];
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

function mockCreateBookmark(postId, userId, createdAt = new Date(Date.now() + mockNextBookmarkId)) {
  const bookmark = {
    id: mockNextBookmarkId,
    postId: Number(postId),
    userId: Number(userId),
    createdAt
  };

  mockNextBookmarkId += 1;
  mockBookmarks.push(bookmark);

  return bookmark;
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
      commentCount: data.commentCount || 0,
      createdAt: now,
      updatedAt: now
    };

    mockNextPostId += 1;
    mockPosts.push(post);

    return mockBuildRepositoryPost(post);
  }),
  findBookmarksByUserId: jest.fn(async ({ userId, page, pageSize, sort = 'latest' }) => {
    const filteredBookmarks = mockBookmarks
      .filter((bookmark) => bookmark.userId === Number(userId))
      .sort((a, b) => {
        const direction = sort === 'oldest' ? 1 : -1;

        return direction * (a.createdAt.getTime() - b.createdAt.getTime());
      });
    const start = (page - 1) * pageSize;

    return {
      bookmarks: filteredBookmarks.slice(start, start + pageSize).map((bookmark) => {
        const post = mockPosts.find((item) => item.id === bookmark.postId);

        return {
          ...bookmark,
          post: mockBuildRepositoryPost(post)
        };
      }),
      total: filteredBookmarks.length
    };
  }),
  findPostEngagementSummaries: jest.fn(async (postIds, userId) =>
    mockBuildEngagementSummaries(postIds, userId)
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
      title: 'Bookmarked post',
      content: 'Bookmarked content',
      ...overrides
    });

  return response.body.post;
}

function expectSafeBookmarkListPayload(payload) {
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
  mockNextBookmarkId = 1;
  jest.clearAllMocks();
});

describe('Community Bookmark List API', () => {
  it('rejects unauthenticated get /api/community/bookmarks requests', async () => {
    const response = await request(app).get('/api/community/bookmarks');

    expect(response.status).toBe(401);
  });

  it('lists current user bookmarks with post engagement summary', async () => {
    const currentUser = await registerTestUser();
    const otherUser = await registerTestUser();
    const targetPost = await createTestPost(currentUser.token, {
      title: 'Current bookmarked post'
    });
    mockPosts.find((post) => post.id === targetPost.id).commentCount = 3;
    const otherPost = await createTestPost(otherUser.token, {
      title: 'Other user bookmarked post'
    });
    const currentBookmark = mockCreateBookmark(targetPost.id, currentUser.user.id);
    mockCreateBookmark(targetPost.id, otherUser.user.id);
    mockCreateBookmark(otherPost.id, otherUser.user.id);
    mockReactions.push(
      { postId: targetPost.id, userId: currentUser.user.id, type: 'DISLIKE' },
      { postId: targetPost.id, userId: otherUser.user.id, type: 'LIKE' }
    );

    const response = await request(app)
      .get('/api/community/bookmarks')
      .set(createAuthHeader(currentUser.token));

    expect(response.status).toBe(200);
    expect(response.body.bookmarks).toHaveLength(1);
    expect(response.body.bookmarks[0]).toEqual(
      expect.objectContaining({
        bookmarkId: currentBookmark.id,
        bookmarkedAt: currentBookmark.createdAt.toISOString(),
        post: expect.objectContaining({
          id: targetPost.id,
          title: 'Current bookmarked post',
          commentCount: 3,
          likeCount: 1,
          dislikeCount: 1,
          bookmarkCount: 2,
          myReaction: 'DISLIKE',
          isBookmarked: true
        })
      })
    );
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1
    });
    expect(communityRepository.findBookmarksByUserId).toHaveBeenCalledWith({
      userId: currentUser.user.id,
      page: 1,
      pageSize: 10,
      sort: 'latest'
    });
    expect(communityRepository.findPostEngagementSummaries).toHaveBeenCalledWith(
      [targetPost.id],
      currentUser.user.id
    );
    expectSafeBookmarkListPayload(response.body);
  });

  it('returns an empty bookmark list with pagination metadata', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/bookmarks?page=1&pageSize=10')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      bookmarks: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    });
  });

  it('does not include other users bookmarks in the list', async () => {
    const currentUser = await registerTestUser();
    const otherUser = await registerTestUser();
    const currentPost = await createTestPost(currentUser.token, { title: 'Current post' });
    const otherPost = await createTestPost(otherUser.token, { title: 'Other post' });
    mockCreateBookmark(currentPost.id, currentUser.user.id);
    mockCreateBookmark(otherPost.id, otherUser.user.id);

    const response = await request(app)
      .get('/api/community/bookmarks')
      .set(createAuthHeader(currentUser.token));

    expect(response.status).toBe(200);
    expect(response.body.bookmarks).toHaveLength(1);
    expect(response.body.bookmarks[0].post.id).toBe(currentPost.id);
  });

  it('applies bookmark pagination options', async () => {
    const { token, user } = await registerTestUser();
    const firstPost = await createTestPost(token, { title: 'First paged bookmark' });
    const secondPost = await createTestPost(token, { title: 'Second paged bookmark' });
    mockCreateBookmark(firstPost.id, user.id, new Date('2026-05-27T01:00:00.000Z'));
    mockCreateBookmark(secondPost.id, user.id, new Date('2026-05-27T02:00:00.000Z'));

    const response = await request(app)
      .get('/api/community/bookmarks?page=2&pageSize=1&sort=oldest')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.bookmarks).toHaveLength(1);
    expect(response.body.bookmarks[0].post.id).toBe(secondPost.id);
    expect(response.body.pagination).toEqual({
      page: 2,
      pageSize: 1,
      total: 2,
      totalPages: 2
    });
    expect(communityRepository.findBookmarksByUserId).toHaveBeenCalledWith({
      userId: user.id,
      page: 2,
      pageSize: 1,
      sort: 'oldest'
    });
  });

  it.each([
    '/api/community/bookmarks?page=abc',
    '/api/community/bookmarks?page=0',
    '/api/community/bookmarks?pageSize=-1',
    '/api/community/bookmarks?pageSize=51',
    '/api/community/bookmarks?sort=popular'
  ])('rejects invalid bookmark list query "%s"', async (path) => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get(path)
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects non-string sort query values', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/community/bookmarks')
      .query({ sort: ['latest', 'oldest'] })
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('sorts bookmarks by latest and oldest bookmark creation time', async () => {
    const { token, user } = await registerTestUser();
    const firstPost = await createTestPost(token, { title: 'First bookmarked post' });
    const secondPost = await createTestPost(token, { title: 'Second bookmarked post' });
    mockCreateBookmark(firstPost.id, user.id, new Date('2026-05-27T01:00:00.000Z'));
    mockCreateBookmark(secondPost.id, user.id, new Date('2026-05-27T02:00:00.000Z'));

    const latestResponse = await request(app)
      .get('/api/community/bookmarks?sort=latest')
      .set(createAuthHeader(token));
    const oldestResponse = await request(app)
      .get('/api/community/bookmarks?sort=oldest')
      .set(createAuthHeader(token));

    expect(latestResponse.status).toBe(200);
    expect(latestResponse.body.bookmarks.map((bookmark) => bookmark.post.id)).toEqual([
      secondPost.id,
      firstPost.id
    ]);
    expect(oldestResponse.status).toBe(200);
    expect(oldestResponse.body.bookmarks.map((bookmark) => bookmark.post.id)).toEqual([
      firstPost.id,
      secondPost.id
    ]);
  });

  it('returns default engagement summary for bookmarked posts without reactions', async () => {
    const { token, user } = await registerTestUser();
    const post = await createTestPost(token);
    mockCreateBookmark(post.id, user.id);

    const response = await request(app)
      .get('/api/community/bookmarks')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.bookmarks[0].post).toEqual(
      expect.objectContaining({
        likeCount: 0,
        dislikeCount: 0,
        bookmarkCount: 1,
        myReaction: null,
        isBookmarked: true
      })
    );
  });
});

describe('Community Bookmark List repository', () => {
  afterEach(() => {
    jest.dontMock('../src/utils/prisma');
  });

  it('builds current user bookmark list query options', async () => {
    jest.resetModules();

    const mockPrisma = {
      communityBookmark: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0)
      }
    };

    jest.doMock('../src/utils/prisma', () => mockPrisma);

    const realCommunityRepository = jest.requireActual('../src/repositories/community.repository');
    const result = await realCommunityRepository.findBookmarksByUserId({
      userId: 7,
      page: 3,
      pageSize: 5,
      sort: 'oldest'
    });

    expect(result).toEqual({ bookmarks: [], total: 0 });
    expect(mockPrisma.communityBookmark.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      include: expect.any(Object),
      orderBy: { createdAt: 'asc' },
      skip: 10,
      take: 5
    });
    expect(mockPrisma.communityBookmark.count).toHaveBeenCalledWith({ where: { userId: 7 } });
  });
});
