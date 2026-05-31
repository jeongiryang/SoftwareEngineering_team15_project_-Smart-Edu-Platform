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

function findAIChatRoomsByUserId(userId) {
  return prisma.aIChatRoom.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 8
  });
}

function findAIChatRoomByIdAndUserId(roomId, userId) {
  return prisma.aIChatRoom.findFirst({
    where: {
      id: roomId,
      userId
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });
}

function createAIChatRoom(userId, data = {}) {
  return prisma.aIChatRoom.create({
    data: {
      userId,
      ...data
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 20
      }
    }
  });
}

function createAIChatMessage(userId, roomId, data) {
  const { roomTitle, ...messageData } = data;

  return prisma.$transaction(async (tx) => {
    const message = await tx.aIChatMessage.create({
      data: {
        userId,
        roomId,
        ...messageData
      }
    });

    const room = await tx.aIChatRoom.update({
      where: { id: roomId },
      data: {
        title: data.roomTitle,
        updatedAt: new Date()
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    });

    return { message, room };
  });
}

function deleteAIChatRoom(roomId) {
  return prisma.aIChatRoom.delete({
    where: { id: roomId }
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
  createAIChatMessage,
  createAIChatRoom,
  createAIQuestion,
  createAIRecommendation,
  createWrongAnswerNote,
  deleteAIChatRoom,
  findAIChatRoomByIdAndUserId,
  findAIChatRoomsByUserId,
  findAIQuestionsByUserId,
  findAIRecommendationsByUserId,
  findStudyNoteByIdAndUserId,
  findWrongAnswerNotesByUserId
};
