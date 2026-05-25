const express = require('express');
const {
  getUsers,
  updateUserStatus,
  getReports,
  moderatePost,
  moderateComment,
  moderateChallenge
} = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { adminMiddleware } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.get('/reports', getReports);
router.patch('/posts/:postId/moderation', moderatePost);
router.patch('/comments/:commentId/moderation', moderateComment);
router.patch('/challenges/:challengeId/moderation', moderateChallenge);

module.exports = router;
