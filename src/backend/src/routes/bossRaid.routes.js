const express = require('express');
const {
  claimBossRaidReward,
  createBossRaidParty,
  getBossRaidPartyDetail,
  getMyBossRaidParties,
  joinBossRaidParty,
  listBossRaids
} = require('../controllers/bossRaid.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listBossRaids);
router.get('/parties/me', authMiddleware, getMyBossRaidParties);
router.get('/parties/:partyId', authMiddleware, getBossRaidPartyDetail);
router.post('/parties', authMiddleware, createBossRaidParty);
router.post('/parties/join', authMiddleware, joinBossRaidParty);
router.post('/parties/:partyId/claim', authMiddleware, claimBossRaidReward);

module.exports = router;
