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
  },
  { timestamps: true }
);

chatMessageSchema.index({ chatOrderId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
