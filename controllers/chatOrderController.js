const ChatOrder = require('../models/ChatOrder');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { createOrder, verifySignature } = require('../services/paymentService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Determines which pricing tier a student gets for their next chat
 * with a given mentor, based on how many prior confirmed/completed
 * chats they've had with that mentor and the mentor's own offer toggles.
 */
async function determineTier(userId, mentor) {
  const priorCount = await ChatOrder.countDocuments({
    userId,
    mentorId: mentor._id,
    status: { $in: ['confirmed', 'completed'] },
  });

  if (priorCount === 0) {
    return mentor.offers.firstFree ? 'free' : (mentor.offers.secondDiscount ? 'discount' : 'paid');
  }

  if (priorCount === 1) {
    return mentor.offers.secondDiscount ? 'discount' : 'paid';
  }

  return 'paid';
}

/**
 * GET /api/chat-orders/pricing/:mentorId
 * protectUser
 */
const getPricing = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({ _id: req.params.mentorId, isActive: true });
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    const tier = await determineTier(req.user.id, mentor);

    let effectivePrice = 0;
    if (tier === 'discount') effectivePrice = mentor.discountPrice;
    if (tier === 'paid') effectivePrice = mentor.chatPrice;

    return successResponse(res, {
      tier,
      originalPrice: mentor.chatPrice,
      effectivePrice,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/chat-orders
 * protectUser
 * Body: { mentorId }
 */
const createChatOrder = async (req, res) => {
  try {
    const { mentorId } = req.body;

    const mentor = await Mentor.findOne({ _id: mentorId, isActive: true });
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    if (mentor.mentorType !== 'talk') {
      return errorResponse(res, 'Mentor not available for chat', 404);
    }
    if (mentor.availabilityStatus === 2) {
      return errorResponse(res, 'This mentor is currently in another chat. Please try again shortly.', 409);
    }

    const tier = await determineTier(req.user.id, mentor);

    if (tier === 'free' || tier === 'discount') {
      const today = new Date().toISOString().slice(0, 10);
      if (mentor.freeOrdersDate !== today) {
        mentor.freeOrdersDate = today;
        mentor.freeOrdersUsedToday = 0;
      }
      mentor.freeOrdersUsedToday += 1;
    }

    if (tier === 'free') {
      const chatOrder = await ChatOrder.create({
        userId: req.user.id,
        mentorId: mentor._id,
        tier,
        originalPrice: mentor.chatPrice,
        amountPaid: 0,
        status: 'confirmed',
      });

      mentor.availabilityStatus = 2;
      mentor.activeChatOrderId = chatOrder._id;
      await mentor.save();

      return successResponse(res, { chatOrder, tier, requiresPayment: false, paidVia: 'free' }, 'Chat confirmed — no payment required', 201);
    }

    // discount or paid tier — funded from the student's wallet, not a fresh Razorpay order
    const amount = tier === 'discount' ? mentor.discountPrice : mentor.chatPrice;
    const user = await User.findById(req.user.id);
    if (!user || user.walletBalance < amount) {
      return errorResponse(res, 'Insufficient wallet balance. Please recharge your wallet first.', 402);
    }
    user.walletBalance -= amount;
    await user.save();

    const chatOrder = await ChatOrder.create({
      userId: req.user.id,
      mentorId: mentor._id,
      tier,
      originalPrice: mentor.chatPrice,
      amountPaid: amount,
      status: 'confirmed',
    });

    await WalletTransaction.create({
      userId: req.user.id,
      type: 'debit',
      amount,
      status: 'completed',
      chatOrderId: chatOrder._id,
      balanceAfter: user.walletBalance,
    });

    mentor.availabilityStatus = 2;
    mentor.activeChatOrderId = chatOrder._id;
    await mentor.save();

    return successResponse(res, { chatOrder, tier, requiresPayment: false, paidVia: 'wallet' }, 'Chat confirmed', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/chat-orders/verify
 * protectUser
 */
const verifyChatPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      await ChatOrder.findOneAndUpdate(
        { orderId: razorpay_order_id, status: 'payment_processing' },
        { status: 'cancelled' }
      );
      return errorResponse(res, 'Payment verification failed. Invalid signature.', 400);
    }

    const chatOrder = await ChatOrder.findOne({ orderId: razorpay_order_id, status: 'payment_processing' });

    if (!chatOrder) {
      return errorResponse(res, 'Chat order not found for this order', 404);
    }

    chatOrder.status = 'confirmed';
    chatOrder.paymentId = razorpay_payment_id;
    await chatOrder.save();

    return successResponse(res, { chatOrder }, 'Payment verified. Chat confirmed!');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/chat-orders/my
 * protectUser
 */
const getMyChatOrders = async (req, res) => {
  try {
    const orders = await ChatOrder.find({ userId: req.user.id })
      .populate('mentorId', 'name photoUrl role slug')
      .sort({ createdAt: -1 });

    return successResponse(res, { orders });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/admin/chat-orders
 * protect (admin)
 */
const getAdminChatOrders = async (req, res) => {
  try {
    const orders = await ChatOrder.find({})
      .populate('userId', 'name email phone')
      .populate('mentorId', 'name chatPrice dailyFreeQuota freeOrdersUsedToday')
      .sort({ createdAt: -1 })
      .limit(200);

    return successResponse(res, { orders });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getPricing,
  createChatOrder,
  verifyChatPayment,
  getMyChatOrders,
  getAdminChatOrders,
};
