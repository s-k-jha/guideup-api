const express = require('express');
const router = express.Router();
const {
  loginMentor,
  getMentorMe,
  updateMentorMe,
  updateMentorStatus,
} = require('../controllers/mentorAuthController');
const {
  getEarnings,
  getMyOrders,
  updateBankDetails,
  createPayoutRequest,
  getMyPayoutRequests,
  createAdvanceRequest,
  getMyAdvanceRequests,
  endActiveChat,
} = require('../controllers/mentorFinanceController');
const { protectMentor } = require('../middlewares/mentorAuthMiddleware');

// Public
router.post('/login', loginMentor);

// Protected (mentor)
router.get('/me', protectMentor, getMentorMe);
router.put('/me', protectMentor, updateMentorMe);
router.patch('/status', protectMentor, updateMentorStatus);

// Protected (mentor) — financial self-service
router.get('/earnings', protectMentor, getEarnings);
router.get('/orders', protectMentor, getMyOrders);
router.put('/bank-details', protectMentor, updateBankDetails);
router.post('/payout-requests', protectMentor, createPayoutRequest);
router.get('/payout-requests', protectMentor, getMyPayoutRequests);
router.post('/advance-requests', protectMentor, createAdvanceRequest);
router.get('/advance-requests', protectMentor, getMyAdvanceRequests);
router.patch('/end-chat', protectMentor, endActiveChat);

module.exports = router;
