const twilio = require("twilio");

async function sendOTPSMS(phoneNumber, otp) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  let formattedPhone = phoneNumber.trim();
  if (!formattedPhone.startsWith("+")) formattedPhone = `+1${formattedPhone.replace(/\D/g, "")}`;

  const message = await client.messages.create({
    body: `Your SportsInn OTP: ${otp}. Expires in 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedPhone,
  });
  return { success: true, messageSid: message.sid };
}

module.exports = { sendOTPSMS };
