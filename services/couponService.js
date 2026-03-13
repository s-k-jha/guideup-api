const Coupon = require('../models/Coupon');

/**
 * Validates a coupon code and returns discount info.
 * @param {string} code
 * @param {number} originalPrice - Price before discount
 * @returns {{ valid: boolean, discountAmount: number, finalPrice: number, coupon?: object, message?: string }}
 */
const validateAndApplyCoupon = async (code, originalPrice) => {
  if (!code) {
    return { valid: false, discountAmount: 0, finalPrice: originalPrice, message: 'No coupon provided' };
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    return { valid: false, discountAmount: 0, finalPrice: originalPrice, message: 'Invalid coupon code' };
  }

  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, finalPrice: originalPrice, message: 'Coupon is no longer active' };
  }

  if (new Date() > new Date(coupon.expiry)) {
    return { valid: false, discountAmount: 0, finalPrice: originalPrice, message: 'Coupon has expired' };
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discountAmount: 0, finalPrice: originalPrice, message: 'Coupon usage limit reached' };
  }

  let discountAmount = 0;

  if (coupon.discountType === 'percent') {
    discountAmount = Math.round((originalPrice * coupon.value) / 100);
  } else if (coupon.discountType === 'fixed') {
    discountAmount = coupon.value;
  }

  // Ensure discount doesn't exceed price
  discountAmount = Math.min(discountAmount, originalPrice);
  const finalPrice = originalPrice - discountAmount;

  return {
    valid: true,
    discountAmount,
    finalPrice,
    coupon,
    message: `Coupon applied! You save ₹${discountAmount}`,
  };
};

/**
 * Increments coupon usage count after successful payment.
 */
const incrementCouponUsage = async (code) => {
  if (!code) return;
  await Coupon.findOneAndUpdate(
    { code: code.toUpperCase() },
    { $inc: { usedCount: 1 } }
  );
};

module.exports = { validateAndApplyCoupon, incrementCouponUsage };
