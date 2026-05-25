const express = require('express');
const {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  updateNote
} = require('../controllers/note.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, getNotes);
router.post('/', authMiddleware, createNote);
router.get('/:noteId', authMiddleware, getNoteById);
router.patch('/:noteId', authMiddleware, updateNote);
router.delete('/:noteId', authMiddleware, deleteNote);

module.exports = router;
