const rewardService = require('../services/reward.service');
const { sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const getMyRewardsController = asyncHandler(async (req, res) => {
  const rewards = await rewardService.getUserRewards(req.user.id);

  sendSuccess(res, 200, { rewards });
});

const claimQuestRewardController = asyncHandler(async (req, res) => {
  const reward = await rewardService.claimQuestReward(req.user.id, req.params.questId);

  sendSuccess(res, 200, { reward });
});

module.exports = {
  claimQuestReward: claimQuestRewardController,
  getMyRewards: getMyRewardsController
};
