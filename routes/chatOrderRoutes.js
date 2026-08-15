const express = require('express');
const router = express.Router();
const {
  getPricing,
  createChatOrder,
  verifyChatPayment,
  getMyChatOrders,
  getChatOrderDetails,
  getChatMessages,
} = require('../controllers/chatOrderController');
const { protectUser } = require('../middlewares/userAuthMiddleware');
const { protectChatParticipant } = require('../middlewares/chatAccessMiddleware');

// All student-protected
router.get('/pricing/:mentorId', protectUser, getPricing);
router.post('/', protectUser, createChatOrder);
router.post('/verify', protectUser, verifyChatPayment);
router.get('/my', protectUser, getMyChatOrders);

// Shared student/mentor access, scoped to a specific chat order.
// Declared after the more specific /pricing/:mentorId and /my routes above
// so this catch-all-shaped /:id doesn't shadow them.
router.get('/:id', protectChatParticipant, getChatOrderDetails);
router.get('/:id/messages', protectChatParticipant, getChatMessages);

module.exports = router;
