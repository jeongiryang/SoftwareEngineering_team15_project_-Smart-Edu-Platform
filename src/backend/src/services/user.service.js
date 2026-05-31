const {
  deactivateUser,
  findPublicProfileById,
  findUserById,
  findUserWithProfileById,
  getPublicProfileLearningStats,
  getUserActivityStats,
  updateUser,
  updateUserPassword,
  upsertUserProfile
} = require('../repositories/user.repository');
const { comparePassword, hashPassword } = require('../utils/password');
const { notFoundError, unauthorizedError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields, validatePassword } = require('../utils/validators');
const { sanitizeUser } = require('./auth.service');

const EDITABLE_PROFILE_FIELDS = ['learningGoal', 'preferredSubject', 'profileImageUrl'];
const EDITABLE_ACCOUNT_FIELDS = ['name'];
const PASSWORD_FIELDS = ['currentPassword', 'newPassword'];
const WITHDRAWAL_FIELDS = ['currentPassword', 'confirmationText'];
const WITHDRAWAL_CONFIRMATION_TEXT = '탈퇴합니다';
const WITHDRAWN_USER_NAME = '탈퇴한 사용자';

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

function maskLoginId(loginId = '') {
  const value = String(loginId || '').trim();

  if (!value) {
    return '';
  }

  if (value.length <= 3) {
    return `${value.slice(0, 1)}**`;
  }

  return `${value.slice(0, 2)}***${value.slice(-1)}`;
}

function sanitizePublicShopItem(item) {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    type: item.type,
    assetUrl: item.assetUrl
  };
}

function resolveAppliedShopValue(item) {
  if (!item) {
    return null;
  }

  return item.type === 'TITLE' ? item.name : item.assetUrl;
}

function buildPublicAppearance(profile, purchases = []) {
  const appearance = {
    profileImageUrl: profile?.profileImageUrl || null,
    profileBackgroundUrl: profile?.profileBackgroundUrl || null,
    titleText: profile?.titleText || null,
    equippedItems: {
      profileImage: null,
      profileBackground: null,
      title: null
    }
  };

  purchases.forEach((purchase) => {
    const item = purchase.item;
    const appliedValue = resolveAppliedShopValue(item);

    if (item?.type === 'PROFILE_IMAGE' && appearance.profileImageUrl && appearance.profileImageUrl === appliedValue) {
      appearance.equippedItems.profileImage = sanitizePublicShopItem(item);
    }

    if (item?.type === 'PROFILE_BACKGROUND' && appearance.profileBackgroundUrl && appearance.profileBackgroundUrl === appliedValue) {
      appearance.equippedItems.profileBackground = sanitizePublicShopItem(item);
    }

    if (item?.type === 'TITLE' && appearance.titleText && appearance.titleText === appliedValue) {
      appearance.equippedItems.title = sanitizePublicShopItem(item);
    }
  });

  return appearance;
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
  requireFields(payload, ['name'], 'Nickname is required');

  if (typeof payload.name !== 'string') {
    throw validationError('Nickname must be a string', { field: 'name' });
  }

  const name = normalizeString(payload.name);

  if (!name) {
    throw validationError('Nickname is required', { field: 'name' });
  }

  if (name.length > 40) {
    throw validationError('Nickname must be 40 characters or fewer', {
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

function validateWithdrawalPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Account withdrawal payload must be an object');
  }

  assertSupportedFields(payload, WITHDRAWAL_FIELDS, 'Account withdrawal payload contains unsupported fields');
  requireFields(payload, WITHDRAWAL_FIELDS, 'Current password and confirmation text are required');

  if (typeof payload.currentPassword !== 'string') {
    throw validationError('Current password must be a string', { field: 'currentPassword' });
  }

  if (typeof payload.confirmationText !== 'string') {
    throw validationError('Confirmation text must be a string', { field: 'confirmationText' });
  }

  if (normalizeString(payload.confirmationText) !== WITHDRAWAL_CONFIRMATION_TEXT) {
    throw validationError('Confirmation text does not match', {
      field: 'confirmationText',
      expected: WITHDRAWAL_CONFIRMATION_TEXT
    });
  }
}

async function getMyUser(userId) {
  const user = await findUserWithProfileById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  return sanitizeUserWithProfile(user);
}

async function getPublicProfile(userId) {
  const targetUserId = parsePositiveInteger(userId, 'userId');
  const [user, stats] = await Promise.all([
    findPublicProfileById(targetUserId),
    getPublicProfileLearningStats(targetUserId)
  ]);

  if (!user || user.status !== 'ACTIVE') {
    throw notFoundError('Public profile not found');
  }

  return {
    id: user.id,
    name: user.name,
    displayLoginId: maskLoginId(user.loginId),
    createdAt: user.createdAt,
    learningGoal: user.profile?.learningGoal || null,
    preferredSubject: user.profile?.preferredSubject || null,
    appearance: buildPublicAppearance(user.profile, user.shopPurchases),
    stats
  };
}

async function getMyActivityStats(userId) {
  const user = await findUserById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  const stats = await getUserActivityStats(userId);

  return {
    ...stats,
    reactionBasis: 'GIVEN'
  };
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

async function withdrawMyAccount(userId, payload) {
  validateWithdrawalPayload(payload);

  const user = await findUserById(userId);

  if (!user) {
    throw notFoundError('User not found');
  }

  const passwordMatches = await comparePassword(payload.currentPassword, user.passwordHash);

  if (!passwordMatches) {
    throw unauthorizedError('Current password is incorrect');
  }

  const withdrawnUser = await deactivateUser(userId, {
    status: 'DEACTIVATED',
    name: WITHDRAWN_USER_NAME
  });

  return sanitizeUser(withdrawnUser);
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
  WITHDRAWAL_CONFIRMATION_TEXT,
  WITHDRAWAL_FIELDS,
  buildProfileUpdateData,
  buildAccountUpdateData,
  changeMyPassword,
  getMyActivityStats,
  getMyUser,
  getPublicProfile,
  sanitizeProfile,
  sanitizeUserWithProfile,
  updateMyAccount,
  updateMyProfile,
  withdrawMyAccount
};
