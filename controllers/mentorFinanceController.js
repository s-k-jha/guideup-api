const Mentor = require('../models/Mentor');
const ChatOrder = require('../models/ChatOrder');
const PayoutRequest = require('../models/PayoutRequest');
const AdvanceRequest = require('../models/AdvanceRequest');
const { completeChatOrder } = require('../services/socketService');
const adminNotifyService = require('../services/adminNotifyService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const COMMISSION_RATE = 0.4;
const NET_RATE = 1 - COMMISSION_RATE; // 0.6

/**
 * Computes a mentor's live earnings picture from confirmed/completed chat orders,
 * minus whatever is already reserved against pending/approved/paid payout & advance
 * requests (so the two request types can't double-spend the same earnings pool).
 */
const computeLiveEarnings = async (mentorId) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totals, todayTotals, trailingMonthTotals, reservedPayouts, reservedAdvances] =
    await Promise.all([
      ChatOrder.aggregate([
        { $match: { mentorId, status: { $in: ['confirmed', 'completed'] } } },
        { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$amountPaid' } } },
      ]),
      ChatOrder.aggregate([
        {
          $match: {
            mentorId,
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, todayOrders: { $sum: 1 }, todayRevenue: { $sum: '$amountPaid' } } },
      ]),
      ChatOrder.aggregate([
        {
          $match: {
            mentorId,
            status: { $in: ['confirmed', 'completed'] },
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        { $group: { _id: null, trailingMonthRevenue: { $sum: '$amountPaid' } } },
      ]),
      PayoutRequest.aggregate([
        { $match: { mentorId, status: { $in: ['pending', 'approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      AdvanceRequest.aggregate([
        { $match: { mentorId, status: { $in: ['pending', 'approved', 'paid'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

  const totalOrders = totals[0]?.totalOrders || 0;
  const totalRevenue = totals[0]?.totalRevenue || 0;
  const todayOrders = todayTotals[0]?.todayOrders || 0;
  const todayRevenue = todayTotals[0]?.todayRevenue || 0;
  const trailingMonthRevenue = trailingMonthTotals[0]?.trailingMonthRevenue || 0;

  const netEarnings = totalRevenue * NET_RATE;
  const todayNetEarnings = todayRevenue * NET_RATE;
  const trailingMonthNetEarnings = trailingMonthRevenue * NET_RATE;

  const reserved = (reservedPayouts[0]?.total || 0) + (reservedAdvances[0]?.total || 0);
  const availableForPayout = Math.max(0, netEarnings - reserved);

  return {
    totalOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    trailingMonthRevenue,
    netEarnings,
    todayNetEarnings,
    trailingMonthNetEarnings,
    reserved,
    availableForPayout,
  };
};

/**
 * GET /api/mentor-auth/earnings
 * protectMentor
 */
const getEarnings = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    const earnings = await computeLiveEarnings(mentor._id);

    const today = new Date().toISOString().slice(0, 10);
    let liveMinutesToday = mentor.presenceMinutesToday;
    if (mentor.availabilityStatus !== 0 && mentor.lastActiveAt && mentor.presenceDate === today) {
      liveMinutesToday += (Date.now() - mentor.lastActiveAt.getTime()) / 60000;
    }

    return successResponse(res, {
      ...earnings,
      platformCommissionRate: COMMISSION_RATE,
      liveMinutesToday: Math.round(liveMinutesToday),
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/mentor-auth/orders
 * protectMentor
 */
const getMyOrders = async (req, res) => {
  try {
    const orders = await ChatOrder.find({ mentorId: req.mentor.id })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(200);

    return successResponse(res, { orders });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PUT /api/mentor-auth/bank-details
 * protectMentor
 */
const updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, accountNumber, ifsc, upiId } = req.body;

    if ((accountNumber || ifsc) && !(accountNumber && ifsc)) {
      return errorResponse(
        res,
        'Both accountNumber and ifsc are required together to set a bank account',
        400
      );
    }

    const mentor = await Mentor.findByIdAndUpdate(
      req.mentor.id,
      { bankDetails: { accountHolderName, accountNumber, ifsc, upiId } },
      { new: true, runValidators: true }
    );

    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor }, 'Bank details updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/mentor-auth/payout-requests
 * protectMentor
 */
const createPayoutRequest = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!(amount > 0)) {
      return errorResponse(res, 'amount must be greater than 0', 400);
    }

    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    if (!(mentor.bankDetails?.accountNumber && mentor.bankDetails?.ifsc)) {
      return errorResponse(res, 'Add your bank account details before requesting a payout', 400);
    }

    const { availableForPayout } = await computeLiveEarnings(mentor._id);

    if (amount > availableForPayout) {
      return errorResponse(
        res,
        `Requested amount exceeds available balance. You can request up to ₹${availableForPayout.toFixed(2)}`,
        400
      );
    }

    const payoutRequest = await PayoutRequest.create({
      mentorId: mentor._id,
      amount,
      bankDetailsSnapshot: {
        accountHolderName: mentor.bankDetails.accountHolderName,
        accountNumber: mentor.bankDetails.accountNumber,
        ifsc: mentor.bankDetails.ifsc,
        upiId: mentor.bankDetails.upiId,
      },
      status: 'pending',
    });

    adminNotifyService.notifyPayoutRequest(mentor, payoutRequest);

    return successResponse(res, { payoutRequest }, 'Payout request submitted', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/mentor-auth/payout-requests
 * protectMentor
 */
const getMyPayoutRequests = async (req, res) => {
  try {
    const payoutRequests = await PayoutRequest.find({ mentorId: req.mentor.id }).sort({
      createdAt: -1,
    });
    return successResponse(res, { payoutRequests });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/mentor-auth/advance-requests
 * protectMentor
 */
const createAdvanceRequest = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!(amount > 0)) {
      return errorResponse(res, 'amount must be greater than 0', 400);
    }

    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    const today = new Date().toISOString().slice(0, 10);
    let liveMinutesToday = mentor.presenceMinutesToday;
    if (mentor.availabilityStatus !== 0 && mentor.lastActiveAt && mentor.presenceDate === today) {
      liveMinutesToday += (Date.now() - mentor.lastActiveAt.getTime()) / 60000;
    }

    if (liveMinutesToday < 420) {
      return errorResponse(
        res,
        'You need at least 7 hours of presence today to request an advance',
        400
      );
    }

    if (!(mentor.bankDetails?.accountNumber && mentor.bankDetails?.ifsc)) {
      return errorResponse(res, 'Add your bank account details before requesting an advance', 400);
    }

    const { availableForPayout, trailingMonthNetEarnings } = await computeLiveEarnings(mentor._id);
    const maxEligibleAmount = Math.min(trailingMonthNetEarnings * 0.2, availableForPayout);

    if (amount > maxEligibleAmount) {
      return errorResponse(
        res,
        `Requested amount exceeds your maximum eligible advance of ₹${maxEligibleAmount.toFixed(2)}`,
        400
      );
    }

    const advanceRequest = await AdvanceRequest.create({
      mentorId: mentor._id,
      amount,
      eligiblePresenceMinutesToday: Math.round(liveMinutesToday),
      trailingMonthEarnings: trailingMonthNetEarnings,
      maxEligibleAmount,
      status: 'pending',
    });

    adminNotifyService.notifyAdvanceRequest(mentor, advanceRequest);

    return successResponse(res, { advanceRequest }, 'Advance request submitted', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/mentor-auth/advance-requests
 * protectMentor
 */
const getMyAdvanceRequests = async (req, res) => {
  try {
    const advanceRequests = await AdvanceRequest.find({ mentorId: req.mentor.id }).sort({
      createdAt: -1,
    });
    return successResponse(res, { advanceRequests });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/mentor-auth/end-chat
 * protectMentor
 */
const endActiveChat = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    if (!(mentor.availabilityStatus === 2 && mentor.activeChatOrderId)) {
      return errorResponse(res, 'No active chat to end', 400);
    }

    await completeChatOrder(mentor.activeChatOrderId.toString());

    const updatedMentor = await Mentor.findById(req.mentor.id);
    return successResponse(res, { mentor: updatedMentor }, 'Chat ended');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  computeLiveEarnings,
  getEarnings,
  getMyOrders,
  updateBankDetails,
  createPayoutRequest,
  getMyPayoutRequests,
  createAdvanceRequest,
  getMyAdvanceRequests,
  endActiveChat,
};
