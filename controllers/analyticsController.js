const Visit = require('../models/Visit');
const { successResponse, errorResponse } = require('../utils/apiResponse');

// "Today" means India's calendar day, regardless of the server's own
// timezone (Render/Docker hosts typically run UTC) — otherwise day
// boundaries silently drift and "today's visits" grabs the wrong bucket.
const IST_TZ = 'Asia/Kolkata';
const istDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: IST_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const istDateKey = (date) => istDateFormatter.format(date);

// UTC instant corresponding to IST midnight, `daysBack` days before today.
const istMidnightUtc = (daysBack = 0) => {
  const [y, m, d] = istDateKey(new Date()).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d - daysBack, -5, -30, 0, 0));
};

const daysAgo = istMidnightUtc;

/**
 * GET /api/admin/analytics?days=30
 * protect (admin)
 *
 * One combined payload for the admin analytics dashboard: all-time +
 * today's totals, a daily timeseries for the requested window, and
 * breakdowns by page/referrer/device/browser/country/recent activity.
 */
const getAnalytics = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 90);
    const since = daysAgo(days - 1);
    const today = istMidnightUtc(0);

    const [
      totalVisits,
      totalUniqueVisitorIds,
      todayVisits,
      todayUniqueVisitorIds,
      last7DaysVisits,
      timeseries,
      topPages,
      topReferrers,
      devices,
      browsers,
      countries,
      recentVisits,
    ] = await Promise.all([
      Visit.countDocuments({}),
      Visit.distinct('visitorId'),
      Visit.countDocuments({ createdAt: { $gte: today } }),
      Visit.distinct('visitorId', { createdAt: { $gte: today } }),
      Visit.countDocuments({ createdAt: { $gte: daysAgo(6) } }),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TZ } },
            visits: { $sum: 1 },
            visitors: { $addToSet: '$visitorId' },
          },
        },
        { $project: { date: '$_id', visits: 1, uniqueVisitors: { $size: '$visitors' }, _id: 0 } },
        { $sort: { date: 1 } },
      ]),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { path: '$_id', count: 1, _id: 0 } },
      ]),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since }, referrer: { $nin: ['', null] } } },
        { $group: { _id: '$referrer', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { referrer: '$_id', count: 1, _id: 0 } },
      ]),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$device', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { device: '$_id', count: 1, _id: 0 } },
      ]),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since }, browser: { $nin: ['', null] } } },
        { $group: { _id: '$browser', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { browser: '$_id', count: 1, _id: 0 } },
      ]),
      Visit.aggregate([
        { $match: { createdAt: { $gte: since }, country: { $nin: ['', null] } } },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { country: '$_id', count: 1, _id: 0 } },
      ]),
      Visit.find({}).sort({ createdAt: -1 }).limit(50)
        .select('path referrer country city device browser os createdAt'),
    ]);

    // Backfill days with zero visits so the frontend gets a continuous series.
    const byDate = new Map(timeseries.map((row) => [row.date, row]));
    const filledTimeseries = [];
    for (let i = 0; i < days; i += 1) {
      const key = istDateKey(istMidnightUtc(days - 1 - i));
      filledTimeseries.push(byDate.get(key) || { date: key, visits: 0, uniqueVisitors: 0 });
    }

    return successResponse(res, {
      overview: {
        totalVisits,
        totalUniqueVisitors: totalUniqueVisitorIds.length,
        todayVisits,
        todayUniqueVisitors: todayUniqueVisitorIds.length,
        last7DaysVisits,
      },
      timeseries: filledTimeseries,
      topPages,
      topReferrers,
      devices,
      browsers,
      countries,
      recentVisits,
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
};

module.exports = { getAnalytics };
