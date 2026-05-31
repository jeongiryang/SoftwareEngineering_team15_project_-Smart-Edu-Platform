const bossRaidService = require('../services/bossRaid.service');
const { broadcastRealtimeEventToUsers } = require('../realtime/websocket.server');
const { sendCreated, sendSuccess } = require('../utils/apiResponse');
const { asyncHandler } = require('../utils/asyncHandler');

function getPartyMemberIds(party) {
  return Array.isArray(party?.members)
    ? party.members.map((member) => member.userId).filter(Boolean)
    : [];
}

function broadcastBossRaidPartyEvent(type, party) {
  const userIds = getPartyMemberIds(party);

  if (!userIds.length) {
    return;
  }

  broadcastRealtimeEventToUsers(userIds, type, {
    party: {
      ...party,
      partyId: party.id,
      raidId: party.raid?.id || party.raidId,
      progressRate: party.raid?.maxHp
        ? Math.min((party.totalDamage || 0) / party.raid.maxHp, 1)
        : 0,
      participantCount: party.totalMembers || userIds.length,
      completed: party.status === 'CLEARED',
      updatedAt: party.lastCalculatedAt || new Date().toISOString()
    }
  });
}

const listBossRaidsController = asyncHandler(async (req, res) => {
  const raids = await bossRaidService.getBossRaids(req.user.id);

  sendSuccess(res, 200, { raids });
});

const createBossRaidPartyController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.createBossRaidParty(req.user.id, req.body);

  broadcastBossRaidPartyEvent('bossRaid.progress.updated', party);
  sendCreated(res, { party });
});

const joinBossRaidPartyController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.joinBossRaidParty(req.user.id, req.body);

  broadcastBossRaidPartyEvent('bossRaid.progress.updated', party);
  sendSuccess(res, 200, { party });
});

const listPublicBossRaidPartiesController = asyncHandler(async (req, res) => {
  const parties = await bossRaidService.getPublicBossRaidParties(req.user.id, req.query);

  sendSuccess(res, 200, { parties });
});

const joinPublicBossRaidPartyController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.joinPublicBossRaidParty(req.user.id, req.params.partyId);

  broadcastBossRaidPartyEvent('bossRaid.progress.updated', party);
  sendSuccess(res, 200, { party });
});

const getMyBossRaidPartiesController = asyncHandler(async (req, res) => {
  const parties = await bossRaidService.getMyBossRaidParties(req.user.id);

  sendSuccess(res, 200, { parties });
});

const getMyBossRaidInvitesController = asyncHandler(async (req, res) => {
  const invites = await bossRaidService.getMyBossRaidInvites(req.user.id);

  sendSuccess(res, 200, { invites });
});

const getBossRaidPartyInvitesController = asyncHandler(async (req, res) => {
  const invites = await bossRaidService.getBossRaidPartyInvites(req.user.id, req.params.partyId);

  sendSuccess(res, 200, { invites });
});

const createBossRaidInviteController = asyncHandler(async (req, res) => {
  const invite = await bossRaidService.createBossRaidInvite(req.user.id, req.params.partyId, req.body);

  sendCreated(res, { invite });
});

const acceptBossRaidInviteController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.acceptBossRaidInvite(req.user.id, req.params.inviteId);

  broadcastBossRaidPartyEvent('bossRaid.progress.updated', party);
  sendSuccess(res, 200, { party });
});

const declineBossRaidInviteController = asyncHandler(async (req, res) => {
  const invite = await bossRaidService.declineBossRaidInvite(req.user.id, req.params.inviteId);

  sendSuccess(res, 200, { invite });
});

const cancelBossRaidInviteController = asyncHandler(async (req, res) => {
  const invite = await bossRaidService.cancelBossRaidInvite(req.user.id, req.params.inviteId);

  sendSuccess(res, 200, { invite });
});

const getBossRaidPartyDetailController = asyncHandler(async (req, res) => {
  const party = await bossRaidService.getBossRaidPartyDetail(req.user.id, req.params.partyId);

  broadcastBossRaidPartyEvent(
    party.status === 'CLEARED' ? 'bossRaid.completed' : 'bossRaid.progress.updated',
    party
  );
  sendSuccess(res, 200, { party });
});

const claimBossRaidRewardController = asyncHandler(async (req, res) => {
  const reward = await bossRaidService.claimBossRaidReward(req.user.id, req.params.partyId);

  broadcastBossRaidPartyEvent('bossRaid.completed', reward.party);
  sendSuccess(res, 200, { reward });
});

module.exports = {
  acceptBossRaidInvite: acceptBossRaidInviteController,
  cancelBossRaidInvite: cancelBossRaidInviteController,
  claimBossRaidReward: claimBossRaidRewardController,
  createBossRaidInvite: createBossRaidInviteController,
  createBossRaidParty: createBossRaidPartyController,
  declineBossRaidInvite: declineBossRaidInviteController,
  getBossRaidPartyDetail: getBossRaidPartyDetailController,
  getBossRaidPartyInvites: getBossRaidPartyInvitesController,
  getMyBossRaidInvites: getMyBossRaidInvitesController,
  getMyBossRaidParties: getMyBossRaidPartiesController,
  joinPublicBossRaidParty: joinPublicBossRaidPartyController,
  joinBossRaidParty: joinBossRaidPartyController,
  listPublicBossRaidParties: listPublicBossRaidPartiesController,
  listBossRaids: listBossRaidsController
};
