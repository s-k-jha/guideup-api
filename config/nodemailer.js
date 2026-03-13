const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
})

transporter.verify((error) => {
  if (error) {
    console.error("Email transporter error:", error.message)
  } else {
    console.log("Email transporter ready")
  }
})

module.exports = transporter