function createUniqueLoginId(prefix = 'test-user') {
  const safePrefix = String(prefix).toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 12) || 'test';
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 100000).toString(36)}`;
  return `${safePrefix}-${suffix}`.slice(0, 30);
}

function createAuthHeader(token) {
  return {
    Authorization: `Bearer ${token}`
  };
}

function createUserPayload(overrides = {}) {
  return {
    loginId: createUniqueLoginId('auth-test'),
    password: 'password123',
    name: 'Auth Test User',
    ...overrides
  };
}

module.exports = {
  createAuthHeader,
  createUniqueLoginId,
  createUserPayload
};
