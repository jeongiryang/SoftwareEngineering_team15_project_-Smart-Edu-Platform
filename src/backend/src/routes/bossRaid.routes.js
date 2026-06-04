const express = require('express');
const {
  acceptBossRaidInvite,
  archiveBossRaidParty,
  cancelBossRaidInvite,
  claimBossRaidReward,
  createBossRaidInvite,
  createBossRaidParty,
  declineBossRaidInvite,
  getBossRaidPartyDetail,
  getBossRaidPartyInvites,
  getMyBossRaidInvites,
  getMyBossRaidParties,
  joinPublicBossRaidParty,
  joinBossRaidParty,
  leaveBossRaidParty,
  listPublicBossRaidParties,
  listBossRaids,
  restoreBossRaidParty
} = require('../controllers/bossRaid.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listBossRaids);
router.get('/invites/me', authMiddleware, getMyBossRaidInvites);
router.post('/invites/:inviteId/accept', authMiddleware, acceptBossRaidInvite);
router.post('/invites/:inviteId/decline', authMiddleware, declineBossRaidInvite);
router.post('/invites/:inviteId/cancel', authMiddleware, cancelBossRaidInvite);
router.get('/parties/me', authMiddleware, getMyBossRaidParties);
router.get('/parties/public', authMiddleware, listPublicBossRaidParties);
router.get('/parties/:partyId/invites', authMiddleware, getBossRaidPartyInvites);
router.get('/parties/:partyId', authMiddleware, getBossRaidPartyDetail);
router.post('/parties', authMiddleware, createBossRaidParty);
router.post('/parties/join', authMiddleware, joinBossRaidParty);
router.post('/parties/:partyId/invites', authMiddleware, createBossRaidInvite);
router.post('/parties/:partyId/join', authMiddleware, joinPublicBossRaidParty);
router.post('/parties/:partyId/claim', authMiddleware, claimBossRaidReward);
router.post('/parties/:partyId/leave', authMiddleware, leaveBossRaidParty);
router.post('/parties/:partyId/archive', authMiddleware, archiveBossRaidParty);
router.post('/parties/:partyId/restore', authMiddleware, restoreBossRaidParty);

module.exports = router;
