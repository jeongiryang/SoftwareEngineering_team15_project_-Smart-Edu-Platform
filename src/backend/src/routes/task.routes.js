const express = require('express');
const {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  updateTaskStatus
} = require('../controllers/task.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listTasks);
router.post('/', authMiddleware, createTask);
router.patch('/:taskId/status', authMiddleware, updateTaskStatus);
router.patch('/:taskId', authMiddleware, updateTask);
router.delete('/:taskId', authMiddleware, deleteTask);

module.exports = router;
