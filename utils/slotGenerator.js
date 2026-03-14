/**
 * Converts HH:MM time string to total minutes since midnight
 */
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight back to HH:MM
 */
const minutesToTime = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/**
 * Minimum advance booking buffer
 * Industry standard: 30 minutes
 */
const BOOKING_BUFFER_MINUTES = 30;

/**
 * Generates candidate slots between working hours
 */
const generateCandidateSlots = (
  startTime,
  endTime,
  durationMinutes,
  resolutionMinutes = 15
) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  const slots = [];

  for (let t = start; t + durationMinutes <= end; t += resolutionMinutes) {
    slots.push(minutesToTime(t));
  }

  return slots;
};

/**
 * Detects overlap between two time ranges
 */
const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => {
  const exS = timeToMinutes(existingStart);
  const exE = timeToMinutes(existingEnd);

  const nS = timeToMinutes(newStart);
  const nE = timeToMinutes(newEnd);

  return exS < nE && exE > nS;
};

/**
 * Computes availability considering bookings + locks
 */
const computeAvailability = (
  candidateSlots,
  existingBookings,
  durationMinutes,
  slotLocks = [],
  date
) => {
  const now = Date.now();

  const activeLocks = slotLocks.filter(
    (lock) => lock.date === date && lock.expiresAt > now
  );

  return candidateSlots.map((slotTime) => {
    const slotEndTime = minutesToTime(
      timeToMinutes(slotTime) + durationMinutes
    );

    const bookedOverlap = existingBookings.some((booking) =>
      hasOverlap(booking.startTime, booking.endTime, slotTime, slotEndTime)
    );

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

/**
 * Filters past slots and applies booking buffer
 * Timezone safe for India (Render runs in UTC)
 */
const filterPastSlots = (slots, selectedDate) => {

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });

  if (selectedDate !== today) {
    return slots;
  }

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const cutoff = currentMinutes + BOOKING_BUFFER_MINUTES;

  return slots.map((slot) => {

    const slotStartMinutes = timeToMinutes(slot.time);

    if (slotStartMinutes <= cutoff) {
      return {
        ...slot,
        available: false,
      };
    }

    return slot;

  });

};

module.exports = {
  timeToMinutes,
  minutesToTime,
  generateCandidateSlots,
  hasOverlap,
  computeAvailability,
  filterPastSlots,
};