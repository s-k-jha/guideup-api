const mongoose = require('mongoose');
const validator = require('validator');

const mentorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Invalid email address',
      },
    },
    skills: {
      type: [String],
      default: [],
    },
    meetingLink: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    maxSessionsPerDay: {
      type: Number,
      default: 5,
      min: [1, 'Must allow at least 1 session per day'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Mentor', mentorSchema);
