const mockUsers = [];
const mockProfiles = new Map();
const mockActivityStats = new Map();
const mockPublicLearningStats = new Map();
const mockShopPurchases = new Map();
let mockNextUserId = 1;
let mockNextProfileId = 1;
const MOCK_CREATED_AT = new Date('2026-05-01T00:00:00.000Z');
const MOCK_UPDATED_AT = new Date('2026-05-02T00:00:00.000Z');

jest.mock('../src/repositories/user.repository', () => ({
  createUser: jest.fn(async ({ loginId, name, passwordHash }) => {
    const user = {
      id: mockNextUserId,
      loginId,
      name,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_UPDATED_AT
    };

    mockNextUserId += 1;
    mockUsers.push(user);
    mockProfiles.set(user.id, {
      id: mockNextProfileId,
      userId: user.id,
      learningGoal: null,
      preferredSubject: null,
      profileImageUrl: null,
      profileBackgroundUrl: null,
      titleText: null,
      createdAt: MOCK_CREATED_AT,
      updatedAt: MOCK_UPDATED_AT
    });
    mockNextProfileId += 1;

    return user;
  }),
  deactivateUser: jest.fn(async (userId, data) => {
    const user = mockUsers.find((item) => item.id === Number(userId));

    if (!user) {
      return null;
    }

    Object.assign(user, data);

    return user;
  }),
  findUserByLoginId: jest.fn(async (loginId) => mockUsers.find((user) => user.loginId === loginId) || null),
  findUserById: jest.fn(async (id) => mockUsers.find((user) => user.id === Number(id)) || null),
  findUserWithProfileById: jest.fn(async (id) => {
    const user = mockUsers.find((item) => item.id === Number(id));

    if (!user) {
      return null;
    }

    return {
      ...user,
      profile: mockProfiles.get(user.id) || null
    };
  }),
  findPublicProfileById: jest.fn(async (id) => {
    const user = mockUsers.find((item) => item.id === Number(id));

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      profile: mockProfiles.get(user.id) || null,
      shopPurchases: mockShopPurchases.get(user.id) || []
    };
  }),
  getPublicProfileLearningStats: jest.fn(async (id) => mockPublicLearningStats.get(Number(id)) || {
    todayFocusMinutes: 0,
    weeklyFocusMinutes: 0,
    completedTaskCount: 0
  }),
  getUserActivityStats: jest.fn(async (id) => mockActivityStats.get(Number(id)) || {
    postCount: 0,
    commentCount: 0,
    replyCount: 0,
    likeCount: 0,
    dislikeCount: 0,
    bookmarkCount: 0
  }),
  updateUser: jest.fn(async (userId, data) => {
    const user = mockUsers.find((item) => item.id === Number(userId));

    if (!user) {
      return null;
    }

    Object.assign(user, data);

    return user;
  }),
  updateUserPassword: jest.fn(async (userId, passwordHash) => {
    const user = mockUsers.find((item) => item.id === Number(userId));

    if (!user) {
      return null;
    }

    user.passwordHash = passwordHash;

    return user;
  }),
  upsertUserProfile: jest.fn(async (userId, data) => {
    const user = mockUsers.find((item) => item.id === Number(userId));

    if (!user) {
      return null;
    }

    const existingProfile = mockProfiles.get(user.id);
    const profile = {
      id: existingProfile?.id || mockNextProfileId,
      userId: user.id,
      learningGoal: existingProfile?.learningGoal || null,
      preferredSubject: existingProfile?.preferredSubject || null,
      profileImageUrl: existingProfile?.profileImageUrl || null,
      profileBackgroundUrl: existingProfile?.profileBackgroundUrl || null,
      titleText: existingProfile?.titleText || null,
      createdAt: existingProfile?.createdAt || MOCK_CREATED_AT,
      updatedAt: MOCK_UPDATED_AT,
      ...data
    };

    if (!existingProfile) {
      mockNextProfileId += 1;
    }

    mockProfiles.set(user.id, profile);

    return profile;
  })
}));

const request = require('supertest');
const app = require('../src/app');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');
const { expectNoPasswordHash, expectSafeUser } = require('./helpers/assert.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);
  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    response,
    token: response.body.token,
    user: response.body.user
  };
}

beforeEach(() => {
  mockUsers.length = 0;
  mockProfiles.clear();
  mockActivityStats.clear();
  mockPublicLearningStats.clear();
  mockShopPurchases.clear();
  mockNextUserId = 1;
  mockNextProfileId = 1;
  jest.clearAllMocks();
});

describe('GET /api/users/me', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app).get('/api/users/me');

    expect(response.status).toBe(401);
  });

  it('returns the current user with profile for a valid JWT', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .get('/api/users/me')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.loginId).toBe(payload.loginId);
    expect(response.body.user.profile).toEqual(
      expect.objectContaining({
        userId: response.body.user.id,
        learningGoal: null,
        preferredSubject: null,
        profileImageUrl: null,
        profileBackgroundUrl: null,
        titleText: null
      })
    );
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('returns a null profile when the user profile does not exist', async () => {
    const { token, user } = await registerTestUser();
    mockProfiles.delete(user.id);

    const response = await request(app)
      .get('/api/users/me')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.profile).toBeNull();
  });

  it('rejects a token when the user no longer exists', async () => {
    const { token } = await registerTestUser();
    mockUsers.length = 0;

    const response = await request(app)
      .get('/api/users/me')
      .set(createAuthHeader(token));

    expect(response.status).toBe(401);
  });
});

