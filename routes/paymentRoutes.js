const express = require('express');
const router = express.Router();
const { createPaymentOrder, verifyPayment } = require('../controllers/paymentController');
const { validateCreateOrder, validateVerifyPayment } = require('../middlewares/validate');

// Public
router.post('/create-order', validateCreateOrder, createPaymentOrder);
router.post('/verify', validateVerifyPayment, verifyPayment);

module.exports = router;
