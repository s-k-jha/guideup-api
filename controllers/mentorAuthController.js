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
 */
const updateMentorStatus = async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    if (![0, 1, 2].includes(availabilityStatus)) {
      return errorResponse(res, 'availabilityStatus must be one of 0, 1, 2', 400, [
        '0 = unavailable/offline, 1 = online, 2 = busy',
      ]);
    }

    const mentor = await Mentor.findByIdAndUpdate(
      req.mentor.id,
      { availabilityStatus },
      { new: true }
    );

    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor }, 'Status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { loginMentor, getMentorMe, updateMentorMe, updateMentorStatus };
