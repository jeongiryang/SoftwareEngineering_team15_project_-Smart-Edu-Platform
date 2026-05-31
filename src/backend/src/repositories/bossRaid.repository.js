const prisma = require('../utils/prisma');

const RAID_INCLUDE = {
  badge: true
};

const PARTY_USER_SELECT = {
  id: true,
  name: true,
  loginId: true,
  profile: {
    select: {
      profileImageUrl: true,
      profileBackgroundUrl: true,
      titleText: true
    }
  }
};

const PARTY_INCLUDE = {
  raid: {
    include: RAID_INCLUDE
  },
  owner: {
    select: PARTY_USER_SELECT
  },
  members: {
    include: {
      user: {
        select: PARTY_USER_SELECT
      }
    },
    orderBy: {
      joinedAt: 'asc'
    }
  },
  contributions: {
    include: {
      user: {
        select: PARTY_USER_SELECT
      }
    },
    orderBy: {
      totalDamage: 'desc'
    }
  }
};

function findActiveBossRaids() {
  return prisma.bossRaid.findMany({
    where: {
      isActive: true
    },
    include: RAID_INCLUDE,
    orderBy: [
      { startsAt: 'asc' },
      { id: 'asc' }
    ]
  });
}

function findBossRaidById(raidId) {
  return prisma.bossRaid.findUnique({
    where: {
      id: raidId
    },
    include: RAID_INCLUDE
  });
}

function findBossRaidPartyById(partyId) {
  return prisma.bossRaidParty.findUnique({
    where: {
      id: partyId
    },
    include: PARTY_INCLUDE
  });
}

function findBossRaidPartyByJoinCode(joinCode) {
  return prisma.bossRaidParty.findUnique({
    where: {
      joinCode
    },
    include: PARTY_INCLUDE
  });
}

function findUserBossRaidParties(userId) {
  return prisma.bossRaidParty.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: PARTY_INCLUDE,
    orderBy: [
      { updatedAt: 'desc' },
      { id: 'desc' }
    ]
  });
}

function findUserBossRaidPartyForRaid(userId, raidId) {
  return prisma.bossRaidParty.findFirst({
    where: {
      raidId,
      members: {
        some: {
          userId
        }
      }
    },
    include: PARTY_INCLUDE
  });
}

function findPublicBossRaidParties(raidId = null) {
  return prisma.bossRaidParty.findMany({
    where: {
      isPublic: true,
      status: 'OPEN',
      ...(raidId
        ? {
            raidId
          }
        : {}),
      raid: {
        isActive: true,
        OR: [
          { endsAt: null },
          { endsAt: { gte: new Date() } }
        ]
      }
    },
    include: PARTY_INCLUDE,
    orderBy: [
      { updatedAt: 'desc' },
      { id: 'desc' }
    ]
  });
}

function findBossRaidRewardClaim(raidId, userId) {
  return prisma.bossRaidRewardClaim.findUnique({
    where: {
      raidId_userId: {
        raidId,
        userId
      }
    }
  });
}

function createBossRaidParty({ raidId, ownerId, name, joinCode, isPublic = true }) {
  return prisma.bossRaidParty.create({
    data: {
      raidId,
      ownerId,
      name,
      joinCode,
      isPublic,
      members: {
        create: {
          userId: ownerId
        }
      },
      contributions: {
        create: {
          userId: ownerId
        }
      }
    },
    include: PARTY_INCLUDE
  });
}

function addBossRaidPartyMember(partyId, userId) {
  return prisma.bossRaidParty.update({
    where: {
      id: partyId
    },
    data: {
      members: {
        create: {
          userId
        }
      },
      contributions: {
        create: {
          userId
        }
      }
    },
    include: PARTY_INCLUDE
  });
}

async function getBossRaidMemberMetrics(userId, startsAt) {
  const [focusAggregate, completedTaskCount] = await Promise.all([
    prisma.focusSession.aggregate({
      where: {
        userId,
        endedAt: {
          gte: startsAt
        }
      },
      _sum: {
        durationMs: true
      }
    }),
    prisma.studyTask.count({
      where: {
        userId,
        status: 'DONE',
        updatedAt: {
          gte: startsAt
        }
      }
    })
  ]);

  return {
    focusMinutes: Math.floor((focusAggregate._sum.durationMs || 0) / 60000),
    completedTaskCount
  };
}

function updateBossRaidPartyProgress(partyId, data) {
  return prisma.bossRaidParty.update({
    where: {
      id: partyId
    },
    data,
    include: PARTY_INCLUDE
  });
}

function replaceBossRaidContributions(partyId, contributions) {
  return prisma.$transaction(async (tx) => {
    await tx.bossRaidContribution.deleteMany({
      where: {
        partyId
      }
    });

    if (contributions.length > 0) {
      await tx.bossRaidContribution.createMany({
        data: contributions.map((contribution) => ({
          partyId,
          ...contribution
        }))
      });
    }

    return tx.bossRaidParty.findUnique({
      where: {
        id: partyId
      },
      include: PARTY_INCLUDE
    });
  });
}

function ensureRewardAccount(tx, userId) {
  return tx.rewardAccount.upsert({
    where: {
      userId
    },
    update: {},
    create: {
      userId
    }
  });
}

async function claimBossRaidReward({ userId, party, contribution, baseRewardPoints, bonusRewardPoints }) {
  return prisma.$transaction(async (tx) => {
    const existingClaim = await tx.bossRaidRewardClaim.findUnique({
      where: {
        raidId_userId: {
          raidId: party.raidId,
          userId
        }
      }
    });

    if (existingClaim) {
      return null;
    }

    const totalRewardPoints = baseRewardPoints + bonusRewardPoints;
    const account = await ensureRewardAccount(tx, userId);

    const claim = await tx.bossRaidRewardClaim.create({
      data: {
        raidId: party.raidId,
        partyId: party.id,
        userId,
        baseRewardPoints,
        bonusRewardPoints,
        badgeGranted: Boolean(party.raid.badgeId)
      }
    });

    const updatedAccount = totalRewardPoints > 0
      ? await tx.rewardAccount.update({
          where: {
            id: account.id
          },
          data: {
            pointBalance: {
              increment: totalRewardPoints
            }
          }
        })
      : account;

    const pointTransaction = totalRewardPoints > 0
      ? await tx.pointTransaction.create({
          data: {
            userId,
            accountId: account.id,
            type: 'EARN',
            amount: totalRewardPoints,
            reason: `${party.raid.name} 처치 보상`,
            sourceType: 'BOSS_RAID',
            sourceId: party.id
          }
        })
      : null;

    const userBadge = party.raid.badgeId
      ? await tx.userBadge.upsert({
          where: {
            userId_badgeId: {
              userId,
              badgeId: party.raid.badgeId
            }
          },
          update: {},
          create: {
            userId,
            badgeId: party.raid.badgeId
          },
          include: {
            badge: true
          }
        })
      : null;

    return {
      claim,
      account: updatedAccount,
      pointTransaction,
      userBadge,
      contribution
    };
  });
}

module.exports = {
  addBossRaidPartyMember,
  claimBossRaidReward,
  createBossRaidParty,
  findActiveBossRaids,
  findBossRaidById,
  findBossRaidPartyById,
  findBossRaidPartyByJoinCode,
  findBossRaidRewardClaim,
  findPublicBossRaidParties,
  findUserBossRaidParties,
  findUserBossRaidPartyForRaid,
  getBossRaidMemberMetrics,
  replaceBossRaidContributions,
  updateBossRaidPartyProgress
};
