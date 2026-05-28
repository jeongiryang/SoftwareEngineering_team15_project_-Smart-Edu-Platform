const {
  createFocusSession,
  findFocusSessionsByUserId,
  findFocusSessionsByUserIdAndDateRange
} = require('../repositories/focus.repository');
const { findTaskByIdAndUser } = require('../repositories/task.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger } = require('../utils/validators');

const FOCUS_SESSION_FIELDS = ['taskId', 'startedAt', 'endedAt', 'durationMs', 'memo'];
const FOCUS_SESSION_QUERY_FIELDS = ['startDate', 'endDate'];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function assertPlainObject(payload, message) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw validationError(message);
  }
}

function assertSupportedFields(payload, allowedFields, message) {
  const unsupportedFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));

  if (unsupportedFields.length > 0) {
    throw validationError(message, { fields: unsupportedFields });
  }
}

function parseDateField(value, field) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid date`, { field });
  }

  return date;
}

function parseDateBoundaryField(value, field, boundary) {
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
    const suffix = boundary === 'end' ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    return new Date(`${value}${suffix}`);
  }

  return parseDateField(value, field);
}

function normalizeDateRangeQuery(query = {}) {
  assertSupportedFields(query, FOCUS_SESSION_QUERY_FIELDS, 'Focus session query contains unsupported fields');

  if (!query.startDate && !query.endDate) {
    return null;
  }

  if (!query.startDate || !query.endDate) {
    throw validationError('startDate and endDate are required together', {
      fields: ['startDate', 'endDate']
    });
  }

  const startDate = parseDateBoundaryField(query.startDate, 'startDate', 'start');
  const endDate = parseDateBoundaryField(query.endDate, 'endDate', 'end');

  if (startDate > endDate) {
    throw validationError('startDate must be earlier than or equal to endDate', {
      fields: ['startDate', 'endDate']
    });
  }

  return { startDate, endDate };
}

function parseDurationMs(value) {
  if (!Number.isInteger(value) || value <= 0) {
    throw validationError('durationMs must be a positive integer', { field: 'durationMs' });
  }

  return value;
}

function normalizeOptionalStringField(value, field) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string or null`, { field });
  }

  const normalizedValue = normalizeString(value);

  return normalizedValue === '' ? null : normalizedValue;
}

function sanitizeFocusSession(focusSession) {
  if (!focusSession) {
    return null;
  }

  return {
    id: focusSession.id,
    userId: focusSession.userId,
    taskId: focusSession.taskId,
    startedAt: focusSession.startedAt,
    endedAt: focusSession.endedAt,
    durationMs: focusSession.durationMs,
    memo: focusSession.memo ?? null,
    createdAt: focusSession.createdAt
  };
}

async function buildFocusSessionData(userId, payload = {}) {
  assertPlainObject(payload, 'Focus session payload must be an object');
  assertSupportedFields(payload, FOCUS_SESSION_FIELDS, 'Focus session payload contains unsupported fields');

  const startedAt = parseDateField(payload.startedAt, 'startedAt');
  const endedAt = parseDateField(payload.endedAt, 'endedAt');
  const durationMs = parseDurationMs(payload.durationMs);

  if (startedAt >= endedAt) {
    throw validationError('endedAt must be later than startedAt', {
      fields: ['startedAt', 'endedAt']
    });
  }

  let taskId = null;

  if (Object.prototype.hasOwnProperty.call(payload, 'taskId') && payload.taskId !== null) {
    taskId = parsePositiveInteger(payload.taskId, 'taskId');

    const task = await findTaskByIdAndUser(taskId, userId);

    if (!task) {
      throw notFoundError('Task not found');
    }
  }

  return {
    taskId,
    startedAt,
    endedAt,
    durationMs,
    memo: normalizeOptionalStringField(payload.memo, 'memo')
  };
}

async function recordFocusSession(userId, payload) {
  const data = await buildFocusSessionData(userId, payload);
  const focusSession = await createFocusSession(userId, data);

  return sanitizeFocusSession(focusSession);
}

async function listFocusSessions(userId, query = {}) {
  const dateRange = normalizeDateRangeQuery(query);

  if (dateRange) {
    const focusSessions = await findFocusSessionsByUserIdAndDateRange(
      userId,
      dateRange.startDate,
      dateRange.endDate
    );

    return focusSessions.map(sanitizeFocusSession);
  }

  const focusSessions = await findFocusSessionsByUserId(userId);

  return focusSessions.map(sanitizeFocusSession);
}

module.exports = {
  FOCUS_SESSION_FIELDS,
  FOCUS_SESSION_QUERY_FIELDS,
  buildFocusSessionData,
  listFocusSessions,
  normalizeDateRangeQuery,
  recordFocusSession,
  sanitizeFocusSession
};
