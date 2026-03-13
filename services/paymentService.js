const crypto = require('crypto');
const razorpay = require('../config/razorpay');

/**
 * Creates a Razorpay order.
 * @param {number} amountInPaise - Amount in smallest currency unit (paise for INR)
 * @param {string} receiptId - Unique receipt identifier
 * @returns {object} Razorpay order object
 */
const createOrder = async (amountInPaise, receiptId) => {
  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: receiptId,
    payment_capture: 1,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verifies Razorpay payment signature.
 * @param {string} orderId
 * @param {string} paymentId
 * @param {string} signature
 * @returns {boolean}
 */
const verifySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
};

module.exports = { createOrder, verifySignature };