describe('GET /api/users/me/activity', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app).get('/api/users/me/activity');

    expect(response.status).toBe(401);
  });

  it('returns current user community activity stats without sensitive data', async () => {
    const { token, user } = await registerTestUser();
    mockActivityStats.set(user.id, {
      postCount: 4,
      commentCount: 7,
      replyCount: 3,
      likeCount: 11,
      dislikeCount: 2,
      bookmarkCount: 5
    });

    const response = await request(app)
      .get('/api/users/me/activity')
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.activity).toEqual({
      postCount: 4,
      commentCount: 7,
      replyCount: 3,
      likeCount: 11,
      dislikeCount: 2,
      bookmarkCount: 5,
      reactionBasis: 'GIVEN'
    });
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('token');
  });
});

describe('GET /api/users/:userId/public-profile', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app).get('/api/users/1/public-profile');

    expect(response.status).toBe(401);
  });

  it('returns safe public profile data with equipped appearance', async () => {
    const { token } = await registerTestUser({ loginId: 'viewer-user', name: 'Viewer' });
    const target = await registerTestUser({ loginId: 'target-user', name: 'Target Learner' });

    mockProfiles.set(target.user.id, {
      ...mockProfiles.get(target.user.id),
      learningGoal: 'Daily study',
      preferredSubject: 'Math',
      profileImageUrl: '/assets/shop/avatar-sky.png',
      profileBackgroundUrl: '/assets/shop/background-mint.png',
      titleText: '새벽 집중러'
    });
    mockShopPurchases.set(target.user.id, [
      {
        id: 1,
        userId: target.user.id,
        item: {
          id: 10,
          code: 'PROFILE_IMAGE_SKY',
          name: '하늘 노트',
          type: 'PROFILE_IMAGE',
          assetUrl: '/assets/shop/avatar-sky.png'
        }
      },
      {
        id: 2,
        userId: target.user.id,
        item: {
          id: 11,
          code: 'PROFILE_BACKGROUND_MINT',
          name: '민트 책상',
          type: 'PROFILE_BACKGROUND',
          assetUrl: '/assets/shop/background-mint.png'
        }
      },
      {
        id: 3,
        userId: target.user.id,
        item: {
          id: 12,
          code: 'TITLE_EARLY_BIRD',
          name: '새벽 집중러',
          type: 'TITLE',
          assetUrl: null
        }
      }
    ]);
    mockPublicLearningStats.set(target.user.id, {
      todayFocusMinutes: 25,
      weeklyFocusMinutes: 180,
      completedTaskCount: 9
    });

    const response = await request(app)
      .get(`/api/users/${target.user.id}/public-profile`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual(
      expect.objectContaining({
        id: target.user.id,
        name: 'Target Learner',
        displayLoginId: 'ta***r',
        learningGoal: 'Daily study',
        preferredSubject: 'Math',
        stats: {
          todayFocusMinutes: 25,
          weeklyFocusMinutes: 180,
          completedTaskCount: 9
        }
      })
    );
    expect(response.body.profile.appearance).toEqual(
      expect.objectContaining({
        profileImageUrl: '/assets/shop/avatar-sky.png',
        profileBackgroundUrl: '/assets/shop/background-mint.png',
        titleText: '새벽 집중러',
        equippedItems: expect.objectContaining({
          profileImage: expect.objectContaining({ code: 'PROFILE_IMAGE_SKY' }),
          profileBackground: expect.objectContaining({ code: 'PROFILE_BACKGROUND_MINT' }),
          title: expect.objectContaining({ code: 'TITLE_EARLY_BIRD' })
        })
      })
    );
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('target-user');
    expect(JSON.stringify(response.body)).not.toContain('token');
  });

  it('does not expose inactive users through public profile', async () => {
    const { token } = await registerTestUser({ loginId: 'viewer-user' });
    const target = await registerTestUser({ loginId: 'inactive-user' });
    const inactiveUser = mockUsers.find((item) => item.id === target.user.id);
    inactiveUser.status = 'SUSPENDED';

    const response = await request(app)
      .get(`/api/users/${target.user.id}/public-profile`)
      .set(createAuthHeader(token));

    expect(response.status).toBe(404);
  });
});

