const transporter = require('../config/nodemailer');

/**
 * Fire-and-forget admin awareness emails (bookings, chats, payouts, etc.) —
 * separate from the student-facing transactional emails in emailService.js.
 * Sent over the same free Gmail SMTP creds (EMAIL_USER/EMAIL_PASS) already
 * used for OTPs, straight to ADMIN_EMAIL. Silently no-ops if creds aren't
 * set yet, and never throws — a notification failure must never break the
 * request that triggered it.
 */

let warnedMissingConfig = false;

function isConfigured() {
  const ok = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL);
  if (!ok && !warnedMissingConfig) {
    warnedMissingConfig = true;
    console.warn(
      'Admin notification emails are disabled — set EMAIL_USER, EMAIL_PASS and ADMIN_EMAIL in .env to enable them.'
    );
  }
  return ok;
}

function renderTemplate({ heading, accent, rows, footer }) {
  const rowsHtml = rows
    .filter((r) => r.value !== undefined && r.value !== null && r.value !== '')
    .map(
      (r) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;white-space:nowrap;">${r.label}</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${r.value}</td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    <h2 style="color:${accent || '#4f46e5'};">${heading}</h2>
    <table style="width:100%; border-collapse: collapse; margin:16px 0;">
      ${rowsHtml}
    </table>
    ${footer ? `<p style="color:#888;font-size:12px;">${footer}</p>` : ''}
  </div>
  `;
}

async function sendAdminMail({ subject, heading, accent, rows, footer }) {
  if (!isConfigured()) return;
  try {
    await transporter.sendMail({
      from: `"GuideUp Alerts" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      html: renderTemplate({ heading, accent, rows, footer }),
    });
  } catch (error) {
    console.error('Admin notify email failed:', error.message);
  }
}

const notifyNewBooking = (booking) => {
  const user = booking.userId;
  const session = booking.sessionId;
  return sendAdminMail({
    subject: `📅 New booking — ${session?.title || 'Session'}`,
    heading: '📅 New Booking',
    rows: [
      { label: 'Student', value: user?.name },
      { label: 'Email', value: user?.email },
      { label: 'Phone', value: user?.phone },
      { label: 'Session', value: session?.title },
      { label: 'Date', value: booking.date },
      { label: 'Time', value: `${booking.startTime} – ${booking.endTime}` },
      { label: 'Amount', value: `₹${booking.amountPaid}` },
    ],
    footer: 'Assign a mentor from the admin dashboard if it wasn’t auto-assigned.',
  });
};

const notifyChatOrder = ({ studentName, studentEmail, mentorName, tier, amountPaid, aiHandled }) =>
  sendAdminMail({
    subject: `💬 New chat — ${studentName} with ${mentorName}`,
    heading: '💬 New Mentor Chat',
    accent: '#0ea5e9',
    rows: [
      { label: 'Student', value: studentName },
      { label: 'Email', value: studentEmail },
      { label: 'Mentor', value: mentorName },
      { label: 'Tier', value: tier },
      { label: 'Amount', value: `₹${amountPaid}` },
      { label: 'Handled by', value: aiHandled ? 'AI' : 'Mentor (human)' },
    ],
  });

const notifyWalletRecharge = (user, amount) =>
  sendAdminMail({
    subject: `💰 Wallet recharge — ₹${amount} by ${user.name}`,
    heading: '💰 Wallet Recharged',
    accent: '#16a34a',
    rows: [
      { label: 'Student', value: user.name },
      { label: 'Email', value: user.email },
      { label: 'Amount', value: `₹${amount}` },
      { label: 'New balance', value: `₹${user.walletBalance}` },
    ],
  });

const notifyMentorApplication = (application) =>
  sendAdminMail({
    subject: `🧑‍🏫 New mentor application — ${application.name}`,
    heading: '🧑‍🏫 New Mentor Application',
    accent: '#9333ea',
    rows: [
      { label: 'Name', value: application.name },
      { label: 'Email', value: application.email },
      { label: 'Phone', value: application.phone },
      { label: 'Current role', value: application.currentRole },
      { label: 'Company', value: application.company },
      { label: 'Domain', value: application.domain },
      { label: 'LinkedIn', value: application.linkedinUrl },
    ],
    footer: 'Review it in the admin dashboard → Mentors → Applications.',
  });

const notifyPayoutRequest = (mentor, payoutRequest) =>
  sendAdminMail({
    subject: `🏦 Payout request — ₹${payoutRequest.amount} from ${mentor.name}`,
    heading: '🏦 Mentor Payout Request',
    accent: '#f59e0b',
    rows: [
      { label: 'Mentor', value: mentor.name },
      { label: 'Email', value: mentor.email },
      { label: 'Amount', value: `₹${payoutRequest.amount}` },
    ],
    footer: 'Review and approve/reject it in the admin finance dashboard.',
  });

const notifyAdvanceRequest = (mentor, advanceRequest) =>
  sendAdminMail({
    subject: `🏦 Advance request — ₹${advanceRequest.amount} from ${mentor.name}`,
    heading: '🏦 Mentor Advance Request',
    accent: '#f59e0b',
    rows: [
      { label: 'Mentor', value: mentor.name },
      { label: 'Email', value: mentor.email },
      { label: 'Amount', value: `₹${advanceRequest.amount}` },
      { label: 'Max eligible', value: `₹${Number(advanceRequest.maxEligibleAmount).toFixed(2)}` },
    ],
    footer: 'Review and approve/reject it in the admin finance dashboard.',
  });

module.exports = {
  notifyNewBooking,
  notifyChatOrder,
  notifyWalletRecharge,
  notifyMentorApplication,
  notifyPayoutRequest,
  notifyAdvanceRequest,
};
