const Review = require('../models/Review');
const ChatOrder = require('../models/ChatOrder');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const isValidRating = (n) => Number.isInteger(n) && n >= 1 && n <= 5;

/**
 * POST /api/reviews
 * protectUser
 * Body: { chatOrderId, mentorRating?, mentorComment?, platformRating?, platformComment? }
 *
 * A single chat can carry a mentor review and/or a platform review — either
 * or both may be submitted in one call. Each half is independently guarded
 * by the chat order's own mentorReviewed/platformReviewed flags so a user
 * can't leave two mentor reviews for the same chat, and re-submitting after
 * a partial success (e.g. only the mentor half went through) only creates
 * whatever's still missing.
 */
const submitReview = async (req, res) => {
  try {
    const { chatOrderId, mentorRating, mentorComment, platformRating, platformComment } = req.body;

    if (mentorRating === undefined && platformRating === undefined) {
      return errorResponse(res, 'Provide at least a mentor rating or a platform rating', 400);
    }
    if (mentorRating !== undefined && !isValidRating(mentorRating)) {
      return errorResponse(res, 'mentorRating must be an integer from 1 to 5', 400);
    }
    if (platformRating !== undefined && !isValidRating(platformRating)) {
      return errorResponse(res, 'platformRating must be an integer from 1 to 5', 400);
    }

    const chatOrder = await ChatOrder.findOne({ _id: chatOrderId, userId: req.user.id });
    if (!chatOrder) return errorResponse(res, 'Chat order not found', 404);
    if (chatOrder.status !== 'completed') {
      return errorResponse(res, 'You can only review a chat after it has ended', 400);
    }

    const updates = {};

    if (mentorRating !== undefined && !chatOrder.mentorReviewed) {
      try {
        await Review.create({
          userId: req.user.id,
          chatOrderId: chatOrder._id,
          type: 'mentor',
          mentorId: chatOrder.mentorId,
          rating: mentorRating,
          comment: (mentorComment || '').trim(),
        });
        updates.mentorReviewed = true;
      } catch (err) {
        if (err.code !== 11000) throw err; // already reviewed via a raced request — ignore
        updates.mentorReviewed = true;
      }
    }

    if (platformRating !== undefined && !chatOrder.platformReviewed) {
      try {
        await Review.create({
          userId: req.user.id,
          chatOrderId: chatOrder._id,
          type: 'platform',
          rating: platformRating,
          comment: (platformComment || '').trim(),
        });
        updates.platformReviewed = true;
      } catch (err) {
        if (err.code !== 11000) throw err;
        updates.platformReviewed = true;
      }
    }

    if (Object.keys(updates).length > 0) {
      Object.assign(chatOrder, updates);
      await chatOrder.save();
    }

    return successResponse(
      res,
      { mentorReviewed: chatOrder.mentorReviewed, platformReviewed: chatOrder.platformReviewed },
      'Thanks for your feedback!',
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * POST /api/reviews/platform
 * protectUser
 * Body: { rating, comment? }
 *
 * A general "rate the platform" entry point (e.g. from the site footer),
 * not tied to any particular chat — unlike the post-chat platform half of
 * submitReview, this isn't deduped against a chat order, so a student can
 * leave a fresh one whenever they want to.
 */
const submitPlatformReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!isValidRating(rating)) {
      return errorResponse(res, 'rating must be an integer from 1 to 5', 400);
    }

    await Review.create({
      userId: req.user.id,
      type: 'platform',
      rating,
      comment: (comment || '').trim(),
    });

    return successResponse(res, {}, 'Thanks for your feedback!', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/admin/reviews?type=mentor|platform
 * protect (admin)
 */
const getAdminReviews = async (req, res) => {
  try {
    const { type } = req.query;
    if (type && !['mentor', 'platform'].includes(type)) {
      return errorResponse(res, 'type must be mentor or platform', 400);
    }
    const filter = type ? { type } : {};

    const [reviews, statsAgg] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'name email')
        .populate('mentorId', 'name email photoUrl')
        .sort({ createdAt: -1 })
        .limit(200),
      Review.aggregate([
        { $match: filter },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { avgRating: statsAgg[0]?.avgRating || 0, count: statsAgg[0]?.count || 0 };

    return successResponse(res, { reviews, stats });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { submitReview, submitPlatformReview, getAdminReviews };
