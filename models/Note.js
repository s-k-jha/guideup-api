const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    fileUrl: {
      type: String,
      required: true,
    },
    // Cloudinary's public_id — needed to delete or replace the asset later.
    filePublicId: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileType: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

noteSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
