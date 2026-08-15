const mongoose = require('mongoose');

const advanceRequestSchema = new mongoose.Schema(
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
    eligiblePresenceMinutesToday: {
      type: Number,
      required: true,
    },
    trailingMonthEarnings: {
      type: Number,
      required: true,
    },
    maxEligibleAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'rejected'],
      default: 'pending',
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

advanceRequestSchema.index({ mentorId: 1, createdAt: -1 });

module.exports = mongoose.model('AdvanceRequest', advanceRequestSchema);
