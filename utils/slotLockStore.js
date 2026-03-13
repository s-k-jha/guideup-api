/**
 * In-memory slot lock store.
 * Prevents double-booking during payment (5-minute window).
 *
 * In production, replace with Redis for multi-instance support.
 */

const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes

const locks = []; // Array of lock objects

/**
 * Creates a slot lock.
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:MM
 * @param {string} endTime - HH:MM
 * @param {string} orderId - Razorpay order ID to identify the lock
 */
const createLock = (date, startTime, endTime, orderId) => {
  // Remove expired locks first
  cleanExpiredLocks();

  // Remove any existing lock for the same orderId
  removeLockByOrderId(orderId);

  locks.push({
    date,
    startTime,
    endTime,
    orderId,
    expiresAt: Date.now() + LOCK_DURATION_MS,
  });
};

/**
 * Removes lock by orderId (on payment success or failure).
 */
const removeLockByOrderId = (orderId) => {
  const idx = locks.findIndex((l) => l.orderId === orderId);
  if (idx !== -1) locks.splice(idx, 1);
};

/**
 * Removes all expired locks.
 */
const cleanExpiredLocks = () => {
  const now = Date.now();
  for (let i = locks.length - 1; i >= 0; i--) {
    if (locks[i].expiresAt <= now) locks.splice(i, 1);
  }
};

/**
 * Returns all active (non-expired) locks.
 */
const getActiveLocks = () => {
  cleanExpiredLocks();
  return [...locks];
};

module.exports = {
  createLock,
  removeLockByOrderId,
  getActiveLocks,
  cleanExpiredLocks,
};
