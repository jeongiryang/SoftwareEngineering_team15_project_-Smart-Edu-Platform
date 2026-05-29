const collaborativeQuestRepository = require('../repositories/collaborativeQuest.repository');
const {
  conflictError,
  notFoundError,
  validationError
} = require('../utils/errors');
const {
  normalizeString,
  parsePositiveInteger
} = require('../utils/validators');

const MAX_TITLE_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_MEMO_LENGTH = 160;
const MAX_GOAL_VALUE = 100000;
const MAX_REWARD_POINTS = 100000;
const MAX_CONTRIBUTION_AMOUNT = 10000;

function normalizeOptionalText(value, maxLength, field) {
  const normalized = normalizeString(value);

  if (!normalized) {
    return null;
  }

  if (normalized.length > maxLength) {
    throw validationError(`${field} must be ${maxLength} characters or fewer`, { field, maxLength });
  }

  return normalized;
}

function parsePositiveBoundedInteger(value, field, maxValue) {
  const parsed = parsePositiveInteger(value, field);

  if (parsed > maxValue) {
    throw validationError(`${field} must be ${maxValue} or lower`, { field, maxValue });
  }

  return parsed;
}

function parseNonNegativeBoundedInteger(value, field, maxValue) {
  const parsed = Number(value ?? 0);

  if (!Number.isInteger(parsed) || parsed < 0 || parsed > maxValue) {
    throw validationError(`${field} must be between 0 and ${maxValue}`, { field, maxValue });
  }

  return parsed;
}

function parseOptionalDate(value, field) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw validationError(`${field} must be a valid date`, { field });
  }

  return parsed;
}

function ensureQuestTitle(title) {
  const normalizedTitle = normalizeString(title);

  if (!normalizedTitle) {
    throw validationError('title is required', { field: 'title' });
  }

  if (normalizedTitle.length > MAX_TITLE_LENGTH) {
    throw validationError(`title must be ${MAX_TITLE_LENGTH} characters or fewer`, {
      field: 'title',
      maxLength: MAX_TITLE_LENGTH
    });
  }

  return normalizedTitle;
}

function getProgressRate(quest) {
  if (!quest.goalValue || quest.goalValue <= 0) {
    return 0;
  }

  return Math.min(quest.currentValue / quest.goalValue, 1);
}

function isExpiredQuest(quest) {
  return Boolean(quest.endsAt && quest.endsAt < new Date());
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    loginId: user.loginId
  };
}

function sanitizeParticipant(participant) {
  return {
    userId: participant.userId,
    name: participant.user?.name,
    loginId: participant.user?.loginId,
    contributionValue: participant.contributionValue,
    joinedAt: participant.joinedAt
  };
}

function sanitizeContribution(contribution) {
  return {
    id: contribution.id,
    questId: contribution.questId,
    userId: contribution.userId,
    name: contribution.user?.name,
    loginId: contribution.user?.loginId,
    amount: contribution.amount,
    memo: contribution.memo,
    createdAt: contribution.createdAt
  };
}

function sanitizeQuest(quest, currentUserId = null) {
  const participantIds = (quest.participants || []).map((participant) => participant.userId);
  const hasJoined = currentUserId ? participantIds.includes(currentUserId) : false;
  const hasClaimed = currentUserId
    ? (quest.rewardClaims || []).some((claim) => claim.userId === currentUserId)
    : false;
  const currentParticipant = currentUserId
    ? (quest.participants || []).find((participant) => participant.userId === currentUserId)
    : null;
  const progressRate = getProgressRate(quest);
  const isExpired = isExpiredQuest(quest);

  return {
    id: quest.id,
    title: quest.title,
    description: quest.description,
    goalValue: quest.goalValue,
    currentValue: quest.currentValue,
    progressRate,
    progressPercent: Math.round(progressRate * 1000) / 10,
    status: quest.status,
    rewardPoints: quest.rewardPoints,
    startsAt: quest.startsAt,
    endsAt: quest.endsAt,
    completedAt: quest.completedAt,
    createdAt: quest.createdAt,
    updatedAt: quest.updatedAt,
    creator: sanitizeUser(quest.createdBy),
    participantCount: (quest.participants || []).length,
    participants: (quest.participants || []).map(sanitizeParticipant),
    recentContributions: (quest.contributions || []).map(sanitizeContribution),
    currentUserContributionValue: currentParticipant?.contributionValue || 0,
    hasJoined,
    hasClaimed,
    isExpired,
    canJoin: quest.status === 'ACTIVE' && !isExpired && !hasJoined,
    canContribute: quest.status === 'ACTIVE' && !isExpired && hasJoined,
    canClaim: quest.status === 'COMPLETED' && hasJoined && !hasClaimed
  };
}

function ensureQuestIsActive(quest) {
  if (quest.status !== 'ACTIVE') {
    throw conflictError('Collaborative quest is not active');
  }

  if (isExpiredQuest(quest)) {
    throw conflictError('Collaborative quest is expired');
  }
}

