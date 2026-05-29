const prisma = require('../utils/prisma');

const USER_SELECT = {
  id: true,
  name: true,
  loginId: true
};

const QUEST_INCLUDE = {
  createdBy: {
    select: USER_SELECT
  },
  participants: {
    include: {
      user: {
        select: USER_SELECT
      }
    },
    orderBy: [
      { contributionValue: 'desc' },
      { joinedAt: 'asc' }
    ]
  },
  rewardClaims: true,
  contributions: {
    include: {
      user: {
        select: USER_SELECT
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 8
  }
};

function findCollaborativeQuests() {
  return prisma.collaborativeQuest.findMany({
    include: QUEST_INCLUDE,
    orderBy: [
      { status: 'asc' },
      { updatedAt: 'desc' },
      { id: 'desc' }
    ]
  });
}

function findCollaborativeQuestById(questId) {
  return prisma.collaborativeQuest.findUnique({
    where: {
      id: questId
    },
    include: QUEST_INCLUDE
  });
}

function createCollaborativeQuest({ title, description, goalValue, rewardPoints, createdById, endsAt }) {
  return prisma.collaborativeQuest.create({
    data: {
      title,
      description,
      goalValue,
      rewardPoints,
      createdById,
      endsAt,
      participants: {
        create: {
          userId: createdById
        }
      }
    },
    include: QUEST_INCLUDE
  });
}

function addCollaborativeQuestParticipant(questId, userId) {
  return prisma.collaborativeQuest.update({
    where: {
      id: questId
    },
    data: {
      participants: {
        create: {
          userId
        }
      }
    },
    include: QUEST_INCLUDE
  });
}

async function addCollaborativeQuestContribution({ questId, userId, amount, memo }) {
  return prisma.$transaction(async (tx) => {
    const quest = await tx.collaborativeQuest.findUnique({
      where: {
        id: questId
      },
      include: {
        participants: true
      }
    });

    if (!quest) {
      return { type: 'NOT_FOUND' };
    }

    if (!quest.participants.some((participant) => participant.userId === userId)) {
      return { type: 'NOT_PARTICIPANT' };
    }

    if (quest.status !== 'ACTIVE' || (quest.endsAt && quest.endsAt < new Date())) {
      return { type: 'NOT_ACTIVE' };
    }

    await tx.collaborativeQuestContribution.create({
      data: {
        questId,
        userId,
        amount,
        memo
      }
    });

    await tx.collaborativeQuestParticipant.update({
      where: {
        questId_userId: {
          questId,
          userId
        }
      },
      data: {
        contributionValue: {
          increment: amount
        }
      }
    });

    const progressedQuest = await tx.collaborativeQuest.update({
      where: {
        id: questId
      },
      data: {
        currentValue: {
          increment: amount
        }
      }
    });

    const nextValue = Math.min(progressedQuest.currentValue, progressedQuest.goalValue);
    const completed = nextValue >= progressedQuest.goalValue;

    await tx.collaborativeQuest.update({
      where: {
        id: questId
      },
      data: {
        currentValue: nextValue,
        status: completed ? 'COMPLETED' : 'ACTIVE',
        completedAt: completed ? progressedQuest.completedAt || new Date() : null
      }
    });

    const updatedQuest = await tx.collaborativeQuest.findUnique({
      where: {
        id: questId
      },
      include: QUEST_INCLUDE
    });

    return {
      type: 'UPDATED',
      completed,
      quest: updatedQuest
    };
  });
}

async function claimCollaborativeQuestReward({ questId, userId }) {
  return prisma.$transaction(async (tx) => {
    const quest = await tx.collaborativeQuest.findUnique({
      where: {
        id: questId
      },
      include: {
        participants: true
      }
    });

    if (!quest) {
      return { type: 'NOT_FOUND' };
    }

    if (!quest.participants.some((participant) => participant.userId === userId)) {
      return { type: 'NOT_PARTICIPANT' };
    }

    if (quest.status !== 'COMPLETED') {
      return { type: 'NOT_COMPLETED' };
    }

    const existingClaim = await tx.collaborativeQuestRewardClaim.findUnique({
      where: {
        questId_userId: {
          questId,
          userId
        }
      }
    });

    if (existingClaim) {
      return { type: 'ALREADY_CLAIMED' };
    }

    const claim = await tx.collaborativeQuestRewardClaim.create({
      data: {
        questId,
        userId,
        rewardPoints: quest.rewardPoints
      }
    });

    const account = await tx.rewardAccount.upsert({
      where: {
        userId
      },
      update: {},
      create: {
        userId
      }
    });

    const updatedAccount = quest.rewardPoints > 0
      ? await tx.rewardAccount.update({
          where: {
            id: account.id
          },
          data: {
            pointBalance: {
              increment: quest.rewardPoints
            }
          }
        })
      : account;

    const pointTransaction = quest.rewardPoints > 0
      ? await tx.pointTransaction.create({
          data: {
            userId,
            accountId: account.id,
            type: 'EARN',
            amount: quest.rewardPoints,
            reason: `${quest.title} collaborative quest reward`,
            sourceType: 'COLLABORATIVE_QUEST',
            sourceId: quest.id
          }
        })
      : null;

    const updatedQuest = await tx.collaborativeQuest.findUnique({
      where: {
        id: questId
      },
      include: QUEST_INCLUDE
    });

    return {
      type: 'CLAIMED',
      claim,
      account: updatedAccount,
      pointTransaction,
      quest: updatedQuest
    };
  });
}

module.exports = {
  addCollaborativeQuestContribution,
  addCollaborativeQuestParticipant,
  claimCollaborativeQuestReward,
  createCollaborativeQuest,
  findCollaborativeQuestById,
  findCollaborativeQuests
};
