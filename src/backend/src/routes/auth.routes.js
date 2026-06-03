const express = require('express');
const { login, me, register } = require('../controllers/auth.controller');
const { createAuthMiddleware } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', createAuthMiddleware({ allowRestricted: true }), me);

module.exports = router;
