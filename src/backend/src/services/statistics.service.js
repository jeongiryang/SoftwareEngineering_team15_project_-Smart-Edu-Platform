const {
  findFocusSessionsByUserIdAndDateRange,
  findTasksByUserIdAndDateRange
} = require('../repositories/statistics.repository');
const { validationError } = require('../utils/errors');

function parseDateField(value, field) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw validationError(`${field} must be a valid date`, { field });
  }

  return date;
}

function normalizeDateRange(query = {}) {
  const startDate = parseDateField(query.startDate, 'startDate');
  const endDate = parseDateField(query.endDate, 'endDate');

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
  getHeatmapData,
  getSummary,
  normalizeDateRange
};
