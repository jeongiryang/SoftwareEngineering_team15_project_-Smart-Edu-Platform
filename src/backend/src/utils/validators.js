const { validationError } = require('./errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_MIN_PASSWORD_LENGTH = 8;

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeEmail(email) {
  const normalizedEmail = normalizeString(email);
  return typeof normalizedEmail === 'string' ? normalizedEmail.toLowerCase() : normalizedEmail;
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

function validateEmail(email) {
  if (!EMAIL_PATTERN.test(email)) {
    throw validationError('Email format is invalid', { field: 'email' });
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
  normalizeEmail,
  normalizeString,
  parsePositiveInteger,
  requireFields,
  validateEmail,
  validatePassword
};
