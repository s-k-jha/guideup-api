const jwt = require('jsonwebtoken');
const ChatOrder = require('../models/ChatOrder');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware for REST routes scoped to one specific ChatOrder (:id param),
 * callable by either the student or the mentor who is a participant in it.
 */
const protectChatParticipant = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Session expired. Please log in again.', 401);
      }
      return errorResponse(res, 'Invalid token', 401);
    }

    if (decoded.role !== 'user' && decoded.role !== 'mentor') {
      return errorResponse(res, 'Invalid token', 401);
    }

    const chatOrder = await ChatOrder.findById(req.params.id);
    if (!chatOrder) {
      return errorResponse(res, 'Chat order not found', 404);
    }

    const isParticipant =
      decoded.role === 'user'
        ? chatOrder.userId.toString() === decoded.id
        : chatOrder.mentorId?.toString() === decoded.id;

    if (!isParticipant) {
      return errorResponse(res, 'Not authorized for this chat', 403);
    }

    req.chatOrder = chatOrder;
    req.callerRole = decoded.role;
    req.callerId = decoded.id;
    next();
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { protectChatParticipant };