async function getCollaborativeQuests(userId) {
  const quests = await collaborativeQuestRepository.findCollaborativeQuests();

  return quests.map((quest) => sanitizeQuest(quest, userId));
}

async function getCollaborativeQuestDetail(userId, questId) {
  const id = parsePositiveInteger(questId, 'questId');
  const quest = await collaborativeQuestRepository.findCollaborativeQuestById(id);

  if (!quest) {
    throw notFoundError('Collaborative quest not found');
  }

  return sanitizeQuest(quest, userId);
}

async function createCollaborativeQuest(userId, payload) {
  const title = ensureQuestTitle(payload.title);
  const description = normalizeOptionalText(payload.description, MAX_DESCRIPTION_LENGTH, 'description');
  const goalValue = parsePositiveBoundedInteger(payload.goalValue, 'goalValue', MAX_GOAL_VALUE);
  const rewardPoints = parseNonNegativeBoundedInteger(payload.rewardPoints, 'rewardPoints', MAX_REWARD_POINTS);
  const endsAt = parseOptionalDate(payload.endsAt, 'endsAt');

  if (endsAt && endsAt <= new Date()) {
    throw validationError('endsAt must be in the future', { field: 'endsAt' });
  }

  const quest = await collaborativeQuestRepository.createCollaborativeQuest({
    title,
    description,
    goalValue,
    rewardPoints,
    createdById: userId,
    endsAt
  });

  return sanitizeQuest(quest, userId);
}

async function joinCollaborativeQuest(userId, questId) {
  const id = parsePositiveInteger(questId, 'questId');
  const quest = await collaborativeQuestRepository.findCollaborativeQuestById(id);

  if (!quest) {
    throw notFoundError('Collaborative quest not found');
  }

  ensureQuestIsActive(quest);

  if (quest.participants.some((participant) => participant.userId === userId)) {
    throw conflictError('You already joined this collaborative quest');
  }

  try {
    const joinedQuest = await collaborativeQuestRepository.addCollaborativeQuestParticipant(id, userId);
    return sanitizeQuest(joinedQuest, userId);
  } catch (error) {
    if (error.code === 'P2002') {
      throw conflictError('You already joined this collaborative quest');
    }

    throw error;
  }
}

async function addCollaborativeQuestContribution(userId, questId, payload) {
  const id = parsePositiveInteger(questId, 'questId');
  const amount = parsePositiveBoundedInteger(payload.amount, 'amount', MAX_CONTRIBUTION_AMOUNT);
  const memo = normalizeOptionalText(payload.memo, MAX_MEMO_LENGTH, 'memo');

  const result = await collaborativeQuestRepository.addCollaborativeQuestContribution({
    questId: id,
    userId,
    amount,
    memo
  });

  if (result.type === 'NOT_FOUND') {
    throw notFoundError('Collaborative quest not found');
  }

  if (result.type === 'NOT_PARTICIPANT') {
    throw conflictError('Join this collaborative quest before contributing');
  }

  if (result.type === 'NOT_ACTIVE') {
    throw conflictError('Collaborative quest is not active');
  }

  return {
    quest: sanitizeQuest(result.quest, userId),
    completed: Boolean(result.completed)
  };
}

async function claimCollaborativeQuestReward(userId, questId) {
  const id = parsePositiveInteger(questId, 'questId');
  const result = await collaborativeQuestRepository.claimCollaborativeQuestReward({
    questId: id,
    userId
  });

  if (result.type === 'NOT_FOUND') {
    throw notFoundError('Collaborative quest not found');
  }

  if (result.type === 'NOT_PARTICIPANT') {
    throw conflictError('Join this collaborative quest before claiming rewards');
  }

  if (result.type === 'NOT_COMPLETED') {
    throw conflictError('Collaborative quest is not completed yet');
  }

  if (result.type === 'ALREADY_CLAIMED') {
    throw conflictError('Collaborative quest reward already claimed');
  }

  return {
    quest: sanitizeQuest(result.quest, userId),
    reward: {
      id: result.claim.id,
      rewardPoints: result.claim.rewardPoints,
      claimedAt: result.claim.claimedAt
    },
    account: {
      id: result.account.id,
      userId: result.account.userId,
      pointBalance: result.account.pointBalance
    },
    pointTransaction: result.pointTransaction
      ? {
          id: result.pointTransaction.id,
          type: result.pointTransaction.type,
          amount: result.pointTransaction.amount,
          reason: result.pointTransaction.reason,
          sourceType: result.pointTransaction.sourceType,
          sourceId: result.pointTransaction.sourceId,
          createdAt: result.pointTransaction.createdAt
        }
      : null
  };
}

module.exports = {
  addCollaborativeQuestContribution,
  claimCollaborativeQuestReward,
  createCollaborativeQuest,
  getCollaborativeQuestDetail,
  getCollaborativeQuests,
  joinCollaborativeQuest,
  sanitizeQuest
};
