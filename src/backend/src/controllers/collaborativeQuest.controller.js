const collaborativeQuestService = require('../services/collaborativeQuest.service');
const { broadcastRealtimeEventToUsers } = require('../realtime/websocket.server');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

function getQuestParticipantIds(quest) {
  return Array.isArray(quest?.participants)
    ? quest.participants.map((participant) => participant.userId).filter(Boolean)
    : [];
}

function buildRealtimeQuestPayload(quest) {
  return {
    id: quest.id,
    questId: quest.id,
    title: quest.title,
    currentValue: quest.currentValue,
    goalValue: quest.goalValue,
    progressRate: quest.progressRate,
    progressPercent: quest.progressPercent,
    status: quest.status,
    rewardPoints: quest.rewardPoints,
    participantCount: quest.participantCount,
    completed: quest.status === 'COMPLETED',
    updatedAt: quest.updatedAt
  };
}

function broadcastCollaborativeQuestEvent(type, quest) {
  const userIds = getQuestParticipantIds(quest);

  if (!userIds.length) {
    return;
  }

  broadcastRealtimeEventToUsers(userIds, type, {
    quest: buildRealtimeQuestPayload(quest)
  });
}

const listCollaborativeQuestsController = asyncHandler(async (req, res) => {
  const quests = await collaborativeQuestService.getCollaborativeQuests(req.user.id, req.query);

  sendSuccess(res, 200, { quests });
});

const getCollaborativeQuestDetailController = asyncHandler(async (req, res) => {
  const quest = await collaborativeQuestService.getCollaborativeQuestDetail(
    req.user.id,
    req.params.questId
  );

  sendSuccess(res, 200, { quest });
});

const createCollaborativeQuestController = asyncHandler(async (req, res) => {
  const quest = await collaborativeQuestService.createCollaborativeQuest(req.user.id, req.body);

  broadcastCollaborativeQuestEvent('collabQuest.progress.updated', quest);
  sendCreated(res, { quest });
});

const joinCollaborativeQuestController = asyncHandler(async (req, res) => {
  const quest = await collaborativeQuestService.joinCollaborativeQuest(req.user.id, req.params.questId);

  broadcastCollaborativeQuestEvent('collabQuest.progress.updated', quest);
  sendSuccess(res, 200, { quest });
});

const addCollaborativeQuestContributionController = asyncHandler(async (req, res) => {
  const result = await collaborativeQuestService.addCollaborativeQuestContribution(
    req.user.id,
    req.params.questId,
    req.body
  );

  broadcastCollaborativeQuestEvent(
    result.completed ? 'collabQuest.completed' : 'collabQuest.progress.updated',
    result.quest
  );
  sendCreated(res, result);
});

const claimCollaborativeQuestRewardController = asyncHandler(async (req, res) => {
  const reward = await collaborativeQuestService.claimCollaborativeQuestReward(
    req.user.id,
    req.params.questId
  );

  broadcastCollaborativeQuestEvent('collabQuest.completed', reward.quest);
  sendSuccess(res, 200, { reward });
});

const updateCollaborativeQuestVisibilityController = asyncHandler(async (req, res) => {
  const quest = await collaborativeQuestService.updateCollaborativeQuestVisibility(
    req.user.id,
    req.params.questId,
    req.body
  );

  sendSuccess(res, 200, { quest });
});

module.exports = {
  addCollaborativeQuestContribution: addCollaborativeQuestContributionController,
  claimCollaborativeQuestReward: claimCollaborativeQuestRewardController,
  createCollaborativeQuest: createCollaborativeQuestController,
  getCollaborativeQuestDetail: getCollaborativeQuestDetailController,
  joinCollaborativeQuest: joinCollaborativeQuestController,
  listCollaborativeQuests: listCollaborativeQuestsController,
  updateCollaborativeQuestVisibility: updateCollaborativeQuestVisibilityController
};
