const mongoose = require('mongoose');
const validator = require('validator');

const mentorApplicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: 'Invalid email address',
      },
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: (v) => /^\+?[\d\s\-().]{7,20}$/.test(v),
        message: 'Invalid phone number',
      },
    },
    currentRole: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience years cannot be negative'],
    },
    college: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
    },
    expertise: {
      type: [String],
      default: [],
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    introduction: {
      type: String,
      trim: true,
      maxlength: [1000, 'Introduction cannot exceed 1000 characters'],
    },
    mentorshipTopics: {
      type: String,
      trim: true,
      maxlength: [500, 'Mentorship topics cannot exceed 500 characters'],
    },
    availability: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MentorApplication', mentorApplicationSchema);
