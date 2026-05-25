const express = require('express');
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote
} = require('../controllers/note.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

// 모든 API 엔드포인트에 authMiddleware를 적용하여 인증된 사용자만 접근 가능
router.get('/', authMiddleware, getNotes);
router.post('/', authMiddleware, createNote);
router.get('/:noteId', authMiddleware, getNoteById);
router.patch('/:noteId', authMiddleware, updateNote);
router.delete('/:noteId', authMiddleware, deleteNote);

module.exports = router;