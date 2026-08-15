const jwt = require('jsonwebtoken');
const Mentor = require('../models/Mentor');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const SELF_UPDATE_FIELDS = [
  'bio',
  'photoUrl',
  'linkedinUrl',
  'domains',
  'skills',
  'role',
  'company',
  'experienceYears',
];

const toPublicMentor = (mentor) => ({
  id: mentor._id,
  name: mentor.name,
  email: mentor.email,
  mentorType: mentor.mentorType,
  availabilityStatus: mentor.availabilityStatus,
});

/**
 * POST /api/mentor-auth/login
 * Public.
 */
const loginMentor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const mentor = await Mentor.findOne({ email: email.toLowerCase() }).select('+password');

    if (!mentor || !mentor.password || !(await mentor.comparePassword(password))) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!mentor.isActive) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = jwt.sign({ id: mentor._id, role: 'mentor' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    return successResponse(res, { token, mentor: toPublicMentor(mentor) }, 'Login successful');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/mentor-auth/me
 * protectMentor
 */
const getMentorMe = async (req, res) => {
  try {
    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PUT /api/mentor-auth/me
 * protectMentor
 */
const updateMentorMe = async (req, res) => {
  try {
    const payload = {};
    SELF_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) payload[field] = req.body[field];
    });

    const mentor = await Mentor.findByIdAndUpdate(req.mentor.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor }, 'Profile updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/mentor-auth/status
 * protectMentor
 * Mentors may only self-select 0 (offline) or 1 (online). Busy (2) is system-managed —
 * it is set automatically when a chat is confirmed for the mentor and cleared when the
 * mentor ends the active chat (see mentorFinanceController.endActiveChat).
 */
const updateMentorStatus = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    if (![0, 1].includes(availabilityStatus)) {
      return errorResponse(
        res,
        'availabilityStatus must be 0 (offline) or 1 (online) — busy is set automatically while you are in an active chat',
        400
      );
    }

    const mentor = await Mentor.findById(req.mentor.id);
    if (!mentor) return errorResponse(res, 'Mentor not found', 404);

    if (mentor.availabilityStatus === 2) {
      return errorResponse(
        res,
        'You are currently in an active chat. End it first from your dashboard.',
        409
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    if (mentor.availabilityStatus === 0 && availabilityStatus === 1) {
      if (mentor.presenceDate !== today) {
        mentor.presenceMinutesToday = 0;
        mentor.presenceDate = today;
      }
      mentor.lastActiveAt = new Date();
    } else if (mentor.availabilityStatus === 1 && availabilityStatus === 0) {
      if (mentor.lastActiveAt) {
        const elapsedMinutes = (Date.now() - mentor.lastActiveAt.getTime()) / 60000;
        if (mentor.presenceDate !== today) {
          mentor.presenceMinutesToday = 0;
          mentor.presenceDate = today;
        }
        mentor.presenceMinutesToday += elapsedMinutes;
        mentor.lastActiveAt = null;
      }
    }

    mentor.availabilityStatus = availabilityStatus;
    await mentor.save();

    return successResponse(res, { mentor }, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { loginMentor, getMentorMe, updateMentorMe, updateMentorStatus };
