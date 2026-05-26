const {
  createFocusSession,
  findFocusSessionsByUserId,
  findFocusSessionsByUserIdAndDateRange
} = require('../repositories/focus.repository');
const { findTaskByIdAndUser } = require('../repositories/task.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger } = require('../utils/validators');

const FOCUS_SESSION_FIELDS = ['taskId', 'startedAt', 'endedAt', 'durationMs', 'memo'];

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
  let focusSessions;

  if (query.startDate || query.endDate) {
    if (!query.startDate || !query.endDate) {
      throw validationError('startDate and endDate are required together', {
        fields: ['startDate', 'endDate']
      });
    }

    const startedAt = parseDateField(query.startDate, 'startDate');
    const endedAt = parseDateField(query.endDate, 'endDate');

    if (startedAt > endedAt) {
      throw validationError('startDate must be earlier than or equal to endDate', {
        fields: ['startDate', 'endDate']
      });
    }

    focusSessions = await findFocusSessionsByUserIdAndDateRange(userId, startedAt, endedAt);
  } else {
    focusSessions = await findFocusSessionsByUserId(userId);
  }

  return focusSessions.map(sanitizeFocusSession);
}

module.exports = {
  FOCUS_SESSION_FIELDS,
  buildFocusSessionData,
  listFocusSessions,
  recordFocusSession,
  sanitizeFocusSession
};
