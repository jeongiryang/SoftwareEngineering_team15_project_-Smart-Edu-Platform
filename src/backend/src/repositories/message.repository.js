const prisma = require('../utils/prisma');

const USER_SELECT = {
  id: true,
  name: true,
  loginId: true
};

const MESSAGE_INCLUDE = {
  sender: {
    select: USER_SELECT
  }
};

const THREAD_SUMMARY_INCLUDE = {
  participantA: {
    select: USER_SELECT
  },
  participantB: {
    select: USER_SELECT
  },
  readStates: true,
  messages: {
    include: MESSAGE_INCLUDE,
    orderBy: {
      createdAt: 'desc'
    },
    take: 1
  }
};

const THREAD_DETAIL_INCLUDE = {
  participantA: {
    select: USER_SELECT
  },
  participantB: {
    select: USER_SELECT
  },
  readStates: true,
  messages: {
    include: MESSAGE_INCLUDE,
    orderBy: {
      createdAt: 'asc'
    }
  }
};

function normalizeParticipantPair(userId, friendId) {
  const firstUserId = Number(userId);
  const secondUserId = Number(friendId);

  return firstUserId < secondUserId
    ? { participantAId: firstUserId, participantBId: secondUserId }
    : { participantAId: secondUserId, participantBId: firstUserId };
}

function findMessageThreadsForUser(userId) {
  return prisma.directMessageThread.findMany({
    where: {
      OR: [
        { participantAId: userId },
        { participantBId: userId }
      ]
    },
    include: THREAD_SUMMARY_INCLUDE,
    orderBy: [
      { lastMessageAt: 'desc' },
      { updatedAt: 'desc' },
      { id: 'desc' }
    ]
  });
}

function findMessageThreadById(threadId) {
  return prisma.directMessageThread.findUnique({
    where: {
      id: threadId
    },
    include: THREAD_DETAIL_INCLUDE
  });
}

function findMessageThreadSummaryById(threadId) {
  return prisma.directMessageThread.findUnique({
    where: {
      id: threadId
    },
    include: THREAD_SUMMARY_INCLUDE
  });
}

function findMessageThreadBetween(userId, friendId) {
  return prisma.directMessageThread.findUnique({
    where: {
      participantAId_participantBId: normalizeParticipantPair(userId, friendId)
    },
    include: THREAD_SUMMARY_INCLUDE
  });
}

async function findOrCreateMessageThread(userId, friendId) {
  const pair = normalizeParticipantPair(userId, friendId);

  return prisma.$transaction(async (tx) => {
    const existingThread = await tx.directMessageThread.findUnique({
      where: {
        participantAId_participantBId: pair
      },
      include: THREAD_SUMMARY_INCLUDE
    });

    if (existingThread) {
      return existingThread;
    }

    return tx.directMessageThread.create({
      data: {
        ...pair,
        readStates: {
          create: [
            { userId: pair.participantAId },
            { userId: pair.participantBId }
          ]
        }
      },
      include: THREAD_SUMMARY_INCLUDE
    });
  });
}

async function createDirectMessage({ threadId, senderId, content }) {
  return prisma.$transaction(async (tx) => {
    const message = await tx.directMessage.create({
      data: {
        threadId,
        senderId,
        content
      },
      include: MESSAGE_INCLUDE
    });

    await tx.directMessageThread.update({
      where: {
        id: threadId
      },
      data: {
        lastMessageAt: message.createdAt
      }
    });

    await tx.directMessageReadState.upsert({
      where: {
        threadId_userId: {
          threadId,
          userId: senderId
        }
      },
      update: {
        lastReadAt: message.createdAt
      },
      create: {
        threadId,
        userId: senderId,
        lastReadAt: message.createdAt
      }
    });

    const thread = await tx.directMessageThread.findUnique({
      where: {
        id: threadId
      },
      include: THREAD_SUMMARY_INCLUDE
    });

    return { message, thread };
  });
}

function markMessageThreadRead(threadId, userId, readAt = new Date()) {
  return prisma.directMessageReadState.upsert({
    where: {
      threadId_userId: {
        threadId,
        userId
      }
    },
    update: {
      lastReadAt: readAt
    },
    create: {
      threadId,
      userId,
      lastReadAt: readAt
    }
  });
}

function countUnreadMessages({ threadId, userId, lastReadAt }) {
  return prisma.directMessage.count({
    where: {
      threadId,
      senderId: {
        not: userId
      },
      ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {})
    }
  });
}

module.exports = {
  countUnreadMessages,
  createDirectMessage,
  findMessageThreadBetween,
  findMessageThreadById,
  findMessageThreadSummaryById,
  findMessageThreadsForUser,
  findOrCreateMessageThread,
  markMessageThreadRead,
  normalizeParticipantPair
};
