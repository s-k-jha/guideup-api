const transporter = require('../config/nodemailer')
const { sendEmail } = require('./resendService')
/**
 * Generates Guideup meeting page link
 */
const getMeetingPageLink = (bookingId) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173"
  return `${baseUrl}/meeting/${bookingId}`
}

/**
 * Sends booking confirmation email to the student.
 */
const sendBookingConfirmation = async (booking) => {

  const { userId, sessionId, date, startTime, endTime } = booking

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
    
    <h2 style="color: #4f46e5;">✅ Booking Confirmed!</h2>

    <p>Hi <strong>${userId.name}</strong>,</p>

    <p>Your mentorship session has been successfully booked.</p>

    <table style="width:100%; border-collapse: collapse; margin:20px 0;">

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Session</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${sessionId.title}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Date</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${date}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Time</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${startTime} – ${endTime}</td>
      </tr>

    </table>

    <p>A mentor will be assigned shortly. You'll receive another email once assigned.</p>

    <p style="color:#888;font-size:12px;">
      Please do not share your session link with anyone.
    </p>

  </div>
  `

  // await transporter.sendMail({
  //   from: `"Guideup" <${process.env.EMAIL_USER}>`,
  //   to: userId.email,
  //   subject: `✅ Booking Confirmed – ${sessionId.title}`,
  //   html
  // })
  await sendEmail({
    to: userId.email,
    subject: `✅ Booking Confirmed – ${sessionId.title}`,
    html,
  })

}


/**
 * Sends mentor assignment notification email to the student.
 */
const sendMentorAssignedEmail = async (booking) => {

  const { userId, sessionId, mentorId, date, startTime, endTime } = booking

  const meetingPage = getMeetingPageLink(booking._id)

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:8px;">

    <h2 style="color:#4f46e5;">👤 Mentor Assigned!</h2>

    <p>Hi <strong>${userId.name}</strong>,</p>

    <p>A mentor has been assigned to your upcoming session.</p>

    <table style="width:100%; border-collapse: collapse; margin:20px 0;">

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Session</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${sessionId.title}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Mentor</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${mentorId.name}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Date</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${date}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Time</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${startTime} – ${endTime}</td>
      </tr>

      <tr>
        <td style="padding:8px;font-weight:bold;color:#555;">Join Session</td>
        <td style="padding:8px;">
          <a href="${meetingPage}" style="color:#4f46e5;font-weight:bold;font-size:16px;">
          Join your session
          </a>
        </td>
      </tr>

    </table>

    <p style="color:#888;font-size:12px;">
      ⚠️ Do not share this session link with anyone.
    </p>

  </div>
  `

  // await transporter.sendMail({
  //   from: `"Guideup" <${process.env.EMAIL_USER}>`,
  //   to: userId.email,
  //   subject: `👤 Mentor Assigned – ${sessionId.title}`,
  //   html
  // })
  await sendEmail({
    to: userId.email,
    subject: `👤 Mentor Assigned – ${sessionId.title}`,
    html,
  })
  
}


/**
 * Sends reminder email 1 hour before the session.
 */
const sendReminderEmail = async (booking) => {

  const { userId, sessionId, mentorId, date, startTime, endTime } = booking

  const meetingPage = getMeetingPageLink(booking._id)

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:8px;">

    <h2 style="color:#f59e0b;">⏰ Session Reminder</h2>

    <p>Hi <strong>${userId.name}</strong>,</p>

    <p>Your mentorship session will start soon.</p>

    <table style="width:100%; border-collapse: collapse; margin:20px 0;">

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Session</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${sessionId.title}</td>
      </tr>

      ${
        mentorId
          ? `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Mentor</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${mentorId.name}</td>
      </tr>`
          : ""
      }

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Date</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${date}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;color:#555;">Time</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${startTime} – ${endTime}</td>
      </tr>

      <tr>
        <td style="padding:8px;font-weight:bold;color:#555;">Join Session</td>
        <td style="padding:8px;">
          <a href="${meetingPage}" style="color:#4f46e5;font-size:16px;font-weight:bold;">
            Join your session
          </a>
        </td>
      </tr>

    </table>

    <p>Be on time and have your questions ready 🚀</p>

  </div>
  `

  // await transporter.sendMail({
  //   from: `"Guideup" <${process.env.EMAIL_USER}>`,
  //   to: userId.email,
  //   subject: `⏰ Reminder: Your session is coming up – ${sessionId.title}`,
  //   html
  // })
  await sendEmail({
  to: userId.email,
  subject: `⏰ Reminder: Your session is coming up – ${sessionId.title}`,
  html,
})
}
const sendMentorSessionAssignedEmail = async (booking) => {

  const { mentorId, userId, sessionId, date, startTime, endTime } = booking

  const meetingPage = `${process.env.FRONTEND_URL || "https://guideup.in"}/meeting/${booking._id}`

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin:auto; padding:20px; border:1px solid #e0e0e0; border-radius:8px;">

    <h2 style="color:#4f46e5;">📅 New Session Assigned</h2>

    <p>Hi <strong>${mentorId.name}</strong>,</p>

    <p>You have been assigned a new mentorship session.</p>

    <table style="width:100%; border-collapse: collapse; margin:20px 0;">

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;">Session</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${sessionId.title}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;">Student</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${userId.name}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;">Date</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${date}</td>
      </tr>

      <tr>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;font-weight:bold;">Time</td>
        <td style="padding:8px;border-bottom:1px solid #f0f0f0;">${startTime} – ${endTime}</td>
      </tr>

      <tr>
        <td style="padding:8px;font-weight:bold;">Join Session</td>
        <td style="padding:8px;">
          <a href="${meetingPage}" style="color:#4f46e5;font-weight:bold;">
            Open session
          </a>
        </td>
      </tr>

    </table>

    <p style="font-size:12px;color:#888;">
      Please join the session on time.
    </p>

  </div>
  `

  await transporter.sendMail({
  from: `"Guideup" <${process.env.EMAIL_USER}>`,
  to: mentorId.email,
  subject: `📅 New session assigned – ${sessionId.title}`,
  html
})

}
module.exports = {
  sendBookingConfirmation,
  sendMentorAssignedEmail,
  sendReminderEmail,
  sendMentorSessionAssignedEmail
}