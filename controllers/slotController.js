const Session = require('../models/Session');
const Booking = require('../models/Booking');
const WorkingHours = require('../models/WorkingHours');
const { generateCandidateSlots, computeAvailability } = require('../utils/slotGenerator');
const { getActiveLocks } = require('../utils/slotLockStore');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getSlots = async (req, res) => {
  try {
    const { date, sessionId } = req.query;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return errorResponse(res, 'date query param required (YYYY-MM-DD format)', 400);
    }

    if (!sessionId) {
      return errorResponse(res, 'sessionId query param required', 400);
    }

    // Reject past dates
    const today = new Date().toISOString().split('T')[0];
    if (date < today) {
      return errorResponse(res, 'Cannot book slots for past dates', 400);
    }

    // Fetch session to get duration
    const session = await Session.findById(sessionId);
    if (!session || !session.isActive) {
      return errorResponse(res, 'Session not found or inactive', 404);
    }

    const { durationMinutes } = session;

    // Fetch working hours
    const workingHours = await WorkingHours.findOne({ isActive: true });
    if (!workingHours) {
      return errorResponse(res, 'Working hours not configured', 500);
    }

    const { startTime, endTime, slotResolutionMinutes } = workingHours;

    // Generate candidate slots
    const candidates = generateCandidateSlots(startTime, endTime, durationMinutes, slotResolutionMinutes);

    // Fetch existing confirmed/processing bookings for this date
    const existingBookings = await Booking.find({
      date,
      status: { $in: ['confirmed', 'payment_processing'] },
    }).select('startTime endTime');

    // Get active in-memory locks
    const activeLocks = getActiveLocks();

    // Compute availability
    const slots = computeAvailability(candidates, existingBookings, durationMinutes, activeLocks, date);

    return successResponse(res, { date, durationMinutes, slots });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getSlots };
