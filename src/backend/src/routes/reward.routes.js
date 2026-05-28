const express = require('express');
const {
  claimQuestReward,
  getMyRewards
} = require('../controllers/reward.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getMyRewards);
router.post('/quests/:questId/claim', authMiddleware, claimQuestReward);

module.exports = router;
