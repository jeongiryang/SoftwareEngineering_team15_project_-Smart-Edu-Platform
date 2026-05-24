const express = require('express');
const {
  askQuestion,
  getRecommendation,
  summarize,
  analyzeWrongAnswer
} = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/questions', authMiddleware, askQuestion);
router.post('/recommendations', authMiddleware, getRecommendation);
router.post('/summary', authMiddleware, summarize);
router.post('/wrong-answers', authMiddleware, analyzeWrongAnswer);

module.exports = router;
