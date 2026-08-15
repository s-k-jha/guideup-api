const express = require('express');
const router = express.Router();
const {
  getWalletBalance,
  getMinRecharge,
  createRechargeOrder,
  verifyRecharge,
  getMyTransactions,
} = require('../controllers/walletController');
const { protectUser } = require('../middlewares/userAuthMiddleware');

// All student-protected
router.get('/balance', protectUser, getWalletBalance);
router.get('/min-recharge/:mentorId', protectUser, getMinRecharge);
router.post('/recharge', protectUser, createRechargeOrder);
router.post('/recharge/verify', protectUser, verifyRecharge);
router.get('/transactions', protectUser, getMyTransactions);

module.exports = router;
