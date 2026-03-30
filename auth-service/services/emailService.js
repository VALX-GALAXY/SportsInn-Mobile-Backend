const nodemailer = require("nodemailer");

function createTransporter() {
  if (process.env.EMAIL_SERVICE === "gmail" || process.env.EMAIL_USER?.includes("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
    });
  }
  if (process.env.EMAIL_SERVICE === "resend" || process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
      connectionTimeout: 20000,
      greetingTimeout: 20000,
    });
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER || "your-email@gmail.com", pass: process.env.EMAIL_PASSWORD || "your-app-password" },
  });
}

async function sendOTPEmail(email, otp) {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@sportsinn.com",
    to: email,
    subject: "Your SportsInn OTP Code",
    html: `<div><h2>Your OTP Code</h2><p><strong>${otp}</strong></p><p>Expires in 5 minutes.</p></div>`,
    text: `Your OTP: ${otp}. Expires in 5 minutes.`,
  };
  await transporter.sendMail(mailOptions);
  return { success: true };
}

module.exports = { sendOTPEmail, createTransporter };
