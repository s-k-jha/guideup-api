const Booking = require('../models/Booking');
const emailService = require('../services/emailService');

/**
 * Checks for bookings starting within the next 60–65 minutes
 * and sends reminder emails.
 * 
 * Call this on a cron-like interval (e.g., every 5 minutes).
 */
const sendReminders = async () => {
  try {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const reminderWindowStart = currentMinutes + 55; // 55 min from now
    const reminderWindowEnd = currentMinutes + 65;   // 65 min from now

    const toHHMM = (totalMins) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const windowStart = toHHMM(reminderWindowStart);
    const windowEnd = toHHMM(reminderWindowEnd);

    const bookings = await Booking.find({
      date: todayDate,
      status: 'confirmed',
      reminderSent: false,
      startTime: { $gte: windowStart, $lte: windowEnd },
    }).populate('userId sessionId mentorId');

    for (const booking of bookings) {
      await emailService.sendReminderEmail(booking);
      booking.reminderSent = true;
      await booking.save();
    }

    if (bookings.length > 0) {
      console.log(`Sent ${bookings.length} reminder email(s)`);
    }
  } catch (error) {
    console.error('Reminder scheduler error:', error.message);
  }
};

/**
 * Starts the reminder scheduler, runs every 5 minutes.
 */
const startReminderScheduler = () => {
  console.log('Reminder scheduler started');
  sendReminders(); // run immediately on startup
  setInterval(sendReminders, 5 * 60 * 1000);
};

module.exports = { startReminderScheduler };
