const prisma = require('../utils/prisma');

function createAIQuestion(userId, data) {
  return prisma.aIQuestion.create({
    data: {
      userId,
      ...data
    }
  });
}

function createAIRecommendation(userId, data) {
  return prisma.aIRecommendation.create({
    data: {
      userId,
      ...data
    }
  });
}

function createWrongAnswerNote(userId, data) {
  return prisma.wrongAnswerNote.create({
    data: {
      userId,
      ...data
    }
  });
}

function findAIQuestionsByUserId(userId) {
  return prisma.aIQuestion.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

function findAIRecommendationsByUserId(userId) {
  return prisma.aIRecommendation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

function findWrongAnswerNotesByUserId(userId) {
  return prisma.wrongAnswerNote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
}

function findStudyNoteByIdAndUserId(noteId, userId) {
  return prisma.studyNote.findFirst({
    where: {
      id: noteId,
      userId
    },
    select: {
      id: true,
      userId: true
    }
  });
}

module.exports = {
  createAIQuestion,
  createAIRecommendation,
  createWrongAnswerNote,
  findAIQuestionsByUserId,
  findAIRecommendationsByUserId,
  findStudyNoteByIdAndUserId,
  findWrongAnswerNotesByUserId
};
