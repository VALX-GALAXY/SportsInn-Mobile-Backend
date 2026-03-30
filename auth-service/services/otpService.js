const crypto = require("crypto");
const path = require("path");
const redisClient = require(path.join(__dirname, "../../shared/redisClient"));
const emailService = require("./emailService");
const smsService = require("./smsService");

const OTP_EXPIRY = 5 * 60;

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOTP(identifier, type) {
  try {
    if (type === "email") {
      if (!/\S+@\S+\.\S+/.test(identifier)) return { error: "Invalid email format" };
    } else if (type === "phone") {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(identifier.replace(/\s/g, ""))) return { error: "Invalid phone number format" };
    } else return { error: "Invalid type. Must be email or phone" };

    const otp = generateOTP();
    const key = `otp:${type}:${identifier}`;
    await redisClient.setEx(key, OTP_EXPIRY, { otp, identifier, type, createdAt: Date.now(), attempts: 0 });

    try {
      if (type === "email") {
        if (!process.env.EMAIL_USER && !process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
          console.log(`[EMAIL NOT CONFIGURED] OTP for ${identifier}: ${otp}`);
          return { success: true, message: "OTP generated. Email not configured - check logs.", warning: "Email service not configured." };
        }
        await emailService.sendOTPEmail(identifier, otp);
      } else if (type === "phone") {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
          console.log(`[SMS NOT CONFIGURED] OTP for ${identifier}: ${otp}`);
          return { success: true, message: "OTP generated. SMS not configured.", warning: "SMS service not configured." };
        }
        await smsService.sendOTPSMS(identifier, otp);
      }
    } catch (sendError) {
      console.error(`Failed to send OTP via ${type}:`, sendError.message);
      return { error: `Failed to send OTP: ${sendError.message}`, debugInfo: process.env.NODE_ENV === "development" ? `OTP: ${otp}` : undefined };
    }
    return { success: true, message: `OTP sent to ${type === "email" ? "email" : "phone"}` };
  } catch (error) {
    return { error: "Failed to send OTP. Please try again." };
  }
}

async function verifyOTP(identifier, type, otp) {
  try {
    const key = `otp:${type}:${identifier}`;
    const storedData = await redisClient.get(key);
    if (!storedData) return { error: "OTP expired or invalid. Please request a new OTP." };
    if (storedData.attempts >= 5) {
      await redisClient.del(key);
      return { error: "Too many failed attempts. Please request a new OTP." };
    }
    if (storedData.otp !== otp) {
      storedData.attempts += 1;
      await redisClient.setEx(key, OTP_EXPIRY, storedData);
      return { error: "Invalid OTP. Please try again." };
    }
    await redisClient.del(key);
    return { success: true, verified: true };
  } catch (error) {
    return { error: "Failed to verify OTP. Please try again." };
  }
}

module.exports = { sendOTP, verifyOTP, generateOTP };
