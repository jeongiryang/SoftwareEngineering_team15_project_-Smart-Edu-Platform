const express = require('express');
const {
  changeMyPassword,
  getMe,
  getMyActivity,
  searchUsers,
  updateMyAccount,
  updateMyProfile,
  withdrawMyAccount
} = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/search', authMiddleware, searchUsers);
router.get('/me/activity', authMiddleware, getMyActivity);
router.get('/me', authMiddleware, getMe);
router.delete('/me', authMiddleware, withdrawMyAccount);
router.patch('/me', authMiddleware, updateMyAccount);
router.patch('/me/password', authMiddleware, changeMyPassword);
router.patch('/me/profile', authMiddleware, updateMyProfile);

module.exports = router;
