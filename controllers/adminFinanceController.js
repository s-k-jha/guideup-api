const Mentor = require('../models/Mentor');
const PayoutRequest = require('../models/PayoutRequest');
const AdvanceRequest = require('../models/AdvanceRequest');
const { computeLiveEarnings } = require('./mentorFinanceController');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const VALID_STATUSES = ['approved', 'paid', 'rejected'];

/**
 * A mentor can end up with several pending payout/advance requests whose
 * amounts sum to more than they've actually earned — e.g. two requests
 * submitted back-to-back before either lands, each checked against the same
 * stale "available" snapshot. That's harmless on its own since no money has
 * moved yet, but approving/paying one of those requests is where it would
 * turn into a real overpayment. So the check belongs here, at the point
 * money actually commits, not on the create side.
 */
const assertWithinLiveEarnings = async (mentorId, res) => {
  const { netEarnings, reserved } = await computeLiveEarnings(mentorId);
  if (reserved > netEarnings + 0.01) {
    errorResponse(
      res,
      `Cannot approve — this mentor's pending/approved/paid requests (₹${reserved.toFixed(2)}) exceed their net earnings (₹${netEarnings.toFixed(2)}). Reject the duplicate/over-committed request(s) first.`,
      409
    );
    return false;
  }
  return true;
};

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

    if ((status === 'approved' || status === 'paid') && payoutRequest.status !== status) {
      if (!(await assertWithinLiveEarnings(payoutRequest.mentorId, res))) return;
    }

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

    if ((status === 'approved' || status === 'paid') && advanceRequest.status !== status) {
      if (!(await assertWithinLiveEarnings(advanceRequest.mentorId, res))) return;
    }

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
