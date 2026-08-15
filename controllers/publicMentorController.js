const Mentor = require('../models/Mentor');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getPublicMentors = async (req, res) => {
  try {
    const filter = { isActive: true, isPubliclyListed: true };
    if (req.query.type) {
      filter.mentorType = req.query.type;
    }
    if (req.query.type === 'talk') {
      // Online (1) and busy (2) talk mentors are both shown so students can
      // see the full active panel; offline/unavailable (0) mentors never
      // appear on the public connect listing.
      filter.availabilityStatus = { $in: [1, 2] };
    }

    const mentors = await Mentor.find(filter)
      .select('name slug photoUrl linkedinUrl role company experienceYears bio domains skills mentorType chatPrice discountPrice offers availabilityStatus')
      .sort({ createdAt: -1 });

    return successResponse(res, { mentors });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const getPublicMentorBySlug = async (req, res) => {
  try {
    const mentor = await Mentor.findOne({
      slug: req.params.slug,
      isActive: true,
      isPubliclyListed: true,
    });

    if (!mentor) return errorResponse(res, 'Mentor not found', 404);
    return successResponse(res, { mentor });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getPublicMentors, getPublicMentorBySlug };
