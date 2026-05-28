const express = require('express');
const authRoutes = require('./auth.routes');
const healthRoutes = require('./health.routes');
const scheduleRoutes = require('./schedule.routes');
const taskRoutes = require('./task.routes');
const userRoutes = require('./user.routes');
const aiRoutes = require('./ai.routes');
const adminRoutes = require('./admin.routes');
const noteRoutes = require('./note.routes');
const communityRoutes = require('./community.routes');
const accessibilityRoutes = require('./accessibility.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/health', healthRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);
router.use('/notes', noteRoutes);
router.use('/community', communityRoutes);
router.use('/accessibility', accessibilityRoutes);

module.exports = router;
