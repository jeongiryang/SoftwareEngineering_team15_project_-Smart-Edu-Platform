const mockUsers = [];
const mockFriendships = [];
const mockBroadcastRealtimeEventToUsers = jest.fn(() => ({ clientCount: 0 }));
let mockNextUserId = 1;
let mockNextFriendshipId = 1;

function mockHydrateFriendship(friendship) {
  return {
    ...friendship,
    requester: mockUsers.find((user) => user.id === friendship.requesterId) || null,
    addressee: mockUsers.find((user) => user.id === friendship.addresseeId) || null
  };
}

function mockFindFriendshipPair(userId, otherUserId, status) {
  return mockFriendships.find((friendship) => {
    const pairMatches =
      (friendship.requesterId === Number(userId) && friendship.addresseeId === Number(otherUserId)) ||
      (friendship.requesterId === Number(otherUserId) && friendship.addresseeId === Number(userId));

    return pairMatches && (!status || friendship.status === status);
  });
}

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ loginId, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      loginId,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        profileImageUrl: null,
        learningGoal: null,
        preferredSubject: null
      }
    };

    mockNextUserId += 1;
    mockUsers.push(user);

    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null),
  findUsersByKeyword: jest.fn(async (keyword, excludeUserId) => {
    const normalizedKeyword = String(keyword).toLowerCase();

    return mockUsers
      .filter((user) => user.id !== Number(excludeUserId))
      .filter((user) => user.status === 'ACTIVE')
      .filter((user) => user.name.toLowerCase().includes(normalizedKeyword) || user.loginId.toLowerCase().includes(normalizedKeyword))
      .map((user) => ({
        ...user,
        profile: user.profile
      }));
  })
}));

jest.mock('../src/repositories/friend.repository', () => ({
  createFriendRequest: jest.fn(async (requesterId, addresseeId) => {
    const friendship = {
      id: mockNextFriendshipId,
      requesterId,
      addresseeId,
      status: 'PENDING',
      createdAt: new Date('2026-05-29T00:00:00Z'),
      updatedAt: new Date('2026-05-29T00:00:00Z')
    };

    mockNextFriendshipId += 1;
    mockFriendships.push(friendship);

    return mockHydrateFriendship(friendship);
  }),
  deleteFriendship: jest.fn(async (id) => {
    const index = mockFriendships.findIndex((friendship) => friendship.id === Number(id));
    const [friendship] = mockFriendships.splice(index, 1);

    return mockHydrateFriendship(friendship);
  }),
  findAcceptedFriendshipBetween: jest.fn(async (userId, friendId) => {
    const friendship = mockFindFriendshipPair(userId, friendId, 'ACCEPTED');
    return friendship ? mockHydrateFriendship(friendship) : null;
  }),
  findAcceptedFriendshipsForUser: jest.fn(async (userId) =>
    mockFriendships
      .filter((friendship) => friendship.status === 'ACCEPTED')
      .filter((friendship) => friendship.requesterId === Number(userId) || friendship.addresseeId === Number(userId))
      .map(mockHydrateFriendship)
  ),
  findFriendshipBetween: jest.fn(async (userId, otherUserId) => {
    const friendship = mockFindFriendshipPair(userId, otherUserId);
    return friendship ? mockHydrateFriendship(friendship) : null;
  }),
  findFriendshipById: jest.fn(async (id) => {
    const friendship = mockFriendships.find((item) => item.id === Number(id));
    return friendship ? mockHydrateFriendship(friendship) : null;
  }),
  findFriendshipsWithUsers: jest.fn(async (userId, otherUserIds) =>
    mockFriendships
      .filter((friendship) =>
        (friendship.requesterId === Number(userId) && otherUserIds.includes(friendship.addresseeId)) ||
        (friendship.addresseeId === Number(userId) && otherUserIds.includes(friendship.requesterId))
      )
      .map(mockHydrateFriendship)
  ),
  findPendingRequestsForUser: jest.fn(async (userId) =>
    mockFriendships
      .filter((friendship) => friendship.status === 'PENDING')
      .filter((friendship) => friendship.requesterId === Number(userId) || friendship.addresseeId === Number(userId))
      .map(mockHydrateFriendship)
  ),
  findUsersByKeyword: jest.fn(async (keyword, excludeUserId) => {
    const normalizedKeyword = String(keyword).toLowerCase();

    return mockUsers
      .filter((user) => user.id !== Number(excludeUserId))
      .filter((user) => user.status === 'ACTIVE')
      .filter((user) => user.name.toLowerCase().includes(normalizedKeyword) || user.loginId.toLowerCase().includes(normalizedKeyword))
      .map((user) => ({
        ...user,
        profile: user.profile
      }));
  }),
  updateFriendship: jest.fn(async (id, data) => {
    const friendship = mockFriendships.find((item) => item.id === Number(id));
    Object.assign(friendship, data, {
      updatedAt: new Date('2026-05-29T01:00:00Z')
    });

    return mockHydrateFriendship(friendship);
  })
}));

