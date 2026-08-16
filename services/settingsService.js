const Setting = require('../models/Setting');

/**
 * Reads the (singleton) global settings document, creating it with defaults
 * on first access. Safe under concurrent calls — the upsert is atomic at
 * the MongoDB level, so two simultaneous first-reads can't create duplicates
 * (the unique index on `singleton` would reject the loser anyway).
 */
const getSettings = async () => {
  return Setting.findOneAndUpdate(
    { singleton: 'singleton' },
    { $setOnInsert: { singleton: 'singleton' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = { getSettings };
