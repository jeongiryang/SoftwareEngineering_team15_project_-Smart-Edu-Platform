const express = require('express');
const { getMe, updateMyProfile } = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.patch('/me/profile', authMiddleware, updateMyProfile);

module.exports = router;
