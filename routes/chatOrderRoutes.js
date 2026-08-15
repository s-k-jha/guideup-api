const express = require('express');
const router = express.Router();
const {
  getPricing,
  createChatOrder,
  verifyChatPayment,
  getMyChatOrders,
} = require('../controllers/chatOrderController');
const { protectUser } = require('../middlewares/userAuthMiddleware');

// All student-protected
router.get('/pricing/:mentorId', protectUser, getPricing);
router.post('/', protectUser, createChatOrder);
router.post('/verify', protectUser, verifyChatPayment);
router.get('/my', protectUser, getMyChatOrders);

module.exports = router;
