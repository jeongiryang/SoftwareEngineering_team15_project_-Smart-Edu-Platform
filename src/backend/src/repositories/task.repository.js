const prisma = require('../utils/prisma');

function findTasksByUserId(userId, filters = {}) {
  const where = { userId };

  if (Object.prototype.hasOwnProperty.call(filters, 'scheduleId')) {
    where.scheduleId = filters.scheduleId;
  }

  return prisma.studyTask.findMany({
    where,
    orderBy: [
      { dueDate: 'asc' },
      { createdAt: 'desc' }
    ]
  });
}

function createTask(userId, data) {
  return prisma.studyTask.create({
    data: {
      userId,
      ...data
    }
  });
}

function findTaskByIdAndUser(id, userId) {
  return prisma.studyTask.findFirst({
    where: {
      id,
      userId
    }
  });
}

function updateTask(id, data) {
  return prisma.studyTask.update({
    where: { id },
    data
  });
}

function deleteTask(id) {
  return prisma.studyTask.delete({
    where: { id }
  });
}

module.exports = {
  createTask,
  deleteTask,
  findTaskByIdAndUser,
  findTasksByUserId,
  updateTask
};
