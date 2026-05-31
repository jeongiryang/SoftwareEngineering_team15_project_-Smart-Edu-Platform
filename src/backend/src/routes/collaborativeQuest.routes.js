const express = require('express');
const {
  addCollaborativeQuestContribution,
  claimCollaborativeQuestReward,
  createCollaborativeQuest,
  getCollaborativeQuestDetail,
  joinCollaborativeQuest,
  listCollaborativeQuests,
  updateCollaborativeQuestVisibility
} = require('../controllers/collaborativeQuest.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listCollaborativeQuests);
router.get('/:questId', authMiddleware, getCollaborativeQuestDetail);
router.post('/', authMiddleware, createCollaborativeQuest);
router.post('/:questId/join', authMiddleware, joinCollaborativeQuest);
router.post('/:questId/contributions', authMiddleware, addCollaborativeQuestContribution);
router.post('/:questId/claim', authMiddleware, claimCollaborativeQuestReward);
router.patch('/:questId/visibility', authMiddleware, updateCollaborativeQuestVisibility);

module.exports = router;
