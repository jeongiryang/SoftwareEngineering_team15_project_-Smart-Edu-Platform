const {
  findUserById,
  findUserWithProfileById,
  updateUser,
  updateUserPassword,
  upsertUserProfile
} = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password');
const { notFoundError, unauthorizedError, validationError } = require('../utils/errors');
const { normalizeString, requireFields, validatePassword } = require('../utils/validators');
const { sanitizeUser } = require('./auth.service');

const EDITABLE_PROFILE_FIELDS = ['learningGoal', 'preferredSubject', 'profileImageUrl'];
const EDITABLE_ACCOUNT_FIELDS = ['name'];
const PASSWORD_FIELDS = ['currentPassword', 'newPassword'];

function sanitizeProfile(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    userId: profile.userId,
    learningGoal: profile.learningGoal,
    preferredSubject: profile.preferredSubject,
    profileImageUrl: profile.profileImageUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function sanitizeUserWithProfile(user) {
  return {
    ...sanitizeUser(user),
    profile: sanitizeProfile(user.profile)
  };
}

function buildProfileUpdateData(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Profile update payload must be an object');
  }

  const fields = Object.keys(payload);
  const unsupportedFields = fields.filter((field) => !EDITABLE_PROFILE_FIELDS.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError('Profile update contains unsupported fields', {
      fields: unsupportedFields
    });
  }

  const data = {};

  EDITABLE_PROFILE_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(payload, field)) {
      return;
    }

    const value = payload[field];

    if (value === null) {
      data[field] = null;
      return;
    }

    if (typeof value !== 'string') {
      throw validationError('Profile fields must be strings or null', { field });
    }

    data[field] = normalizeString(value);
  });

  if (Object.keys(data).length === 0) {
    throw validationError('Profile update requires at least one editable field', {
      fields: EDITABLE_PROFILE_FIELDS
    });
  }

  return data;
}

function assertSupportedFields(payload = {}, allowedFields, message) {
  const fields = Object.keys(payload);
  const unsupportedFields = fields.filter((field) => !allowedFields.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError(message, { fields: unsupportedFields });
  }
}

function buildAccountUpdateData(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Account update payload must be an object');
  }

  assertSupportedFields(payload, EDITABLE_ACCOUNT_FIELDS, 'Account update contains unsupported fields');
  requireFields(payload, ['name'], 'Name is required');

  if (typeof payload.name !== 'string') {
    throw validationError('Name must be a string', { field: 'name' });
  }

  const name = normalizeString(payload.name);

  if (!name) {
    throw validationError('Name is required', { field: 'name' });
  }

  if (name.length > 40) {
    throw validationError('Name must be 40 characters or fewer', {
      field: 'name',
      maxLength: 40
    });
  }

  return { name };
}

function validatePasswordPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Password change payload must be an object');
  }

  assertSupportedFields(payload, PASSWORD_FIELDS, 'Password change payload contains unsupported fields');
  requireFields(payload, PASSWORD_FIELDS, 'Current password and new password are required');

  if (typeof payload.currentPassword !== 'string') {
    throw validationError('Current password must be a string', { field: 'currentPassword' });
  }

  validatePassword(payload.newPassword);
}

async function getMyUser(userId) {
  const user = await findUserWithProfileById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  return sanitizeUserWithProfile(user);
}

async function updateMyAccount(userId, payload) {
  const existingUser = await findUserById(userId);

  if (!existingUser) {
    throw notFoundError('User not found');
  }

  const data = buildAccountUpdateData(payload);
  const user = await updateUser(userId, data);

  return sanitizeUser(user);
}

async function changeMyPassword(userId, payload) {
  validatePasswordPayload(payload);

  const user = await findUserById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  const passwordMatches = await comparePassword(payload.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorizedError('Current password is incorrect');
  }

  const passwordHash = await hashPassword(payload.newPassword);
  const updatedUser = await updateUserPassword(userId, passwordHash);

  return sanitizeUser(updatedUser);
}

async function updateMyProfile(userId, payload) {
  const user = await findUserWithProfileById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  const data = buildProfileUpdateData(payload);
  const profile = await upsertUserProfile(userId, data);

  return sanitizeProfile(profile);
}

module.exports = {
  EDITABLE_ACCOUNT_FIELDS,
  EDITABLE_PROFILE_FIELDS,
  PASSWORD_FIELDS,
  buildProfileUpdateData,
  buildAccountUpdateData,
  changeMyPassword,
  getMyUser,
  sanitizeProfile,
  sanitizeUserWithProfile,
  updateMyAccount,
  updateMyProfile
};
