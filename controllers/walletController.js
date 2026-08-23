const User = require('../models/User');
const Mentor = require('../models/Mentor');
const WalletTransaction = require('../models/WalletTransaction');
const { createOrder, verifySignature } = require('../services/paymentService');
const adminNotifyService = require('../services/adminNotifyService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/wallet/balance
 * protectUser
 */
const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, { walletBalance: user.walletBalance });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/wallet/min-recharge/:mentorId
 * protectUser
 */
const getMinRecharge = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.params.mentorId);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    const user = await User.findById(req.user.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // chatPrice is defined as the price for one 2-minute chat.
    const perMinuteRate = mentor.chatPrice / 2;
    const min5MinAmount = Math.ceil(perMinuteRate * 5);
    const shortfall = Math.max(0, min5MinAmount - user.walletBalance);

    return successResponse(res, {
      min5MinAmount,
      walletBalance: user.walletBalance,
      shortfall,
      sufficient: shortfall === 0,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/wallet/recharge
 * protectUser
 * Body: { amount }
 */
const createRechargeOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!(amount >= 10)) {
      return errorResponse(res, 'amount must be at least 10', 400);
    }

    const amountInPaise = Math.round(amount * 100);
    const order = await createOrder(amountInPaise, `wallet_${Date.now()}`);

    await WalletTransaction.create({
      userId: req.user.id,
      type: 'recharge',
      amount,
      status: 'pending',
      orderId: order.id,
    });

    return successResponse(res, {
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    }, 'Order created');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/wallet/recharge/verify
 * protectUser
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
const verifyRecharge = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
      await WalletTransaction.findOneAndUpdate(
        { orderId: razorpay_order_id, status: 'pending' },
        { status: 'failed' }
      );
      return errorResponse(res, 'Payment verification failed. Invalid signature.', 400);
    }

    // Atomically claim the pending transaction by flipping it to 'completed'
    // in the same query that finds it — this is the only thing standing
    // between "one real Razorpay payment" and "wallet credited N times" if
    // this endpoint is called concurrently (double-click, or a replayed
    // request — the signature stays valid forever for the same payment, so
    // nothing else here would stop a race). Only one concurrent caller can
    // match `status: 'pending'`; the rest see it already flipped and 404.
    const transaction = await WalletTransaction.findOneAndUpdate(
      { orderId: razorpay_order_id, status: 'pending' },
      { status: 'completed', paymentId: razorpay_payment_id }
    );

    if (!transaction) {
      return errorResponse(res, 'Wallet transaction not found or already processed for this order', 404);
    }

    const user = await User.findByIdAndUpdate(
      transaction.userId,
      { $inc: { walletBalance: transaction.amount } },
      { new: true }
    );
    if (!user) return errorResponse(res, 'User not found', 404);

    await WalletTransaction.updateOne({ _id: transaction._id }, { balanceAfter: user.walletBalance });

    adminNotifyService.notifyWalletRecharge(user, transaction.amount);

    return successResponse(res, { walletBalance: user.walletBalance }, 'Wallet recharged');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/wallet/transactions
 * protectUser
 */
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse(res, { transactions });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getWalletBalance,
  getMinRecharge,
  createRechargeOrder,
  verifyRecharge,
  getMyTransactions,
};
