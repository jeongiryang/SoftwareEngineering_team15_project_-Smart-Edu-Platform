const {
  createSchedule,
  deleteSchedule: deleteScheduleRecord,
  findScheduleByIdAndUser,
  findSchedulesByUserId,
  updateSchedule: updateScheduleRecord
} = require('../repositories/schedule.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH'];
const SCHEDULE_FIELDS = ['title', 'subject', 'startAt', 'endAt', 'priority', 'memo'];

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
  if (value === null) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid date`, { field });
  }

  return date;
}

function normalizeOptionalStringField(value, field) {
  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string or null`, { field });
  }

  return normalizeString(value);
}

function normalizeRequiredStringField(value, field) {
  if (typeof value !== 'string' || normalizeString(value) === '') {
    throw validationError(`${field} is required`, { field });
  }

  return normalizeString(value);
}

function normalizePriority(value) {
  if (!PRIORITY_VALUES.includes(value)) {
    throw validationError('priority must be one of LOW, MEDIUM, HIGH', {
      field: 'priority',
      allowedValues: PRIORITY_VALUES
    });
  }

  return value;
}

function sanitizeTask(task) {
  if (!task) {
    return null;
  }

  return {
    id: task.id,
    userId: task.userId,
    scheduleId: task.scheduleId,
    title: task.title,
    status: task.status,
    dueDate: task.dueDate,
    priority: task.priority,
    memo: task.memo,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  };
}

function sanitizeSchedule(schedule) {
  if (!schedule) {
    return null;
  }

  const sanitized = {
    id: schedule.id,
    userId: schedule.userId,
    title: schedule.title,
    subject: schedule.subject,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    priority: schedule.priority,
    memo: schedule.memo,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt
  };

  if (Object.prototype.hasOwnProperty.call(schedule, 'tasks')) {
    sanitized.tasks = Array.isArray(schedule.tasks) ? schedule.tasks.map(sanitizeTask) : [];
  }

  return sanitized;
}

function buildScheduleData(payload = {}, options = { partial: false }) {
  assertPlainObject(payload, 'Schedule payload must be an object');
  assertSupportedFields(payload, SCHEDULE_FIELDS, 'Schedule payload contains unsupported fields');

  if (!options.partial) {
    requireFields(payload, ['title', 'startAt']);
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredStringField(payload.title, 'title');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'subject')) {
    data.subject = normalizeOptionalStringField(payload.subject, 'subject');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'startAt')) {
    data.startAt = parseDateField(payload.startAt, 'startAt');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'endAt')) {
    data.endAt = parseDateField(payload.endAt, 'endAt');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
    data.priority = normalizePriority(payload.priority);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'memo')) {
    data.memo = normalizeOptionalStringField(payload.memo, 'memo');
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Schedule update requires at least one editable field', {
      fields: SCHEDULE_FIELDS
    });
  }

  return data;
}

async function listSchedules(userId) {
  const schedules = await findSchedulesByUserId(userId);

  return schedules.map(sanitizeSchedule);
}

async function createUserSchedule(userId, payload) {
  const data = buildScheduleData(payload);
  const schedule = await createSchedule(userId, data);

  return sanitizeSchedule(schedule);
}

async function getUserSchedule(userId, scheduleId) {
  const id = parsePositiveInteger(scheduleId, 'scheduleId');
  const schedule = await findScheduleByIdAndUser(id, userId, true);

  if (!schedule) {
    throw notFoundError('Schedule not found');
  }

  return sanitizeSchedule(schedule);
}

async function updateUserSchedule(userId, scheduleId, payload) {
  const id = parsePositiveInteger(scheduleId, 'scheduleId');
  const schedule = await findScheduleByIdAndUser(id, userId);

  if (!schedule) {
    throw notFoundError('Schedule not found');
  }

  const data = buildScheduleData(payload, { partial: true });
  const updatedSchedule = await updateScheduleRecord(id, data);

  return sanitizeSchedule(updatedSchedule);
}

async function deleteUserSchedule(userId, scheduleId) {
  const id = parsePositiveInteger(scheduleId, 'scheduleId');
  const schedule = await findScheduleByIdAndUser(id, userId);

  if (!schedule) {
    throw notFoundError('Schedule not found');
  }

  const deletedSchedule = await deleteScheduleRecord(id);

  return sanitizeSchedule(deletedSchedule);
}

module.exports = {
  PRIORITY_VALUES,
  buildScheduleData,
  createUserSchedule,
  deleteUserSchedule,
  getUserSchedule,
  listSchedules,
  sanitizeSchedule,
  sanitizeTask,
  updateUserSchedule
};
