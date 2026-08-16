const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Set for reviews left right after a specific chat. Standalone platform
    // ratings submitted from the footer (not tied to any one chat) leave
    // this null.
    chatOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatOrder',
      default: null,
    },
    type: {
      type: String,
      enum: ['mentor', 'platform'],
      required: true,
    },
    // Only set for type: 'mentor' reviews.
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mentor',
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

// One review per type per chat — also the safety net against a raced
// double-submit creating two documents for the same chat/type. Scoped to
// documents that actually have a chatOrderId so standalone platform
// ratings (chatOrderId: null) don't collide with each other under a
// unique index — Mongo would otherwise treat every null as the same value.
reviewSchema.index(
  { chatOrderId: 1, type: 1 },
  { unique: true, partialFilterExpression: { chatOrderId: { $type: 'objectId' } } }
);
reviewSchema.index({ mentorId: 1, createdAt: -1 });
reviewSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
