const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from: 'Guideup <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    return response
  } catch (error) {
    console.error('Resend email error:', error.message)
  }
}

module.exports = { sendEmail }