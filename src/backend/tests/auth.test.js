const mockUsers = [];
let mockNextUserId = 1;

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

const request = require('supertest');
const app = require('../src/app');
const { createAuthHeader, createUserPayload } = require('./helpers/auth.helper');
const { expectSafeUser } = require('./helpers/assert.helper');

async function registerTestUser(overrides = {}) {
  const payload = createUserPayload(overrides);

  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    payload,
    response
  };
}

beforeEach(() => {
  mockUsers.length = 0;
  mockNextUserId = 1;
  jest.clearAllMocks();
});

describe('POST /api/auth/register', () => {
  it('registers a user and returns a token without passwordHash', async () => {
    const { payload, response } = await registerTestUser();

    expect(response.status).toBe(201);
    expectSafeUser(response.body.user);
    expect(response.body.user.loginId).toBe(payload.loginId);
    expect(response.body.user.name).toBe(payload.name);
    expect(response.body.user.role).toBe('USER');
    expect(response.body.token).toEqual(expect.any(String));

    expect(mockUsers[0].passwordHash).toEqual(expect.any(String));
    expect(mockUsers[0].passwordHash).not.toBe(payload.password);
  });

  it('rejects duplicate loginId registration', async () => {
    const payload = createUserPayload();

    await request(app)
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    const response = await request(app)
      .post('/api/auth/register')
      .send(payload);

    expect(response.status).toBe(409);
  });

  it('rejects registration with missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        loginId: 'missing_fields'
      });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in a user and returns a token without passwordHash', async () => {
    const { payload } = await registerTestUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: payload.loginId,
        password: payload.password
      });

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.loginId).toBe(payload.loginId);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('rejects login with an incorrect password', async () => {
    const { payload } = await registerTestUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: payload.loginId,
        password: 'wrong-password'
      });

    expect(response.status).toBe(401);
  });

  it('rejects login for a nonexistent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        loginId: 'not_found',
        password: 'password123'
      });

    expect(response.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests without a JWT', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('returns the current user for a valid JWT without passwordHash', async () => {
    const { payload, response: registerResponse } = await registerTestUser();

    const response = await request(app)
      .get('/api/auth/me')
      .set(createAuthHeader(registerResponse.body.token));

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.loginId).toBe(payload.loginId);
  });
});
