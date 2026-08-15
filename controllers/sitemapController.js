const Article = require('../models/Article');
const Mentor = require('../models/Mentor');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getSitemapData = async (req, res) => {
  try {
    const articles = await Article.find({ status: 'published' }).select('slug updatedAt');
    const mentors = await Mentor.find({ isActive: true, isPubliclyListed: true }).select(
      'slug updatedAt'
    );

    return successResponse(res, { articles, mentors });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getSitemapData };
