const { createUser, findUserByEmail, findUserById } = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function createError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

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
  if (!email || !password || !name) {
    throw createError('Email, password, and name are required', 400);
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw createError('Email format is invalid', 400);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw createError('Password must be at least 8 characters', 400);
  }
}

function validateLoginInput({ email, password }) {
  if (!email || !password) {
    throw createError('Email and password are required', 400);
  }
}

async function registerUser({ email, password, name }) {
  const normalizedEmail = email ? email.trim().toLowerCase() : email;
  const normalizedName = name ? name.trim() : name;

  validateRegisterInput({
    email: normalizedEmail,
    password,
    name: normalizedName
  });

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw createError('Email is already registered', 409);
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
  const normalizedEmail = email ? email.trim().toLowerCase() : email;

  validateLoginInput({
    email: normalizedEmail,
    password
  });

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw createError('Invalid email or password', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw createError('Account is not active', 403);
  }

  return {
    user: sanitizeUser(user),
    token: signToken(user)
  };
}

async function getCurrentUser(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw createError('User not found', 404);
  }

  return sanitizeUser(user);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  sanitizeUser
};
