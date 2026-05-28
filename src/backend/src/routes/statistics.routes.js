const express = require('express');
const statisticsController = require('../controllers/statistics.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/summary', authMiddleware, statisticsController.getSummary);
router.get('/heatmap', authMiddleware, statisticsController.getHeatmap);

module.exports = router;
