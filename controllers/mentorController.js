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
    const {
      name,
      email,
      skills,
      meetingLink,
      maxSessionsPerDay,
      slug,
      photoUrl,
      role,
      company,
      experienceYears,
      bio,
      domains,
      linkedinUrl,
      isPubliclyListed,
      mentorType,
      chatPrice,
      discountPrice,
      offers,
      dailyFreeQuota,
      password,
    } = req.body;

    if (!name || !email) {
      return errorResponse(res, 'Name and email are required', 400);
    }

    const mentor = await Mentor.create({
      name,
      email,
      skills: skills || [],
      meetingLink,
      maxSessionsPerDay: maxSessionsPerDay || 5,
      slug,
      photoUrl,
      role,
      company,
      experienceYears,
      bio,
      domains: domains || [],
      linkedinUrl,
      isPubliclyListed,
      mentorType,
      chatPrice,
      discountPrice,
      offers,
      dailyFreeQuota,
      password,
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
    let mentor;

    if (req.body.password) {
      // findByIdAndUpdate does not trigger pre('save') hooks, so when a
      // password is being set we need it to run through .save() for hashing.
      mentor = await Mentor.findById(req.params.id);
      if (!mentor) return errorResponse(res, 'Mentor not found', 404);
      Object.assign(mentor, req.body);
      await mentor.save();
      // select: false only applies to queries, not to a doc instance that
      // already has the field set (e.g. right after .save()) — strip it
      // explicitly so the hash never round-trips in the API response.
      mentor.password = undefined;
    } else {
      mentor = await Mentor.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    }

    return successResponse(res, { mentor }, 'Mentor updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getMentors, createMentor, updateMentor };
