const prisma = require('../utils/prisma');

function findFocusSessionsByUserIdAndDateRange(userId, startDate, endDate) {
  return prisma.focusSession.findMany({
    where: {
      userId,
      startedAt: {
        gte: startDate
      },
      endedAt: {
        lte: endDate
      }
    },
    orderBy: [
      { startedAt: 'asc' },
      { createdAt: 'asc' }
    ]
  });
}

function findTasksByUserIdAndDateRange(userId, startDate, endDate) {
  return prisma.studyTask.findMany({
    where: {
      userId,
      updatedAt: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: [
      { updatedAt: 'asc' },
      { createdAt: 'asc' }
    ]
  });
}

module.exports = {
  findFocusSessionsByUserIdAndDateRange,
  findTasksByUserIdAndDateRange
};
