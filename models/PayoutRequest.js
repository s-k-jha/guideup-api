const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
    },
    bankDetailsSnapshot: {
      accountHolderName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      ifsc: { type: String, trim: true },
      upiId: { type: String, trim: true },
    },
    adminNote: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

payoutRequestSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
