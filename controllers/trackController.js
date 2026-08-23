const jwt = require('jsonwebtoken');
const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');
const Visit = require('../models/Visit');
const { errorResponse } = require('../utils/apiResponse');

const getClientIp = (req) => {
  const raw = req.ip || req.connection?.remoteAddress || '';
  return raw.replace('::ffff:', '');
};

/**
 * Best-effort: if the visitor happens to be a logged-in student, attach
 * their userId — but tracking must work equally well for anonymous
 * visitors, so an invalid/missing token is never an error here.
 */
const getOptionalUserId = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    return decoded.role === 'user' ? decoded.id : null;
  } catch {
    return null;
  }
};

/**
 * POST /api/track/visit
 * Public — fired once per page view from the frontend router. Never
 * surfaces an error to the caller; a tracking hiccup must not affect the
 * page the visitor is actually looking at.
 */
const trackVisit = async (req, res) => {
  try {
    const { visitorId, path, referrer, utmSource, utmMedium, utmCampaign } = req.body;
    if (!visitorId || !path) return errorResponse(res, 'visitorId and path are required', 400);

    const ip = getClientIp(req);
    const geo = geoip.lookup(ip) || {};
    const ua = new UAParser(req.headers['user-agent'] || '').getResult();

    await Visit.create({
      visitorId: String(visitorId),
      path: String(path),
      referrer: referrer || '',
      ip,
      country: geo.country || '',
      region: geo.region || '',
      city: geo.city || '',
      browser: [ua.browser?.name, ua.browser?.version].filter(Boolean).join(' '),
      os: [ua.os?.name, ua.os?.version].filter(Boolean).join(' '),
      device: ua.device?.type || 'desktop',
      userId: getOptionalUserId(req),
      utmSource: utmSource || '',
      utmMedium: utmMedium || '',
      utmCampaign: utmCampaign || '',
    });

    return res.status(204).end();
  } catch (error) {
    return res.status(204).end();
  }
};

module.exports = { trackVisit };
