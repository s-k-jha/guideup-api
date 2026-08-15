const express = require('express');
const router = express.Router();
const {
  loginMentor,
  getMentorMe,
  updateMentorMe,
  updateMentorStatus,
} = require('../controllers/mentorAuthController');
const { protectMentor } = require('../middlewares/mentorAuthMiddleware');

// Public
router.post('/login', loginMentor);

// Protected (mentor)
router.get('/me', protectMentor, getMentorMe);
router.put('/me', protectMentor, updateMentorMe);
router.patch('/status', protectMentor, updateMentorStatus);

module.exports = router;
