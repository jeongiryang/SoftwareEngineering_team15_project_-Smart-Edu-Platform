const systemRepository = require('../repositories/system.repository');
const { validationError } = require('../utils/errors');
const { normalizeString } = require('../utils/validators');

const DEFAULT_MAINTENANCE_TITLE = '사각사각 업데이트 중';
const DEFAULT_MAINTENANCE_MESSAGE = '더 좋은 학습 경험을 준비하고 있어요. 조금만 기다려주세요.';
const MAINTENANCE_FIELDS = ['enabled', 'title', 'message', 'estimatedEndAt'];
const ADMIN_NOTICE_FIELDS = ['title', 'message', 'level'];
const ADMIN_NOTICE_LEVELS = ['info', 'success', 'warning', 'danger'];
const MAX_TITLE_LENGTH = 80;
const MAX_MESSAGE_LENGTH = 500;

function sanitizeMaintenanceSetting(setting) {
  const normalized = setting || {};

  return {
    enabled: Boolean(normalized.enabled),
    title: normalized.title || DEFAULT_MAINTENANCE_TITLE,
    message: normalized.message || DEFAULT_MAINTENANCE_MESSAGE,
    estimatedEndAt: normalized.estimatedEndAt || null,
    updatedAt: normalized.updatedAt || null
  };
}

async function getMaintenanceSetting() {
  const setting = await systemRepository.findMaintenanceSetting();

  if (setting) {
    return sanitizeMaintenanceSetting(setting);
  }

  const created = await systemRepository.upsertMaintenanceSetting({
    enabled: false,
    title: DEFAULT_MAINTENANCE_TITLE,
    message: DEFAULT_MAINTENANCE_MESSAGE,
    estimatedEndAt: null
  });

  return sanitizeMaintenanceSetting(created);
}

function assertPlainObject(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError('Maintenance payload must be an object');
  }
}

function assertSupportedFields(payload) {
  const unsupportedFields = Object.keys(payload).filter((field) => !MAINTENANCE_FIELDS.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError('Maintenance payload contains unsupported fields', {
      fields: unsupportedFields
    });
  }
}

function normalizeRequiredText(value, field, maxLength) {
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string`, { field });
  }

  const normalizedValue = normalizeString(value);

  if (!normalizedValue) {
    throw validationError(`${field} is required`, { field });
  }

  if (normalizedValue.length > maxLength) {
    throw validationError(`${field} must be less than or equal to ${maxLength} characters`, {
      field,
      max: maxLength
    });
  }

  return normalizedValue;
}

function normalizeOptionalEstimatedEndAt(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError('estimatedEndAt must be an ISO date string or null', {
      field: 'estimatedEndAt'
    });
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw validationError('estimatedEndAt must be a valid ISO date string', {
      field: 'estimatedEndAt'
    });
  }

  return parsedDate;
}

function buildMaintenanceUpdateData(payload = {}) {
  assertPlainObject(payload);
  assertSupportedFields(payload);

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'enabled')) {
    if (typeof payload.enabled !== 'boolean') {
      throw validationError('enabled must be a boolean', { field: 'enabled' });
    }

    data.enabled = payload.enabled;
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredText(payload.title, 'title', MAX_TITLE_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'message')) {
    data.message = normalizeRequiredText(payload.message, 'message', MAX_MESSAGE_LENGTH);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'estimatedEndAt')) {
    data.estimatedEndAt = normalizeOptionalEstimatedEndAt(payload.estimatedEndAt);
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Maintenance update requires at least one editable field', {
      fields: MAINTENANCE_FIELDS
    });
  }

  return data;
}

async function updateMaintenanceSetting(payload = {}) {
  const current = await getMaintenanceSetting();
  const data = buildMaintenanceUpdateData(payload);
  const nextData = {
    enabled: Object.prototype.hasOwnProperty.call(data, 'enabled') ? data.enabled : current.enabled,
    title: data.title || current.title || DEFAULT_MAINTENANCE_TITLE,
    message: data.message || current.message || DEFAULT_MAINTENANCE_MESSAGE,
    estimatedEndAt: Object.prototype.hasOwnProperty.call(data, 'estimatedEndAt')
      ? data.estimatedEndAt
      : current.estimatedEndAt
  };

  const updated = await systemRepository.upsertMaintenanceSetting(nextData);

  return sanitizeMaintenanceSetting(updated);
}

function buildAdminNoticePayload(payload = {}) {
  assertPlainObject(payload);

  const unsupportedFields = Object.keys(payload).filter((field) => !ADMIN_NOTICE_FIELDS.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError('Admin notice payload contains unsupported fields', {
      fields: unsupportedFields
    });
  }

  const title = normalizeRequiredText(payload.title, 'title', MAX_TITLE_LENGTH);
  const message = normalizeRequiredText(payload.message, 'message', MAX_MESSAGE_LENGTH);
  const level = payload.level === undefined ? 'info' : normalizeString(payload.level);

  if (!ADMIN_NOTICE_LEVELS.includes(level)) {
    throw validationError('level must be one of info, success, warning, danger', {
      field: 'level',
      allowed: ADMIN_NOTICE_LEVELS
    });
  }

  return {
    id: `notice-${Date.now()}`,
    level,
    message,
    title
  };
}

module.exports = {
  ADMIN_NOTICE_LEVELS,
  DEFAULT_MAINTENANCE_MESSAGE,
  DEFAULT_MAINTENANCE_TITLE,
  buildAdminNoticePayload,
  buildMaintenanceUpdateData,
  getMaintenanceSetting,
  sanitizeMaintenanceSetting,
  updateMaintenanceSetting
};
