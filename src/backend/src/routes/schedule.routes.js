const express = require('express');
const {
  createSchedule,
  deleteSchedule,
  getSchedule,
  listSchedules,
  updateSchedule
} = require('../controllers/schedule.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listSchedules);
router.post('/', authMiddleware, createSchedule);
router.get('/:scheduleId', authMiddleware, getSchedule);
router.patch('/:scheduleId', authMiddleware, updateSchedule);
router.delete('/:scheduleId', authMiddleware, deleteSchedule);

module.exports = router;
