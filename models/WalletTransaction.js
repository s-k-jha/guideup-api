const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['recharge', 'debit', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    // Razorpay order id — only set for 'recharge'.
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
    // Set for 'debit'/'refund'.
    chatOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatOrder',
      default: null,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
