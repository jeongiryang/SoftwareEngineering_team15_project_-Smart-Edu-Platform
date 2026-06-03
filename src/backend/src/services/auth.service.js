const {
  createUser,
  findLatestUserStatusAction,
  findUserByLoginId,
  findUserById
} = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { conflictError, forbiddenError, notFoundError, unauthorizedError } = require('../utils/errors');
const { normalizeLoginId, normalizeString, requireFields, validateLoginId, validatePassword } = require('../utils/validators');

function buildAccountRestriction(user, action) {
  if (!user || user.status === 'ACTIVE') {
    return null;
  }

  return {
    status: user.status,
    reason: action?.reason || null,
    changedAt: action?.createdAt || user.updatedAt || null
  };
}

async function getLatestUserStatusAction(userId) {
  if (typeof findLatestUserStatusAction !== 'function') {
    return null;
  }

  return findLatestUserStatusAction(userId);
}

function sanitizeUser(user, accountAction = null) {
  const sanitizedUser = {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  const accountRestriction = buildAccountRestriction(user, accountAction);

  if (accountRestriction) {
    sanitizedUser.accountRestriction = accountRestriction;
  }

  return sanitizedUser;
}

function validateRegisterInput({ loginId, password, name }) {
  requireFields({ loginId, password, name }, ['loginId', 'password', 'name'], 'Login ID, password, and nickname are required');
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
    const accountAction = await getLatestUserStatusAction(user.id);
    throw forbiddenError('Account is not active', {
      accountRestriction: buildAccountRestriction(user, accountAction)
    });
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

  const accountAction = user.status === 'ACTIVE' ? null : await getLatestUserStatusAction(user.id);

  return sanitizeUser(user, accountAction);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  sanitizeUser
};
