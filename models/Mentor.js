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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    photoUrl: {
      type: String,
      trim: true,
    },
    role: {
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
    bio: {
      type: String,
      trim: true,
      maxlength: [600, 'Bio cannot exceed 600 characters'],
    },
    domains: {
      type: [String],
      default: [],
    },
    linkedinUrl: {
      type: String,
      trim: true,
    },
    isPubliclyListed: {
      type: Boolean,
      default: false,
    },
    mentorType: {
      type: String,
      enum: ['interview_panel', 'talk'],
      default: 'interview_panel',
    },
    chatPrice: {
      type: Number,
      min: [0, 'Chat price cannot be negative'],
      default: 199,
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      default: 5,
    },
    offers: {
      firstFree: {
        type: Boolean,
        default: true,
      },
      secondDiscount: {
        type: Boolean,
        default: true,
      },
    },
    dailyFreeQuota: {
      type: Number,
      default: 20,
    },
    freeOrdersUsedToday: {
      type: Number,
      default: 0,
    },
    freeOrdersDate: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

mentorSchema.index({ slug: 1 }, { unique: true, sparse: true });

mentorSchema.pre('save', async function (next) {
  if (this.isPubliclyListed && !this.slug) {
    const base = (this.name || 'mentor')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let candidate = base || 'mentor';
    const Mentor = this.constructor;

    // Ensure uniqueness; append a short random suffix on collision.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await Mentor.findOne({ slug: candidate, _id: { $ne: this._id } });
      if (!existing) break;
      const suffix = Math.random().toString(36).slice(2, 7);
      candidate = `${base}-${suffix}`;
    }

    this.slug = candidate;
  }
  next();
});

module.exports = mongoose.model('Mentor', mentorSchema);
