const prisma = require('../utils/prisma');

function findPreferenceByUserId(userId) {
  return prisma.accessibilityPreference.findUnique({
    where: { userId }
  });
}

function upsertPreference(userId, data) {
  return prisma.accessibilityPreference.upsert({
    where: { userId },
    update: data,
    create: {
      userId,
      ...data
    }
  });
}

function createVoiceRequest(userId, data) {
  return prisma.voiceAccessibilityRequest.create({
    data: {
      userId,
      ...data
    }
  });
}

function createReviewReminder(userId, { message, scheduledAt }) {
  return prisma.notification.create({
    data: {
      userId,
      type: 'REVIEW',
      message,
      scheduledAt
    }
  });
}

function findActiveReviewReminders(userId) {
  return prisma.notification.findMany({
    where: {
      userId,
      type: 'REVIEW',
      readAt: null
    },
    orderBy: {
      scheduledAt: 'asc'
    }
  });
}

module.exports = {
  createReviewReminder,
  createVoiceRequest,
  findActiveReviewReminders,
  findPreferenceByUserId,
  upsertPreference
};
