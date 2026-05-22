function createUniqueEmail(prefix = 'test-user') {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  return `${prefix}-${suffix}@example.com`;
}

function createAuthHeader(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function createUserPayload(overrides = {}) {
  return {
    email: createUniqueEmail('auth-test'),
    password: 'password123',
    name: 'Auth Test User',
    ...overrides
  };
}

module.exports = {
  createAuthHeader,
  createUniqueEmail,
  createUserPayload
};
