const express = require('express');
const router = express.Router();
const {
  getAdminPayoutRequests,
  updatePayoutRequestStatus,
  getAdminAdvanceRequests,
  updateAdvanceRequestStatus,
} = require('../controllers/adminFinanceController');
const { protect } = require('../middlewares/authMiddleware');

// Admin protected
router.get('/payout-requests', protect, getAdminPayoutRequests);
router.patch('/payout-requests/:id/status', protect, updatePayoutRequestStatus);
router.get('/advance-requests', protect, getAdminAdvanceRequests);
router.patch('/advance-requests/:id/status', protect, updateAdvanceRequestStatus);

module.exports = router;
