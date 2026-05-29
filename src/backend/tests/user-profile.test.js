const mockUsers = [];
const mockProfiles = new Map();
let mockNextUserId = 1;
let mockNextProfileId = 1;

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
    mockProfiles.set(user.id, {
      id: mockNextProfileId,
      userId: user.id,
      learningGoal: null,
      preferredSubject: null,
      profileImageUrl: null,
      profileBackgroundUrl: null,
      titleText: null
    });
    mockNextProfileId += 1;

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
