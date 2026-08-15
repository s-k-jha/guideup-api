const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/userAuthController');
const { protectUser } = require('../middlewares/userAuthMiddleware');

// Public
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected (student)
router.get('/me', protectUser, getMe);

module.exports = router;
