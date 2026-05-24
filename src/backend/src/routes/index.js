const express = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const scheduleRoutes = require('./schedule.routes');
const taskRoutes = require('./task.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
