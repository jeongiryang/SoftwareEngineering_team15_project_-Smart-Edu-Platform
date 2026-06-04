const express = require('express');
const {
  addChatRoomMessage,
  analyzeStudyMaterialAttachment,
  askQuestion,
  createChatRoom,
  deleteChatRoom,
  getRecommendation,
  listChatRooms,
  reviewImageAttachment,
  summarize,
  analyzeWrongAnswer,
  updateChatRoom
} = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { createMemoryUpload } = require('../middleware/upload.middleware');

const router = express.Router();
const imageAttachmentUpload = createMemoryUpload({
  maxSizeBytes: 5 * 1024 * 1024
});
const studyMaterialUpload = createMemoryUpload({
  maxSizeBytes: 10 * 1024 * 1024
});

router.post('/questions', authMiddleware, askQuestion);
router.get('/chat-rooms', authMiddleware, listChatRooms);
router.post('/chat-rooms', authMiddleware, createChatRoom);
router.post('/chat-rooms/:roomId/messages', authMiddleware, addChatRoomMessage);
router.patch('/chat-rooms/:roomId', authMiddleware, updateChatRoom);
router.delete('/chat-rooms/:roomId', authMiddleware, deleteChatRoom);
router.post('/recommendations', authMiddleware, getRecommendation);
router.post('/summary', authMiddleware, summarize);
router.post('/wrong-answers', authMiddleware, analyzeWrongAnswer);
router.post('/attachments/image-review', authMiddleware, imageAttachmentUpload, reviewImageAttachment);
router.post('/attachments/study-material', authMiddleware, studyMaterialUpload, analyzeStudyMaterialAttachment);

module.exports = router;
