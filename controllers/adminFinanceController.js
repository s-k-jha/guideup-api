const Mentor = require('../models/Mentor');
const PayoutRequest = require('../models/PayoutRequest');
const AdvanceRequest = require('../models/AdvanceRequest');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const VALID_STATUSES = ['approved', 'paid', 'rejected'];

/**
 * GET /api/admin/finance/payout-requests
 * protect (admin)
 */
const getAdminPayoutRequests = async (req, res) => {
  try {
    const payoutRequests = await PayoutRequest.find({})
      .populate('mentorId', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { payoutRequests });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/admin/finance/payout-requests/:id/status
 * protect (admin)
 */
const updatePayoutRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `status must be one of ${VALID_STATUSES.join(', ')}`, 400);
    }

    const payoutRequest = await PayoutRequest.findById(req.params.id);
    if (!payoutRequest) return errorResponse(res, 'Payout request not found', 404);

    payoutRequest.status = status;
    if (adminNote !== undefined) payoutRequest.adminNote = adminNote;
    payoutRequest.processedAt = new Date();
    await payoutRequest.save();

    if (status === 'paid') {
      await Mentor.findByIdAndUpdate(payoutRequest.mentorId, {
        $inc: { totalPaidOut: payoutRequest.amount },
      });
    }

    return successResponse(res, { payoutRequest }, 'Payout request updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * GET /api/admin/finance/advance-requests
 * protect (admin)
 */
const getAdminAdvanceRequests = async (req, res) => {
  try {
    const advanceRequests = await AdvanceRequest.find({})
      .populate('mentorId', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, { advanceRequests });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

/**
 * PATCH /api/admin/finance/advance-requests/:id/status
 * protect (admin)
 */
const updateAdvanceRequestStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `status must be one of ${VALID_STATUSES.join(', ')}`, 400);
    }

    const advanceRequest = await AdvanceRequest.findById(req.params.id);
    if (!advanceRequest) return errorResponse(res, 'Advance request not found', 404);

    advanceRequest.status = status;
    if (adminNote !== undefined) advanceRequest.adminNote = adminNote;
    advanceRequest.processedAt = new Date();
    await advanceRequest.save();

    if (status === 'paid') {
      // An advance draws down the same earnings pool as a regular payout — increment
      // totalPaidOut here too so availableForPayout stays correct and neither request
      // type can double-claim the same money.
      await Mentor.findByIdAndUpdate(advanceRequest.mentorId, {
        $inc: { totalPaidOut: advanceRequest.amount },
      });
    }

    return successResponse(res, { advanceRequest }, 'Advance request updated');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = {
  getAdminPayoutRequests,
  updatePayoutRequestStatus,
  getAdminAdvanceRequests,
  updateAdvanceRequestStatus,
};
