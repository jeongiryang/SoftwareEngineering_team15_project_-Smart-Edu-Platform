const express = require('express');
const {
  addCollaborativeQuestContribution,
  claimCollaborativeQuestReward,
  createCollaborativeQuest,
  getCollaborativeQuestDetail,
  joinCollaborativeQuest,
  listCollaborativeQuests
} = require('../controllers/collaborativeQuest.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listCollaborativeQuests);
router.get('/:questId', authMiddleware, getCollaborativeQuestDetail);
router.post('/', authMiddleware, createCollaborativeQuest);
router.post('/:questId/join', authMiddleware, joinCollaborativeQuest);
router.post('/:questId/contributions', authMiddleware, addCollaborativeQuestContribution);
router.post('/:questId/claim', authMiddleware, claimCollaborativeQuestReward);

module.exports = router;
