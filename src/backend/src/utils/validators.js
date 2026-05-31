const { validationError } = require('./errors');

const LOGIN_ID_PATTERN = /^[a-z0-9_-]{3,30}$/;
const DEFAULT_MIN_PASSWORD_LENGTH = 8;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeLoginId(loginId) {
  const normalizedLoginId = normalizeString(loginId);
  return typeof normalizedLoginId === 'string' ? normalizedLoginId.toLowerCase() : normalizedLoginId;
}

function requireFields(payload, fields, message = 'Required fields are missing') {
  const missingFields = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || normalizeString(value) === '';
  });

  if (missingFields.length > 0) {
    throw validationError(message, { fields: missingFields });
  }
}

function validateLoginId(loginId) {
  if (typeof loginId !== 'string' || !LOGIN_ID_PATTERN.test(loginId)) {
    throw validationError('Login ID must be 3-30 lowercase letters, numbers, underscores, or hyphens', {
      field: 'loginId',
      allowedPattern: 'a-z, 0-9, _, -',
      minLength: 3,
      maxLength: 30
    });
  }
}

function validatePassword(password, minLength = DEFAULT_MIN_PASSWORD_LENGTH) {
  if (typeof password !== 'string' || password.length < minLength) {
    throw validationError(`Password must be at least ${minLength} characters`, {
      field: 'password',
      minLength
    });
  }
}

function parsePositiveInteger(value, field = 'id') {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw validationError(`${field} must be a positive integer`, { field });
  }

  return parsedValue;
}

module.exports = {
  DEFAULT_MIN_PASSWORD_LENGTH,
  normalizeLoginId,
  normalizeString,
  parsePositiveInteger,
  requireFields,
  validateLoginId,
  validatePassword
};
