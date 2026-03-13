const mongoose = require('mongoose');

const workingHoursSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      default: '18:00',
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      default: '21:00',
    },
    slotResolutionMinutes: {
      type: Number,
      default: 15,
      enum: [15, 30, 45, 60],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkingHours', workingHoursSchema);
