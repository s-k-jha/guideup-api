const express = require('express');
const router = express.Router();
const { getAdminChatOrders, getBusyMentors, forceRefreshMentor } = require('../controllers/chatOrderController');
const { protect } = require('../middlewares/authMiddleware');

// Admin protected
router.get('/busy-mentors', protect, getBusyMentors);
router.post('/busy-mentors/:id/refresh', protect, forceRefreshMentor);
router.get('/', protect, getAdminChatOrders);

module.exports = router;
