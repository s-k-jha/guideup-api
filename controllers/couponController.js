const Coupon = require('../models/Coupon');
const { validateAndApplyCoupon } = require('../services/couponService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Admin
const createCoupon = async (req, res) => {
  try {
    const { code, discountType, value, expiry, usageLimit } = req.body;

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discountType,
      value,
      expiry,
      usageLimit,
    });

    return successResponse(res, { coupon }, 'Coupon created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Coupon code already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return successResponse(res, { coupons });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// Public
const validateCoupon = async (req, res) => {
  try {
    const { code, sessionId } = req.body;

    if (!code || !sessionId) {
      return errorResponse(res, 'code and sessionId are required', 400);
    }

    const Session = require('../models/Session');
    const session = await Session.findById(sessionId);
    if (!session) return errorResponse(res, 'Session not found', 404);

    const result = await validateAndApplyCoupon(code, session.price);

    if (!result.valid) {
      return errorResponse(res, result.message, 400);
    }

    return successResponse(res, {
      valid: true,
      code: code.toUpperCase(),
      discountType: result.coupon.discountType,
      discountValue: result.coupon.value,
      discountAmount: result.discountAmount,
      originalPrice: session.price,
      finalPrice: result.finalPrice,
      message: result.message,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { createCoupon, getCoupons, validateCoupon };
