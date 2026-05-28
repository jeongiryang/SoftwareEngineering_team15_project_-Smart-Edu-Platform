const {
  findFocusSessionsByUserIdAndDateRange,
  findTasksByUserIdAndDateRange
} = require('../repositories/statistics.repository');
const { validationError } = require('../utils/errors');

const STATISTICS_QUERY_FIELDS = ['startDate', 'endDate'];
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

function normalizeDateRange(query = {}) {
  assertSupportedFields(query, STATISTICS_QUERY_FIELDS, 'Statistics query contains unsupported fields');

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

async function getSummary(userId, query = {}) {
  const { startDate, endDate } = normalizeDateRange(query);
  const sessions = await findFocusSessionsByUserIdAndDateRange(userId, startDate, endDate);
  const tasks = await findTasksByUserIdAndDateRange(userId, startDate, endDate);

  const totalDurationMs = sessions.reduce((total, session) => total + session.durationMs, 0);
  const totalMinutes = Math.floor(totalDurationMs / (1000 * 60));
  const completedTaskCount = tasks.filter((task) => task.status === 'DONE').length;
  const completionRate = tasks.length === 0
    ? 0
    : Math.round((completedTaskCount / tasks.length) * 100);

  return {
    totalMinutes,
    completionRate,
    sessionCount: sessions.length,
    taskCount: tasks.length
  };
}

async function getHeatmapData(userId, query = {}) {
  const { startDate, endDate } = normalizeDateRange(query);
  const sessions = await findFocusSessionsByUserIdAndDateRange(userId, startDate, endDate);

  return sessions.reduce((heatmap, session) => {
    const dateKey = session.startedAt.toISOString().split('T')[0];

    if (!heatmap[dateKey]) {
      heatmap[dateKey] = {
        durationMs: 0,
        sessionCount: 0
      };
    }

    heatmap[dateKey].durationMs += session.durationMs;
    heatmap[dateKey].sessionCount += 1;

    return heatmap;
  }, {});
}

module.exports = {
  STATISTICS_QUERY_FIELDS,
  getHeatmapData,
  getSummary,
  normalizeDateRange
};
