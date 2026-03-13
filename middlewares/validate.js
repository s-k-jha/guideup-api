const { errorResponse } = require('../utils/apiResponse');
const validator = require('validator');

/**
 * Validates booking creation payload.
 */
const validateBooking = (req, res, next) => {
  const { name, email, phone, sessionId, date, startTime } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (!email || !validator.isEmail(email)) errors.push('Valid email is required');
  if (!phone || !/^\+?[\d\s\-().]{7,20}$/.test(phone)) errors.push('Valid phone number is required');
  if (!sessionId) errors.push('Session ID is required');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Date must be in YYYY-MM-DD format');
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) errors.push('Start time must be in HH:MM format');

  if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);
  next();
};

/**
 * Validates payment order creation payload.
 */
const validateCreateOrder = (req, res, next) => {
  const { sessionId, date, startTime } = req.body;
  const errors = [];

  if (!sessionId) errors.push('Session ID is required');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.push('Date must be in YYYY-MM-DD format');
  if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) errors.push('Start time must be in HH:MM format');

  if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);
  next();
};

/**
 * Validates payment verification payload.
 */
const validateVerifyPayment = (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const errors = [];

  if (!razorpay_order_id) errors.push('razorpay_order_id is required');
  if (!razorpay_payment_id) errors.push('razorpay_payment_id is required');
  if (!razorpay_signature) errors.push('razorpay_signature is required');

  if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);
  next();
};

/**
 * Validates coupon creation payload.
 */
const validateCoupon = (req, res, next) => {
  const { code, discountType, value, expiry, usageLimit } = req.body;
  const errors = [];

  if (!code || code.trim().length < 2) errors.push('Coupon code must be at least 2 characters');
  if (!['percent', 'fixed'].includes(discountType)) errors.push('discountType must be percent or fixed');
  if (value === undefined || value < 0) errors.push('Value must be a non-negative number');
  if (discountType === 'percent' && value > 100) errors.push('Percent discount cannot exceed 100');
  if (!expiry || !validator.isDate(expiry)) errors.push('Valid expiry date is required');
  if (!usageLimit || usageLimit < 1) errors.push('Usage limit must be at least 1');

  if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);
  next();
};

/**
 * Validates session creation/update payload.
 */
const validateSession = (req, res, next) => {
  const { title, durationMinutes, price } = req.body;
  const errors = [];

  if (!title || title.trim().length < 2) errors.push('Title is required');
  if (!durationMinutes || durationMinutes < 15) errors.push('Duration must be at least 15 minutes');
  if (price === undefined || price < 0) errors.push('Price must be a non-negative number');

  if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);
  next();
};

module.exports = {
  validateBooking,
  validateCreateOrder,
  validateVerifyPayment,
  validateCoupon,
  validateSession,
};
