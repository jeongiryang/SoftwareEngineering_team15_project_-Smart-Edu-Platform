const bossRaidService = require('../services/bossRaid.service');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

const listBossRaidsController = asyncHandler(async (req, res) => {
  const raids = await bossRaidService.getBossRaids(req.user.id);

  sendSuccess(res, 200, { raids });
});

const createBossRaidPartyController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.createBossRaidParty(req.user.id, req.body);

  sendCreated(res, { party });
});

const joinBossRaidPartyController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.joinBossRaidParty(req.user.id, req.body);

  sendSuccess(res, 200, { party });
});

const getMyBossRaidPartiesController = asyncHandler(async (req, res) => {
  const parties = await bossRaidService.getMyBossRaidParties(req.user.id);

  sendSuccess(res, 200, { parties });
});

const getBossRaidPartyDetailController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.getBossRaidPartyDetail(req.user.id, req.params.partyId);

  sendSuccess(res, 200, { party });
});

const claimBossRaidRewardController = asyncHandler(async (req, res) => {
  const reward = await bossRaidService.claimBossRaidReward(req.user.id, req.params.partyId);

  sendSuccess(res, 200, { reward });
});

module.exports = {
  claimBossRaidReward: claimBossRaidRewardController,
  createBossRaidParty: createBossRaidPartyController,
  getBossRaidPartyDetail: getBossRaidPartyDetailController,
  getMyBossRaidParties: getMyBossRaidPartiesController,
  joinBossRaidParty: joinBossRaidPartyController,
  listBossRaids: listBossRaidsController
};
