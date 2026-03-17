const Session = require('../models/Session');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { createOrder, verifySignature } = require('../services/paymentService');
const { validateAndApplyCoupon, incrementCouponUsage } = require('../services/couponService');
const emailService = require('../services/emailService');
const { createLock, removeLockByOrderId } = require('../utils/slotLockStore');
const { timeToMinutes, minutesToTime } = require('../utils/slotGenerator');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * POST /api/payment/create-order
 * Creates Razorpay order and locks the slot.
 */
const createPaymentOrder = async (req, res) => {
  try {
    const { sessionId, date, startTime, couponCode, name, email, phone } = req.body;

    // Fetch session
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return errorResponse(res, 'Session not found or inactive', 404);
    }

    // Calculate end time
    const endTime = minutesToTime(timeToMinutes(startTime) + session.durationMinutes);

    // Apply coupon if provided
    const couponResult = await validateAndApplyCoupon(couponCode, session.price);
    const finalPrice = couponResult.finalPrice;
    let amountInPaise = Math.round(finalPrice * 100);

    // Fix floating price issues (100% coupon cases)
    if (finalPrice <= 0 || amountInPaise < 1) {
      amountInPaise = 0;
    }    

    // Handle free sessions
    if (amountInPaise === 0) {
      // Find or create user
      let user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        user = await User.create({ name, email, phone });
      }

      // Create booking directly
      const booking = await Booking.create({
        userId: user._id,
        sessionId: session._id,
        date,
        startTime,
        endTime,
        durationMinutes: session.durationMinutes,
        status: 'confirmed',
        amountPaid: 0,
        couponCode: couponCode || null,
      });

      const populatedBooking = await Booking.findById(booking._id).populate('userId sessionId');
      await emailService.sendBookingConfirmation(populatedBooking);
      await emailService.sendAdminBookingAlert(populatedBooking)

      if (couponCode && couponResult.valid) {
        await incrementCouponUsage(couponCode);
      }

      return successResponse(res, {
        free: true,
        bookingId: booking._id,
        message: 'Session booked successfully (no payment required)',
      }, 'Booking confirmed', 201);
    }

    // Create Razorpay order
    const receiptId = `receipt_${Date.now()}`;
    const order = await createOrder(amountInPaise, receiptId);

    // Lock the slot for 5 minutes
    createLock(date, startTime, endTime, order.id);

    // Store temp booking info in booking doc with payment_processing status
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ name, email, phone });
    }

    // Create a pending booking tied to the order
    await Booking.create({
      userId: user._id,
      sessionId: session._id,
      date,
      startTime,
      endTime,
      durationMinutes: session.durationMinutes,
      status: 'payment_processing',
      orderId: order.id,
      amountPaid: finalPrice,
      couponCode: couponCode || null,
    });

    return successResponse(res, {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      sessionTitle: session.title,
      discount: couponResult.discountAmount,
      finalPrice,
      couponMessage: couponResult.valid ? couponResult.message : null,
    }, 'Order created');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment signature and confirms booking.
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Verify signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      // Mark booking as cancelled
      await Booking.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'cancelled' }
      );
      removeLockByOrderId(razorpay_order_id);
      return errorResponse(res, 'Payment verification failed. Invalid signature.', 400);
    }

    // Find the pending booking
    const booking = await Booking.findOne({ orderId: razorpay_order_id, status: 'payment_processing' });

    if (!booking) {
      return errorResponse(res, 'Booking not found for this order', 404);
    }

    // Confirm booking
    booking.status = 'confirmed';
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Release slot lock (it's now properly booked)
    removeLockByOrderId(razorpay_order_id);

    // Increment coupon usage
    if (booking.couponCode) {
      await incrementCouponUsage(booking.couponCode);
    }

    // Send confirmation email
    const populatedBooking = await Booking.findById(booking._id).populate('userId sessionId mentorId');
    await emailService.sendBookingConfirmation(populatedBooking);
    await emailService.sendAdminBookingAlert(populatedBooking);

    return successResponse(res, {
      bookingId: booking._id,
      status: 'confirmed',
      paymentId: razorpay_payment_id,
    }, 'Payment verified. Booking confirmed!');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { createPaymentOrder, verifyPayment };
