const prisma = require('../utils/prisma');

function findSchedulesByUserId(userId) {
  return prisma.studySchedule.findMany({
    where: { userId },
    orderBy: [
      { startAt: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}

function createSchedule(userId, data) {
  return prisma.studySchedule.create({
    data: {
      userId,
      ...data
    }
  });
}

function findScheduleByIdAndUser(id, userId, includeTasks = false) {
  return prisma.studySchedule.findFirst({
    where: {
      id,
      userId
    },
    include: includeTasks
      ? {
          tasks: {
            orderBy: [
              { dueDate: 'asc' },
              { createdAt: 'desc' }
            ]
          }
        }
      : undefined
  });
}

function updateSchedule(id, data) {
  return prisma.studySchedule.update({
    where: { id },
    data
  });
}

function deleteSchedule(id) {
  return prisma.studySchedule.delete({
    where: { id }
  });
}

module.exports = {
  createSchedule,
  deleteSchedule,
  findScheduleByIdAndUser,
  findSchedulesByUserId,
  updateSchedule
};
