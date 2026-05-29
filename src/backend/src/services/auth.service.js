const { createUser, findUserByLoginId, findUserById } = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { conflictError, forbiddenError, notFoundError, unauthorizedError } = require('../utils/errors');
const { normalizeLoginId, normalizeString, requireFields, validateLoginId, validatePassword } = require('../utils/validators');

function sanitizeUser(user) {
  return {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

function validateRegisterInput({ loginId, password, name }) {
  requireFields({ loginId, password, name }, ['loginId', 'password', 'name'], 'Login ID, password, and name are required');
  validateLoginId(loginId);
  validatePassword(password);
}

function validateLoginInput({ loginId, password }) {
  requireFields({ loginId, password }, ['loginId', 'password'], 'Login ID and password are required');
}

async function registerUser({ loginId, password, name }) {
  const normalizedLoginId = normalizeLoginId(loginId);
  const normalizedName = normalizeString(name);

  validateRegisterInput({
    loginId: normalizedLoginId,
    password,
    name: normalizedName
  });

  const existingUser = await findUserByLoginId(normalizedLoginId);

  if (existingUser) {
    throw conflictError('Login ID is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    loginId: normalizedLoginId,
    name: normalizedName,
    passwordHash
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function loginUser({ loginId, password }) {
  const normalizedLoginId = normalizeLoginId(loginId);

  validateLoginInput({
    loginId: normalizedLoginId,
    password
  });

  const user = await findUserByLoginId(normalizedLoginId);

  if (!user) {
    throw unauthorizedError('Invalid login ID or password');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorizedError('Invalid login ID or password');
  }

  if (user.status !== 'ACTIVE') {
    throw forbiddenError('Account is not active');
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  return sanitizeUser(user);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  sanitizeUser
};