jest.mock('../src/realtime/websocket.server', () => ({
  broadcastRealtimeEventToUsers: (...args) => mockBroadcastRealtimeEventToUsers(...args),
  getOnlineUserIds: jest.fn(() => [])
}));

const request = require('supertest');
const app = require('../src/app');
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

function expectNoSensitiveFriendData(payload) {
  const serialized = JSON.stringify(payload);

  expect(serialized).not.toContain('passwordHash');
  expect(serialized).not.toContain('password');
  expect(serialized).not.toContain('token');
  expect(serialized).not.toContain('JWT');
  expect(serialized).not.toContain('passwordHash');
}

beforeEach(() => {
  mockUsers.length = 0;
  mockFriendships.length = 0;
  mockNextUserId = 1;
  mockNextFriendshipId = 1;
  jest.clearAllMocks();
  mockBroadcastRealtimeEventToUsers.mockClear();
});

describe('Friend API', () => {
  it.each([
    { method: 'get', path: '/api/users/search?keyword=friend' },
    { method: 'get', path: '/api/friends' },
    { method: 'get', path: '/api/friends/requests' },
    { method: 'post', path: '/api/friends/requests' },
    { method: 'patch', path: '/api/friends/requests/1' },
    { method: 'delete', path: '/api/friends/1' }
  ])('rejects unauthenticated $method $path requests', async ({ method, path }) => {
    const response = await request(app)[method](path).send({});

    expect(response.status).toBe(401);
  });

  it('searches users for friend requests without returning self or sensitive data', async () => {
    const { token, user } = await registerTestUser({ name: 'Current Learner' });
    const target = await registerTestUser({ name: 'Study Friend' });
    await registerTestUser({ name: 'Another Learner' });

    const response = await request(app)
      .get('/api/users/search?keyword=Friend')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.users).toEqual([
      expect.objectContaining({
        id: target.user.id,
        name: 'Study Friend',
        relationshipStatus: 'NONE'
      })
    ]);
    expect(response.body.users).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: user.id })
      ])
    );
    expectNoSensitiveFriendData(response.body);
  });

  it('rejects short friend search keywords', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .get('/api/users/search?keyword=a')
      .set(createAuthHeader(token));

    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
  });

  it('sends a friend request and lists sent and received requests', async () => {
    const requester = await registerTestUser({ name: 'Requester' });
    const addressee = await registerTestUser({ name: 'Addressee' });

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.request).toEqual(
      expect.objectContaining({
        status: 'PENDING',
        direction: 'SENT',
        user: expect.objectContaining({ id: addressee.user.id })
      })
    );
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenLastCalledWith(
      [requester.user.id, addressee.user.id],
      'friends.request.updated',
      expect.objectContaining({
        action: 'REQUEST_SENT',
        requesterId: requester.user.id,
        addresseeId: addressee.user.id,
        status: 'PENDING'
      })
    );

    const sentResponse = await request(app)
      .get('/api/friends/requests')
      .set(createAuthHeader(requester.token));

    expect(sentResponse.status).toBe(200);
    expect(sentResponse.body.requests.sent).toHaveLength(1);
    expect(sentResponse.body.requests.received).toHaveLength(0);

    const receivedResponse = await request(app)
      .get('/api/friends/requests')
      .set(createAuthHeader(addressee.token));

    expect(receivedResponse.status).toBe(200);
    expect(receivedResponse.body.requests.received).toHaveLength(1);
    expectNoSensitiveFriendData(receivedResponse.body);
  });

  it('rejects sending a friend request to self', async () => {
    const { token, user } = await registerTestUser();

    const response = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(token))
      .send({ userId: user.id });

    expect(response.status).toBe(400);
  });

  it('rejects sending a friend request to a missing user', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(token))
      .send({ userId: 99999 });

    expect(response.status).toBe(404);
  });

  it('rejects duplicate pending friend requests', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const response = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    expect(response.status).toBe(409);
  });

  it('rejects a reverse request when a pending request already exists', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const response = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(addressee.token))
      .send({ userId: requester.user.id });

    expect(response.status).toBe(409);
  });

  it('accepts a friend request and returns accepted friends', async () => {
    const requester = await registerTestUser({ name: 'Requester' });
    const addressee = await registerTestUser({ name: 'Addressee' });

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const acceptResponse = await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'ACCEPT' });

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.request.status).toBe('ACCEPTED');
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenLastCalledWith(
      [requester.user.id, addressee.user.id],
      'friends.request.updated',
      expect.objectContaining({
        action: 'REQUEST_ACCEPTED',
        actorId: addressee.user.id,
        friendshipId: createResponse.body.request.id,
        status: 'ACCEPTED'
      })
    );

    const friendsResponse = await request(app)
      .get('/api/friends')
      .set(createAuthHeader(requester.token));

    expect(friendsResponse.status).toBe(200);
    expect(friendsResponse.body.onlineFriendIds).toEqual([]);
    expect(friendsResponse.body.friends).toEqual([
      expect.objectContaining({
        status: 'ACCEPTED',
        user: expect.objectContaining({ id: addressee.user.id })
      })
    ]);
    expectNoSensitiveFriendData(friendsResponse.body);
  });

  it('rejects friend request responses from users other than the addressee', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();
    const other = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const response = await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(other.token))
      .send({ action: 'ACCEPT' });

    expect(response.status).toBe(403);
  });

  it('broadcasts a realtime update when a friend request is rejected', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const rejectResponse = await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'REJECT' });

    expect(rejectResponse.status).toBe(200);
    expect(rejectResponse.body.request.status).toBe('REJECTED');
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenLastCalledWith(
      [requester.user.id, addressee.user.id],
      'friends.request.updated',
      expect.objectContaining({
        action: 'REQUEST_REJECTED',
        actorId: addressee.user.id,
        friendshipId: createResponse.body.request.id,
        status: 'REJECTED'
      })
    );
  });

  it('rejects reprocessing an already accepted request', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'ACCEPT' });

    const response = await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'REJECT' });

    expect(response.status).toBe(409);
  });

  it('rejects unsupported request actions', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    const response = await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'MAYBE' });

    expect(response.status).toBe(400);
  });

  it('rejects friend requests to an already accepted friend', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'ACCEPT' });

    const response = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    expect(response.status).toBe(409);
  });

  it('rejects deleting a non-friend relationship', async () => {
    const requester = await registerTestUser();
    const other = await registerTestUser();

    const response = await request(app)
      .delete(`/api/friends/${other.user.id}`)
      .set(createAuthHeader(requester.token));

    expect(response.status).toBe(404);
  });

  it('deletes an accepted friend relationship without deleting either user', async () => {
    const requester = await registerTestUser();
    const addressee = await registerTestUser();

    const createResponse = await request(app)
      .post('/api/friends/requests')
      .set(createAuthHeader(requester.token))
      .send({ userId: addressee.user.id });

    await request(app)
      .patch(`/api/friends/requests/${createResponse.body.request.id}`)
      .set(createAuthHeader(addressee.token))
      .send({ action: 'ACCEPT' });

    const deleteResponse = await request(app)
      .delete(`/api/friends/${addressee.user.id}`)
      .set(createAuthHeader(requester.token));

    expect(deleteResponse.status).toBe(200);
    expect(mockBroadcastRealtimeEventToUsers).toHaveBeenLastCalledWith(
      [requester.user.id, addressee.user.id],
      'friends.request.updated',
      expect.objectContaining({
        action: 'FRIEND_REMOVED',
        actorId: requester.user.id,
        status: 'ACCEPTED'
      })
    );
    expect(mockUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: requester.user.id }),
        expect.objectContaining({ id: addressee.user.id })
      ])
    );

    const friendsResponse = await request(app)
      .get('/api/friends')
      .set(createAuthHeader(requester.token));

    expect(friendsResponse.body.onlineFriendIds).toEqual([]);
    expect(friendsResponse.body.friends).toHaveLength(0);
  });
});
