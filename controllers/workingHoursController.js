const WorkingHours = require('../models/WorkingHours');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getWorkingHours = async (req, res) => {
  try {
    const wh = await WorkingHours.findOne({ isActive: true });
    return successResponse(res, { workingHours: wh });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

const upsertWorkingHours = async (req, res) => {
  try {
    const { startTime, endTime, slotResolutionMinutes } = req.body;

    if (!startTime || !endTime) {
      return errorResponse(res, 'startTime and endTime are required', 400);
    }

    // Deactivate existing and create new record
    await WorkingHours.updateMany({}, { isActive: false });

    const wh = await WorkingHours.create({
      startTime,
      endTime,
      slotResolutionMinutes: slotResolutionMinutes || 15,
      isActive: true,
    });

    return successResponse(res, { workingHours: wh }, 'Working hours updated', 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getWorkingHours, upsertWorkingHours };
