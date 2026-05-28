const express = require('express');
const { changeMyPassword, getMe, updateMyAccount, updateMyProfile } = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.patch('/me', authMiddleware, updateMyAccount);
router.patch('/me/password', authMiddleware, changeMyPassword);
router.patch('/me/profile', authMiddleware, updateMyProfile);

module.exports = router;
