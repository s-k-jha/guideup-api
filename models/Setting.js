const mongoose = require('mongoose');

// Singleton document — every read/write filters on { singleton: 'singleton' },
// and the unique index guarantees only one such document can ever exist.
// See services/settingsService.js for the upsert-on-read accessor.
const settingSchema = new mongoose.Schema(
  {
    singleton: {
      type: String,
      default: 'singleton',
      unique: true,
    },
    aiChatEnabled: {
      type: Boolean,
      default: false,
    },
    aiChatEnabledAt: {
      type: Date,
      default: null,
    },
    aiChatEnabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
