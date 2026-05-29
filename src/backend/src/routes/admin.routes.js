const express = require('express');
const {
  getUsers,
  listCommunityReports,
  updateUserStatus,
  getReports,
  processCommunityReport,
  moderatePost,
  moderateComment,
  moderateChallenge,
  listRewardBadges,
  createRewardBadge,
  updateRewardBadge,
  listRewardQuests,
  createRewardQuest,
  updateRewardQuest
} = require('../controllers/admin.controller');
const {
  getMaintenanceSetting,
  updateMaintenanceSetting
} = require('../controllers/system.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.get('/community/reports', listCommunityReports);
router.patch('/community/reports/:reportId', processCommunityReport);
router.get('/reports', getReports);
router.get('/rewards/badges', listRewardBadges);
router.post('/rewards/badges', createRewardBadge);
router.patch('/rewards/badges/:badgeId', updateRewardBadge);
router.get('/rewards/quests', listRewardQuests);
router.post('/rewards/quests', createRewardQuest);
router.patch('/rewards/quests/:questId', updateRewardQuest);
router.get('/system/maintenance', getMaintenanceSetting);
router.patch('/system/maintenance', updateMaintenanceSetting);
router.patch('/posts/:postId/moderation', moderatePost);
router.patch('/comments/:commentId/moderation', moderateComment);
router.patch('/challenges/:challengeId/moderation', moderateChallenge);

module.exports = router;
