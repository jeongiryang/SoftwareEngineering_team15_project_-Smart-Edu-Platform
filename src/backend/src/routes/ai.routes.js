const express = require('express');
const {
  addChatRoomMessage,
  askQuestion,
  createChatRoom,
  deleteChatRoom,
  getRecommendation,
  listChatRooms,
  summarize,
  analyzeWrongAnswer
} = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/questions', authMiddleware, askQuestion);
router.get('/chat-rooms', authMiddleware, listChatRooms);
router.post('/chat-rooms', authMiddleware, createChatRoom);
router.post('/chat-rooms/:roomId/messages', authMiddleware, addChatRoomMessage);
router.delete('/chat-rooms/:roomId', authMiddleware, deleteChatRoom);
router.post('/recommendations', authMiddleware, getRecommendation);
router.post('/summary', authMiddleware, summarize);
router.post('/wrong-answers', authMiddleware, analyzeWrongAnswer);

module.exports = router;
