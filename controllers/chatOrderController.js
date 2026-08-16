const ChatOrder = require('../models/ChatOrder');
const ChatMessage = require('../models/ChatMessage');
const Mentor = require('../models/Mentor');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const { createOrder, verifySignature } = require('../services/paymentService');
const { notifyMentorNewChat, completeChatOrder } = require('../services/socketService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Determines which pricing tier a student gets for their next chat,
 * based on how many prior confirmed/completed chats they've had with
 * ANY mentor (the free/discount offer is per-user, not per-mentor —
 * a student can't re-trigger "first free" by switching mentors) and
 * this mentor's own offer toggles.
 */
async function determineTier(userId, mentor) {
  const priorCount = await ChatOrder.countDocuments({
    userId,
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

      const student = await User.findById(req.user.id).select('name');
      notifyMentorNewChat(mentor._id.toString(), {
        chatOrderId: chatOrder._id,
        tier,
        studentName: student?.name,
      });

      return successResponse(res, { chatOrder, tier, requiresPayment: false, paidVia: 'free' }, 'Chat confirmed — no payment required', 201);
    }

    // discount or paid tier — funded from the student's wallet, not a fresh Razorpay order.
    // The balance check and the debit happen in one atomic update (filtering
    // on walletBalance >= amount) so two concurrent chat purchases can't both
    // read the same starting balance and both succeed — that race would let
    // a student spend more than their wallet actually has.
    const amount = tier === 'discount' ? mentor.discountPrice : mentor.chatPrice;
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount } },
      { new: true }
    );
    if (!user) {
      return errorResponse(res, 'Insufficient wallet balance. Please recharge your wallet first.', 402);
    }

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

    notifyMentorNewChat(mentor._id.toString(), {
      chatOrderId: chatOrder._id,
      tier,
      studentName: user.name,
    });

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

    const chatOrder = await ChatOrder.findOneAndUpdate(
      { orderId: razorpay_order_id, status: 'payment_processing' },
      { status: 'confirmed', paymentId: razorpay_payment_id },
      { new: true }
    );

    if (!chatOrder) {
      return errorResponse(res, 'Chat order not found or already confirmed for this order', 404);
    }

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

/**
 * GET /api/admin/chat-orders/busy-mentors
 * protect (admin)
 * Lists mentors currently showing as busy, with whatever chat order they're
 * pinned to — the admin queue for spotting a mentor stuck busy after a chat
 * actually ended.
 */
const getBusyMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find({ availabilityStatus: 2 })
      .select('name email photoUrl activeChatOrderId lastActiveAt')
      .populate({
        path: 'activeChatOrderId',
        select: 'tier status createdAt userId',
        populate: { path: 'userId', select: 'name email' },
      })
      .sort({ lastActiveAt: -1 });

    return successResponse(res, { mentors });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/admin/chat-orders/busy-mentors/:id/refresh
 * protect (admin)
 * Force-resets a stuck mentor back to online: completes their linked chat
 * order if it's still open, then unconditionally clears busy/activeChatOrderId
 * regardless of what state they were actually in. Doesn't delete anything —
 * purely a state reset for when a chat ended but the mentor never unstuck.
 */
const forceRefreshMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    if (mentor.activeChatOrderId) {
      await completeChatOrder(mentor.activeChatOrderId.toString());
    }

    const updated = await Mentor.findById(req.params.id);
    if (updated.availabilityStatus !== 1 || updated.activeChatOrderId) {
      updated.availabilityStatus = 1;
      updated.activeChatOrderId = null;
      await updated.save();
    }

    return successResponse(res, { mentor: updated }, 'Mentor refreshed and marked online');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/chat-orders/:id
 * protectChatParticipant
 */
const getChatOrderDetails = async (req, res) => {
  try {
    const chatOrder = await ChatOrder.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('mentorId', 'name photoUrl availabilityStatus');

    if (!chatOrder) return errorResponse(res, 'Chat order not found', 404);

    return successResponse(res, { chatOrder });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/chat-orders/:id/messages
 * protectChatParticipant
 */
const getChatMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({ chatOrderId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(500);

    return successResponse(res, { messages });
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
  getBusyMentors,
  forceRefreshMentor,
  getChatOrderDetails,
  getChatMessages,
};
