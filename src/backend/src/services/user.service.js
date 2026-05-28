const { findUserWithProfileById, upsertUserProfile } = require('../repositories/user.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString } = require('../utils/validators');
const { sanitizeUser } = require('./auth.service');

const EDITABLE_PROFILE_FIELDS = ['learningGoal', 'preferredSubject', 'profileImageUrl'];

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
    profileBackgroundUrl: profile.profileBackgroundUrl,
    titleText: profile.titleText,
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

async function getMyUser(userId) {
  const user = await findUserWithProfileById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  return sanitizeUserWithProfile(user);
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
  EDITABLE_PROFILE_FIELDS,
  buildProfileUpdateData,
  getMyUser,
  sanitizeProfile,
  sanitizeUserWithProfile,
  updateMyProfile
};
