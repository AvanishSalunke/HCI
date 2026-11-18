const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/authController');
const rateLimit = require('../middleware/rateLimit');

// 20 tries every 15 minutes from one address
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please wait a few minutes and try again.',
});

router.post('/login', loginLimiter, loginUser);

module.exports = router;
