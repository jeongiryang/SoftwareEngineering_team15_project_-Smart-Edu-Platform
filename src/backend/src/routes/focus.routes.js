const express = require('express');
const focusController = require('../controllers/focus.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, focusController.getSessions);
router.post('/', authMiddleware, focusController.recordSession);

module.exports = router;
