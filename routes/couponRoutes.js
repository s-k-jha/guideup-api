const express = require('express');
const router = express.Router();
const { createCoupon, getCoupons, validateCoupon } = require('../controllers/couponController');
const { protect } = require('../middlewares/authMiddleware');
const { validateCoupon: validateCouponInput } = require('../middlewares/validate');

// Public
router.post('/validate', validateCoupon);

// Admin protected
router.get('/', protect, getCoupons);
router.post('/', protect, validateCouponInput, createCoupon);

module.exports = router;
