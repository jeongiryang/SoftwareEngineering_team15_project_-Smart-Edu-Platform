const express = require('express');
const {
  getMessageThread,
  listMessageThreads,
  markThreadRead,
  sendDirectMessage,
  startMessageThread
} = require('../controllers/message.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/threads', authMiddleware, listMessageThreads);
router.get('/threads/:threadId', authMiddleware, getMessageThread);
router.post('/threads', authMiddleware, startMessageThread);
router.post('/threads/:threadId/messages', authMiddleware, sendDirectMessage);
router.post('/threads/:threadId/read', authMiddleware, markThreadRead);

module.exports = router;
