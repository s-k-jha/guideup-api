const Mentor = require('../models/Mentor');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getMentors = async (req, res) => {
  try {
    const mentors = await Mentor.find({ isActive: true }).sort({ name: 1 });
    return successResponse(res, { mentors });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const createMentor = async (req, res) => {
  try {
    const { name, email, skills, meetingLink, maxSessionsPerDay } = req.body;

    if (!name || !email) {
      return errorResponse(res, 'Name and email are required', 400);
    }

    const mentor = await Mentor.create({
      name,
      email,
      skills: skills || [],
      meetingLink,
      maxSessionsPerDay: maxSessionsPerDay || 5,
    });

    return successResponse(res, { mentor }, 'Mentor created', 201);
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, 'Mentor with this email already exists', 409);
    }
    return errorResponse(res, error.message, 500);
  }
};

const updateMentor = async (req, res) => {
  try {
    const mentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor }, 'Mentor updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getMentors, createMentor, updateMentor };
