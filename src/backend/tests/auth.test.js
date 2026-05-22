const mockUsers = [];
let mockNextUserId = 1;

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

const request = require('supertest');
const app = require('../src/app');

function makeUserPayload(overrides = {}) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

  return {
    email: `auth-test-${suffix}@example.com`,
    password: 'password123',
    name: 'Auth Test User',
    ...overrides
  };
}

function expectSafeUser(user) {
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      email: expect.any(String),
      name: expect.any(String),
      role: expect.any(String)
    })
  );
  expect(user).not.toHaveProperty('passwordHash');
  expect(user).not.toHaveProperty('password_hash');
}

async function registerTestUser(overrides = {}) {
  const payload = makeUserPayload(overrides);

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
    expect(response.body.user.email).toBe(payload.email);
    expect(response.body.user.name).toBe(payload.name);
    expect(response.body.user.role).toBe('USER');
    expect(response.body.token).toEqual(expect.any(String));

    expect(mockUsers[0].passwordHash).toEqual(expect.any(String));
    expect(mockUsers[0].passwordHash).not.toBe(payload.password);
  });

  it('rejects duplicate email registration', async () => {
    const payload = makeUserPayload();

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
        email: 'missing-fields@example.com'
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
        email: payload.email,
        password: payload.password
      });

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.email).toBe(payload.email);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it('rejects login with an incorrect password', async () => {
    const { payload } = await registerTestUser();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: payload.email,
        password: 'wrong-password'
      });

    expect(response.status).toBe(401);
  });

  it('rejects login for a nonexistent user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'not-found@example.com',
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
      .set('Authorization', `Bearer ${registerResponse.body.token}`);

    expect(response.status).toBe(200);
    expectSafeUser(response.body.user);
    expect(response.body.user.email).toBe(payload.email);
  });
});
