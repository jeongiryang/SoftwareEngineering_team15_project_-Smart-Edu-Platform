const prisma = require('../utils/prisma');

const QUEST_INCLUDE = {
  badge: true
};

const USER_QUEST_INCLUDE = {
  quest: {
    include: QUEST_INCLUDE
  }
};

const USER_BADGE_INCLUDE = {
  badge: true
};

function createRewardAccount(userId) {
  return prisma.rewardAccount.create({
    data: {
      userId
    }
  });
}

function findRewardAccountByUserId(userId) {
  return prisma.rewardAccount.findUnique({
    where: {
      userId
    }
  });
}

function findActiveQuests() {
  return prisma.rewardQuest.findMany({
    where: {
      isActive: true
    },
    include: QUEST_INCLUDE,
    orderBy: {
      id: 'asc'
    }
  });
}

function findUserQuestsByUserId(userId) {
  return prisma.userQuest.findMany({
    where: {
      userId
    },
    include: USER_QUEST_INCLUDE,
    orderBy: {
      questId: 'asc'
    }
  });
}

function findUserQuestByUserIdAndQuestId(userId, questId) {
  return prisma.userQuest.findFirst({
    where: {
      userId,
      questId
    },
    include: USER_QUEST_INCLUDE
  });
}

function upsertUserQuestProgress(userId, questId, data) {
  return prisma.userQuest.upsert({
    where: {
      userId_questId: {
        userId,
        questId
      }
    },
    update: data,
    create: {
      userId,
      questId,
      ...data
    },
    include: USER_QUEST_INCLUDE
  });
}

function findUserBadgesByUserId(userId) {
  return prisma.userBadge.findMany({
    where: {
      userId
    },
    include: USER_BADGE_INCLUDE,
    orderBy: {
      achievedAt: 'desc'
    }
  });
}

function findRecentPointTransactionsByUserId(userId, limit = 10) {
  return prisma.pointTransaction.findMany({
    where: {
      userId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: limit
  });
}

async function getRewardMetrics(userId) {
  const [focusAggregate, completedTaskCount] = await Promise.all([
    prisma.focusSession.aggregate({
      where: {
        userId
      },
      _sum: {
        durationMs: true
      }
    }),
    prisma.studyTask.count({
      where: {
        userId,
        status: 'DONE'
      }
    })
  ]);

  return {
    totalStudyMinutes: Math.floor((focusAggregate._sum.durationMs || 0) / 60000),
    completedTaskCount
  };
}

async function claimQuestReward(userId, userQuest) {
  return prisma.$transaction(async (tx) => {
    const now = new Date();
    const updateResult = await tx.userQuest.updateMany({
      where: {
        id: userQuest.id,
        userId,
        status: 'ACHIEVED'
      },
      data: {
        status: 'CLAIMED',
        claimedAt: now
      }
    });

    if (updateResult.count === 0) {
      return null;
    }

    const account = await tx.rewardAccount.upsert({
      where: {
        userId
      },
      update: {
        pointBalance: {
          increment: userQuest.quest.rewardPoints
        }
      },
      create: {
        userId,
        pointBalance: userQuest.quest.rewardPoints
      }
    });

    const pointTransaction = userQuest.quest.rewardPoints > 0
      ? await tx.pointTransaction.create({
          data: {
            userId,
            accountId: account.id,
            type: 'EARN',
            amount: userQuest.quest.rewardPoints,
            reason: userQuest.quest.title,
            sourceType: 'REWARD_QUEST',
            sourceId: userQuest.questId
          }
        })
      : null;

    const userBadge = userQuest.quest.badgeId
      ? await tx.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId,
              badgeId: userQuest.quest.badgeId
            }
          },
          update: {},
          create: {
            userId,
            badgeId: userQuest.quest.badgeId,
            achievedAt: now
          },
          include: USER_BADGE_INCLUDE
        })
      : null;

    const claimedQuest = await tx.userQuest.findUnique({
      where: {
        id: userQuest.id
      },
      include: USER_QUEST_INCLUDE
    });

    return {
      account,
      pointTransaction,
      userBadge,
      userQuest: claimedQuest
    };
  });
}

module.exports = {
  claimQuestReward,
  createRewardAccount,
  findActiveQuests,
  findRecentPointTransactionsByUserId,
  findRewardAccountByUserId,
  findUserBadgesByUserId,
  findUserQuestByUserIdAndQuestId,
  findUserQuestsByUserId,
  getRewardMetrics,
  upsertUserQuestProgress
};
