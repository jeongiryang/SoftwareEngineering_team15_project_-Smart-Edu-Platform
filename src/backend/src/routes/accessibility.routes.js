const express = require('express');
const {
  createReviewReminder,
  getReviewReminders,
  createStt,
  createTts,
  getPreference,
  updatePreference
} = require('../controllers/accessibility.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/preferences', authMiddleware, getPreference);
router.put('/preferences', authMiddleware, updatePreference);
router.post('/tts', authMiddleware, createTts);
router.post('/stt', authMiddleware, createStt);
router.post('/review-reminders', authMiddleware, createReviewReminder);
router.get('/review-reminders', authMiddleware, getReviewReminders);

module.exports = router;
