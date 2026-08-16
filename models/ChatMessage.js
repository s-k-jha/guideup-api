const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    chatOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatOrder',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['user', 'mentor'],
      required: true,
    },
    // Polymorphic — refers to a User or a Mentor depending on senderRole, so no `ref` here.
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Message text is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    // True only for AI-generated mentor replies (see services/llmService.js) —
    // audit trail so admin/mentor UIs can distinguish them from the mentor's
    // own writing, even though both are stored with senderRole: 'mentor'.
    senderIsAi: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

chatMessageSchema.index({ chatOrderId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
