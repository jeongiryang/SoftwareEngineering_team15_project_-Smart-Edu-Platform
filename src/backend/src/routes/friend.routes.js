const express = require('express');
const {
  getFriendRequests,
  getFriends,
  removeFriend,
  respondToFriendRequest,
  sendFriendRequest
} = require('../controllers/friend.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, getFriends);
router.get('/requests', authMiddleware, getFriendRequests);
router.post('/requests', authMiddleware, sendFriendRequest);
router.patch('/requests/:requestId', authMiddleware, respondToFriendRequest);
router.delete('/:friendId', authMiddleware, removeFriend);

module.exports = router;
