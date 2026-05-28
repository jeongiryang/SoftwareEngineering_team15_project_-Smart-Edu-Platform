const prisma = require('../utils/prisma');

function createFocusSession(userId, data) {
  return prisma.focusSession.create({
    data: {
      userId,
      ...data
    }
  });
}

function findFocusSessionsByUserId(userId) {
  return prisma.focusSession.findMany({
    where: { userId },
    orderBy: [
      { startedAt: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

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

module.exports = {
  createFocusSession,
  findFocusSessionsByUserId,
  findFocusSessionsByUserIdAndDateRange
};
