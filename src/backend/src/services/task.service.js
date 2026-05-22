const {
  createTask,
  deleteTask: deleteTaskRecord,
  findTaskByIdAndUser,
  findTasksByUserId,
  updateTask: updateTaskRecord
} = require('../repositories/task.repository');
const { findScheduleByIdAndUser } = require('../repositories/schedule.repository');
const { notFoundError, validationError } = require('../utils/errors');
const { normalizeString, parsePositiveInteger, requireFields } = require('../utils/validators');

const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH'];
const TASK_STATUS_VALUES = ['TODO', 'IN_PROGRESS', 'DONE'];
const TASK_CREATE_FIELDS = ['title', 'scheduleId', 'status', 'dueDate', 'priority', 'memo'];
const TASK_UPDATE_FIELDS = ['title', 'scheduleId', 'dueDate', 'priority', 'memo'];

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

function normalizeTaskStatus(value) {
  if (!TASK_STATUS_VALUES.includes(value)) {
    throw validationError('status must be one of TODO, IN_PROGRESS, DONE', {
      field: 'status',
      allowedValues: TASK_STATUS_VALUES
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

async function assertOwnedSchedule(userId, scheduleId) {
  if (scheduleId === null || scheduleId === undefined) {
    return;
  }

  const schedule = await findScheduleByIdAndUser(scheduleId, userId);

  if (!schedule) {
    throw notFoundError('Schedule not found');
  }
}

async function buildTaskData(userId, payload = {}, allowedFields, options = { partial: false }) {
  assertPlainObject(payload, 'Task payload must be an object');
  assertSupportedFields(payload, allowedFields, 'Task payload contains unsupported fields');

  if (!options.partial) {
    requireFields(payload, ['title']);
  }

  const data = {};

  if (Object.prototype.hasOwnProperty.call(payload, 'title')) {
    data.title = normalizeRequiredStringField(payload.title, 'title');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'scheduleId')) {
    data.scheduleId = payload.scheduleId === null ? null : parsePositiveInteger(payload.scheduleId, 'scheduleId');
    await assertOwnedSchedule(userId, data.scheduleId);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'status')) {
    data.status = normalizeTaskStatus(payload.status);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'dueDate')) {
    data.dueDate = parseDateField(payload.dueDate, 'dueDate');
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
    data.priority = normalizePriority(payload.priority);
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'memo')) {
    data.memo = normalizeOptionalStringField(payload.memo, 'memo');
  }

  if (Object.keys(data).length === 0) {
    throw validationError('Task update requires at least one editable field', {
      fields: allowedFields
    });
  }

  return data;
}

async function listTasks(userId, query = {}) {
  const filters = {};

  if (Object.prototype.hasOwnProperty.call(query, 'scheduleId')) {
    filters.scheduleId = parsePositiveInteger(query.scheduleId, 'scheduleId');
    await assertOwnedSchedule(userId, filters.scheduleId);
  }

  const tasks = await findTasksByUserId(userId, filters);

  return tasks.map(sanitizeTask);
}

async function createUserTask(userId, payload) {
  const data = await buildTaskData(userId, payload, TASK_CREATE_FIELDS);
  const task = await createTask(userId, data);

  return sanitizeTask(task);
}

async function updateUserTask(userId, taskId, payload) {
  const id = parsePositiveInteger(taskId, 'taskId');
  const task = await findTaskByIdAndUser(id, userId);

  if (!task) {
    throw notFoundError('Task not found');
  }

  const data = await buildTaskData(userId, payload, TASK_UPDATE_FIELDS, { partial: true });
  const updatedTask = await updateTaskRecord(id, data);

  return sanitizeTask(updatedTask);
}

async function updateUserTaskStatus(userId, taskId, payload) {
  assertPlainObject(payload, 'Task status payload must be an object');
  requireFields(payload, ['status']);

  const id = parsePositiveInteger(taskId, 'taskId');
  const task = await findTaskByIdAndUser(id, userId);

  if (!task) {
    throw notFoundError('Task not found');
  }

  const updatedTask = await updateTaskRecord(id, {
    status: normalizeTaskStatus(payload.status)
  });

  return sanitizeTask(updatedTask);
}

async function deleteUserTask(userId, taskId) {
  const id = parsePositiveInteger(taskId, 'taskId');
  const task = await findTaskByIdAndUser(id, userId);

  if (!task) {
    throw notFoundError('Task not found');
  }

  const deletedTask = await deleteTaskRecord(id);

  return sanitizeTask(deletedTask);
}

module.exports = {
  TASK_STATUS_VALUES,
  buildTaskData,
  createUserTask,
  deleteUserTask,
  listTasks,
  sanitizeTask,
  updateUserTask,
  updateUserTaskStatus
};
