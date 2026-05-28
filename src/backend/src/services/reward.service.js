const rewardRepository = require('../repositories/reward.repository');
const { conflictError, notFoundError } = require('../utils/errors');
const { parsePositiveInteger } = require('../utils/validators');

const QUEST_METRIC_BY_TYPE = {
  TOTAL_STUDY_MINUTES: 'totalStudyMinutes',
  TASK_COMPLETION: 'completedTaskCount'
};

function sanitizeAccount(account) {
  return {
    id: account.id,
    userId: account.userId,
    pointBalance: account.pointBalance,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  };
}

function sanitizeBadge(badge) {
  if (!badge) {
    return null;
  }

  return {
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    condition: badge.condition,
    createdAt: badge.createdAt,
    updatedAt: badge.updatedAt
  };
}

function sanitizeUserBadge(userBadge) {
  return {
    id: userBadge.id,
    userId: userBadge.userId,
    badge: sanitizeBadge(userBadge.badge),
    achievedAt: userBadge.achievedAt
  };
}

function sanitizeQuestProgress(userQuest) {
  const targetValue = userQuest.quest.targetValue;

  return {
    id: userQuest.quest.id,
    code: userQuest.quest.code,
    title: userQuest.quest.title,
    description: userQuest.quest.description,
    type: userQuest.quest.type,
    targetValue,
    rewardPoints: userQuest.quest.rewardPoints,
    progressValue: userQuest.progressValue,
    progressRate: targetValue > 0 ? Math.min(userQuest.progressValue / targetValue, 1) : 0,
    status: userQuest.status,
    achievedAt: userQuest.achievedAt,
    claimedAt: userQuest.claimedAt,
    badge: sanitizeBadge(userQuest.quest.badge)
  };
}

function sanitizePointTransaction(transaction) {
  return {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    reason: transaction.reason,
    sourceType: transaction.sourceType,
    sourceId: transaction.sourceId,
    createdAt: transaction.createdAt
  };
}

async function ensureRewardAccount(userId) {
  const account = await rewardRepository.findRewardAccountByUserId(userId);

  if (account) {
    return account;
  }

  return rewardRepository.createRewardAccount(userId);
}

function resolveQuestProgress(quest, existingUserQuest, metrics) {
  const metricName = QUEST_METRIC_BY_TYPE[quest.type];
  const metricValue = metricName ? metrics[metricName] || 0 : 0;
  const progressValue = Math.max(metricValue, existingUserQuest?.progressValue || 0);
  const isAchieved = progressValue >= quest.targetValue;

  if (existingUserQuest?.status === 'CLAIMED') {
    return {
      progressValue,
      status: 'CLAIMED',
      achievedAt: existingUserQuest.achievedAt,
      claimedAt: existingUserQuest.claimedAt
    };
  }

  return {
    progressValue,
    status: isAchieved ? 'ACHIEVED' : 'IN_PROGRESS',
    achievedAt: isAchieved ? existingUserQuest?.achievedAt || new Date() : null,
    claimedAt: null
  };
}

async function syncUserQuests(userId) {
  const [activeQuests, userQuests, metrics] = await Promise.all([
    rewardRepository.findActiveQuests(),
    rewardRepository.findUserQuestsByUserId(userId),
    rewardRepository.getRewardMetrics(userId)
  ]);
  const userQuestByQuestId = new Map(userQuests.map((userQuest) => [userQuest.questId, userQuest]));
  const syncedQuests = [];

  for (const quest of activeQuests) {
    const existingUserQuest = userQuestByQuestId.get(quest.id);
    const progressData = resolveQuestProgress(quest, existingUserQuest, metrics);
    const syncedQuest = await rewardRepository.upsertUserQuestProgress(
      userId,
      quest.id,
      progressData
    );

    syncedQuests.push(syncedQuest);
  }

  return {
    metrics,
    quests: syncedQuests
  };
}

async function getUserRewards(userId) {
  const account = await ensureRewardAccount(userId);
  const { metrics, quests } = await syncUserQuests(userId);
  const [badges, recentPointTransactions] = await Promise.all([
    rewardRepository.findUserBadgesByUserId(userId),
    rewardRepository.findRecentPointTransactionsByUserId(userId)
  ]);

  return {
    account: sanitizeAccount(account),
    metrics,
    quests: quests.map(sanitizeQuestProgress),
    badges: badges.map(sanitizeUserBadge),
    recentPointTransactions: recentPointTransactions.map(sanitizePointTransaction)
  };
}

async function claimQuestReward(userId, questId) {
  const id = parsePositiveInteger(questId, 'questId');
  await ensureRewardAccount(userId);
  await syncUserQuests(userId);

  const userQuest = await rewardRepository.findUserQuestByUserIdAndQuestId(userId, id);

  if (!userQuest) {
    throw notFoundError('Reward quest not found');
  }

  if (userQuest.status === 'CLAIMED') {
    throw conflictError('Reward quest already claimed');
  }

  if (userQuest.status !== 'ACHIEVED') {
    throw conflictError('Reward quest is not achieved yet');
  }

  const result = await rewardRepository.claimQuestReward(userId, userQuest);

  if (!result) {
    throw conflictError('Reward quest already claimed');
  }

  return {
    account: sanitizeAccount(result.account),
    quest: sanitizeQuestProgress(result.userQuest),
    badge: result.userBadge ? sanitizeUserBadge(result.userBadge) : null,
    pointTransaction: result.pointTransaction
      ? sanitizePointTransaction(result.pointTransaction)
      : null
  };
}

module.exports = {
  claimQuestReward,
  getUserRewards,
  sanitizeAccount,
  sanitizeBadge,
  sanitizeQuestProgress,
  sanitizeUserBadge
};
