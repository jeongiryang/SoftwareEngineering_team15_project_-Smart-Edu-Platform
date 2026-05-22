const { createUser, findUserByEmail, findUserById } = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { conflictError, forbiddenError, notFoundError, unauthorizedError } = require('../utils/errors');
const { normalizeEmail, normalizeString, requireFields, validateEmail, validatePassword } = require('../utils/validators');

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status
  };
}

function validateRegisterInput({ email, password, name }) {
  requireFields({ email, password, name }, ['email', 'password', 'name'], 'Email, password, and name are required');
  validateEmail(email);
  validatePassword(password);
}

function validateLoginInput({ email, password }) {
  requireFields({ email, password }, ['email', 'password'], 'Email and password are required');
}

async function registerUser({ email, password, name }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedName = normalizeString(name);

  validateRegisterInput({
    email: normalizedEmail,
    password,
    name: normalizedName
  });

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw conflictError('Email is already registered');
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    email: normalizedEmail,
    name: normalizedName,
    passwordHash
  });

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);

  validateLoginInput({
    email: normalizedEmail,
    password
  });

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw unauthorizedError('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorizedError('Invalid email or password');
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
