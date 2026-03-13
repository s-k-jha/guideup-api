/**
 * Converts HH:MM time string to total minutes since midnight.
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight back to HH:MM string.
 */
const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Generates candidate slot start times within working hours.
 * @param {string} startTime - Working hours start e.g. "18:00"
 * @param {string} endTime - Working hours end e.g. "21:00"
 * @param {number} durationMinutes - Duration of the requested session
 * @param {number} resolutionMinutes - Grid resolution (default 15)
 * @returns {string[]} Array of HH:MM candidate slot times
 */
const generateCandidateSlots = (startTime, endTime, durationMinutes, resolutionMinutes = 15) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slots = [];

  for (let t = start; t + durationMinutes <= end; t += resolutionMinutes) {
    slots.push(minutesToTime(t));
  }

  return slots;
};

/**
 * Checks if a proposed slot overlaps with an existing booking.
 * Overlap condition: existing.startTime < newEndTime AND existing.endTime > newStartTime
 */
const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => {
  const exS = timeToMinutes(existingStart);
  const exE = timeToMinutes(existingEnd);
  const nS = timeToMinutes(newStart);
  const nE = timeToMinutes(newEnd);

  return exS < nE && exE > nS;
};

/**
 * Builds the availability array for a given date.
 * @param {string[]} candidateSlots - Array of HH:MM strings
 * @param {object[]} existingBookings - Bookings from DB with startTime and endTime fields
 * @param {number} durationMinutes - Requested session duration
 * @param {object[]} slotLocks - In-memory slot locks array
 * @param {string} date - Date string YYYY-MM-DD
 * @returns {object[]} Array of { time, available } objects
 */
const computeAvailability = (candidateSlots, existingBookings, durationMinutes, slotLocks = [], date) => {
  const now = Date.now();

  // Filter active locks (not expired) for this date
  const activeLocks = slotLocks.filter(
    (lock) => lock.date === date && lock.expiresAt > now
  );

  return candidateSlots.map((slotTime) => {
    const slotEndTime = minutesToTime(timeToMinutes(slotTime) + durationMinutes);

    // Check against confirmed/processing bookings
    const bookedOverlap = existingBookings.some((booking) =>
      hasOverlap(booking.startTime, booking.endTime, slotTime, slotEndTime)
    );

    // Check against active locks
    const lockedOverlap = activeLocks.some((lock) =>
      hasOverlap(lock.startTime, lock.endTime, slotTime, slotEndTime)
    );

    return {
      time: slotTime,
      endTime: slotEndTime,
      available: !bookedOverlap && !lockedOverlap,
    };
  });
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  generateCandidateSlots,
  hasOverlap,
  computeAvailability,
};
