const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
    },
    date: {
      type: String, // stored as YYYY-MM-DD string for easy querying
      required: true,
    },
    startTime: {
      type: String, // stored as HH:MM
      required: true,
    },
    endTime: {
      type: String, // stored as HH:MM
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'payment_processing', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentId: {
      type: String,
      default: null,
    },
    orderId: {
      type: String,
      default: null,
    },
    meetingLink: {
      type: String,
      default: null,
    },
    studentJoinedAt: {
      type: Date,
      default: null,
    },

    mentorJoinedAt: {
      type: Date,
      default: null,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ date: 1, status: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ orderId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