describe('PATCH /api/users/me', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app)
      .patch('/api/users/me')
      .send({
        name: '새 이름'
      });

    expect(response.status).toBe(401);
  });

  it('updates the current user name and returns safe user data', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        name: '  사각 학습자  '
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        name: '사각 학습자'
      })
    );
    expectSafeUser(response.body.user);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('rejects unsupported account fields', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        role: 'ADMIN'
      });

    expect(response.status).toBe(400);
  });

  it('rejects blank user names', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        name: '   '
      });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/users/me/password', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app)
      .patch('/api/users/me/password')
      .send({
        currentPassword: 'password1234',
        newPassword: 'new-password-1234'
      });

    expect(response.status).toBe(401);
  });

  it('changes the current user password without returning sensitive data', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        newPassword: 'new-password-1234'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password changed successfully');
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');

    const oldLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: payload.loginId,
        password: payload.password
      });

    expect(oldLoginResponse.status).toBe(401);

    const newLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: payload.loginId,
        password: 'new-password-1234'
      });

    expect(newLoginResponse.status).toBe(200);
    expectSafeUser(newLoginResponse.body.user);
  });

  it('rejects incorrect current passwords', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(createAuthHeader(token))
      .send({
        currentPassword: 'wrong-password',
        newPassword: 'new-password-1234'
      });

    expect(response.status).toBe(401);
  });

  it('rejects weak new passwords', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        newPassword: 'short'
      });

    expect(response.status).toBe(400);
  });

  it('rejects unsupported password fields', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/password')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        newPassword: 'new-password-1234',
        token: 'plain-token'
      });

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/users/me', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app)
      .delete('/api/users/me')
      .send({
        currentPassword: 'password1234',
        confirmationText: '탈퇴합니다'
      });

    expect(response.status).toBe(401);
  });

  it('rejects unsupported withdrawal fields', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        confirmationText: '탈퇴합니다',
        userId: 999
      });

    expect(response.status).toBe(400);
  });

  it('rejects incorrect current passwords', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        currentPassword: 'wrong-password',
        confirmationText: '탈퇴합니다'
      });

    expect(response.status).toBe(401);
  });

  it('rejects incorrect confirmation text', async () => {
    const { payload, token } = await registerTestUser();

    const response = await request(app)
      .delete('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        confirmationText: '탈퇴'
      });

    expect(response.status).toBe(400);
  });

  it('soft-deactivates the current user and blocks the old token', async () => {
    const { payload, token, user } = await registerTestUser();

    const response = await request(app)
      .delete('/api/users/me')
      .set(createAuthHeader(token))
      .send({
        currentPassword: payload.password,
        confirmationText: '탈퇴합니다'
      });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual(
      expect.objectContaining({
        id: user.id,
        loginId: payload.loginId,
        name: '탈퇴한 사용자',
        status: 'DEACTIVATED'
      })
    );
    expectSafeUser(response.body.user);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
    expect(mockUsers).toHaveLength(1);

    const meResponse = await request(app)
      .get('/api/users/me')
      .set(createAuthHeader(token));

    expect(meResponse.status).toBe(401);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: payload.loginId,
        password: payload.password
      });

    expect(loginResponse.status).toBe(403);
  });
});

describe('PATCH /api/users/me/profile', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app)
      .patch('/api/users/me/profile')
      .send({
        learningGoal: 'Daily study'
      });

    expect(response.status).toBe(401);
  });

  it('updates the current user profile and returns safe profile data', async () => {
    const { token } = await registerTestUser();

    const updateResponse = await request(app)
      .patch('/api/users/me/profile')
      .set(createAuthHeader(token))
      .send({
        learningGoal: '  TOEIC preparation  ',
        preferredSubject: 'English',
        profileImageUrl: null
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.profile).toEqual(
      expect.objectContaining({
        learningGoal: 'TOEIC preparation',
        preferredSubject: 'English',
        profileImageUrl: null,
        profileBackgroundUrl: null,
        titleText: null
      })
    );
    expectNoPasswordHash(updateResponse.body.profile);

    const getResponse = await request(app)
      .get('/api/users/me')
      .set(createAuthHeader(token));

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.user.profile.learningGoal).toBe('TOEIC preparation');
    expect(JSON.stringify(getResponse.body)).not.toContain('passwordHash');
  });

  it('creates a profile when the profile does not exist', async () => {
    const { token, user } = await registerTestUser();
    mockProfiles.delete(user.id);

    const response = await request(app)
      .patch('/api/users/me/profile')
      .set(createAuthHeader(token))
      .send({
        preferredSubject: 'Math'
      });

    expect(response.status).toBe(200);
    expect(response.body.profile).toEqual(
      expect.objectContaining({
        userId: user.id,
        preferredSubject: 'Math'
      })
    );
  });

  it('rejects an empty profile update body', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/profile')
      .set(createAuthHeader(token))
      .send({});

    expect(response.status).toBe(400);
  });

  it('rejects unsupported profile fields', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/profile')
      .set(createAuthHeader(token))
      .send({
        role: 'ADMIN'
      });

    expect(response.status).toBe(400);
  });

  it('rejects profile fields with invalid value types', async () => {
    const { token } = await registerTestUser();

    const response = await request(app)
      .patch('/api/users/me/profile')
      .set(createAuthHeader(token))
      .send({
        learningGoal: 100
      });

    expect(response.status).toBe(400);
  });
});
