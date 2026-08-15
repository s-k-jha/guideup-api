const mongoose = require('mongoose');

const chatOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    tier: {
      type: String,
      enum: ['free', 'discount', 'paid'],
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
    },
    durationMinutes: {
      type: Number,
      default: 2,
    },
    status: {
      type: String,
      enum: ['pending', 'payment_processing', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    orderId: {
      type: String,
      default: null,
    },
    paymentId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

chatOrderSchema.index({ userId: 1, mentorId: 1 });
chatOrderSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model('ChatOrder', chatOrderSchema);
