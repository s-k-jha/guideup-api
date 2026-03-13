const Booking = require('../models/Booking');
const Mentor = require('../models/Mentor');
const emailService = require('../services/emailService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * GET /api/admin/bookings
 * Returns all bookings with optional filters.
 */
const getBookings = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (date) filter.date = date;

    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('userId', 'name email phone')
        .populate('sessionId', 'title durationMinutes price')
        .populate('mentorId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    return successResponse(res, {
      bookings,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/admin/bookings/:id/assign-mentor
 * Assigns a mentor to a booking.
 */
const assignMentor = async (req, res) => {
  try {
    const { mentorId } = req.body;

    if (!mentorId) {
      return errorResponse(res, 'mentorId is required', 400);
    }

    const mentor = await Mentor.findById(mentorId);
    if (!mentor || !mentor.isActive) {
      return errorResponse(res, 'Mentor not found or inactive', 404);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    if (booking.status !== 'confirmed') {
      return errorResponse(res, 'Can only assign mentor to confirmed bookings', 400);
    }

    booking.mentorId = mentorId;
    booking.meetingLink = mentor.meetingLink || null;
    await booking.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('userId', 'name email phone')
      .populate('sessionId', 'title durationMinutes price')
      .populate('mentorId', 'name email meetingLink');

    // Send mentor assigned email
    try {
      await emailService.sendMentorAssignedEmail(populatedBooking);
      await emailService.sendMentorSessionAssignedEmail(populatedBooking);
    } catch (emailError) {
      console.error('Failed to send mentor assignment email:', emailError.message);
    }

    return successResponse(res, { booking: populatedBooking }, 'Mentor assigned successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getBookings, assignMentor };
