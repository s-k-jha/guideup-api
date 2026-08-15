const validator = require('validator');
const MentorApplication = require('../models/MentorApplication');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];

const submitApplication = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      currentRole,
      company,
      experienceYears,
      college,
      domain,
      expertise,
      linkedinUrl,
      introduction,
      mentorshipTopics,
      availability,
    } = req.body;

    const errors = [];
    if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
    if (!email || !validator.isEmail(email)) errors.push('Valid email is required');
    if (!phone || !/^\+?[\d\s\-().]{7,20}$/.test(phone)) errors.push('Valid phone number is required');
    if (!domain || !domain.trim()) errors.push('Domain is required');

    if (errors.length > 0) return errorResponse(res, 'Validation failed', 400, errors);

    const application = await MentorApplication.create({
      name,
      email,
      phone,
      currentRole,
      company,
      experienceYears,
      college,
      domain,
      expertise: expertise || [],
      linkedinUrl,
      introduction,
      mentorshipTopics,
      availability,
    });

    return successResponse(res, { application }, 'Application submitted', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getApplications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const applications = await MentorApplication.find(filter).sort({ createdAt: -1 });
    return successResponse(res, { applications });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !APPLICATION_STATUSES.includes(status)) {
      return errorResponse(res, `Status must be one of: ${APPLICATION_STATUSES.join(', ')}`, 400);
    }

    const application = await MentorApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) return errorResponse(res, 'Application not found', 404);
    return successResponse(res, { application }, 'Application status updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { submitApplication, getApplications, updateApplicationStatus };
