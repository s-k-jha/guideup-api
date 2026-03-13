const Session = require('../models/Session');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// Public
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true }).sort({ createdAt: -1 });
    return successResponse(res, { sessions });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

// Admin
const createSession = async (req, res) => {
  try {
    const { title, description, durationMinutes, price, isPromo } = req.body;

    const session = await Session.create({
      title,
      description,
      durationMinutes,
      price,
      isPromo: isPromo || false,
    });

    return successResponse(res, { session }, 'Session created successfully', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const updateSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!session) return errorResponse(res, 'Session not found', 404);
    return successResponse(res, { session }, 'Session updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const deleteSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!session) return errorResponse(res, 'Session not found', 404);
    return successResponse(res, {}, 'Session deactivated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getSessions, createSession, updateSession, deleteSession };
