const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, trim: true, maxlength: 100 },
    path: { type: String, required: true, trim: true, maxlength: 300 },
    referrer: { type: String, default: '', trim: true, maxlength: 300 },
    ip: { type: String, default: '' },
    country: { type: String, default: '' },
    region: { type: String, default: '' },
    city: { type: String, default: '' },
    browser: { type: String, default: '' },
    os: { type: String, default: '' },
    device: { type: String, default: 'desktop' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    utmSource: { type: String, default: '', maxlength: 100 },
    utmMedium: { type: String, default: '', maxlength: 100 },
    utmCampaign: { type: String, default: '', maxlength: 100 },
  },
  { timestamps: true }
);

visitSchema.index({ createdAt: -1 });
visitSchema.index({ visitorId: 1, createdAt: -1 });

module.exports = mongoose.model('Visit', visitSchema);
