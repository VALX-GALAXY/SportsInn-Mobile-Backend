const path = require("path");
const otpService = require("../services/otpService");
const User = require("../models/userModel");
const { generateTokens } = require(path.join(__dirname, "../../shared/jwtUtils"));

async function sendOTP(req, res) {
  try {
    const { identifier, type } = req.body;
    if (!identifier || !type) return res.status(400).json({ success: false, message: "Identifier and type are required" });
    if (!["email", "phone"].includes(type)) return res.status(400).json({ success: false, message: "Type must be email or phone" });

    const result = await otpService.sendOTP(identifier, type);
    if (result.error) return res.status(400).json({ success: false, message: result.error, ...(result.debugInfo && { debugInfo: result.debugInfo }) });
    res.json({ success: true, message: result.message, ...(result.warning && { warning: result.warning }) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
}

async function verifyOTP(req, res) {
  try {
    const { identifier, type, otp, name, role, gender, sport, cricketRole, age } = req.body;
    if (!identifier || !type || !otp) return res.status(400).json({ success: false, message: "Identifier, type, and OTP are required" });
    if (!["email", "phone"].includes(type)) return res.status(400).json({ success: false, message: "Type must be email or phone" });

    const verifyResult = await otpService.verifyOTP(identifier, type, otp);
    if (verifyResult.error) return res.status(400).json({ success: false, message: verifyResult.error });

    const query = type === "email" ? { email: identifier } : { phone: identifier };
    let user = await User.findOne(query);

    if (user) {
      const { accessToken, refreshToken } = generateTokens(user);
      user.refreshTokens.push(refreshToken);
      await user.save();
      return res.json({
        success: true,
        message: "Login successful",
        data: { accessToken, refreshToken, user: { id: user._id, email: user.email, phone: user.phone, role: user.role, name: user.name } },
      });
    }

    if (!name || !role) return res.status(400).json({ success: false, message: "Name and role required for new user" });
    const validRoles = ["player", "academy", "club", "scout"];
    if (!validRoles.includes(role.toLowerCase())) return res.status(400).json({ success: false, message: "Invalid role" });
    if (role.toLowerCase() === "player" && !sport) return res.status(400).json({ success: false, message: "Sport required for players" });
    if (sport === "Cricket" && !cricketRole) return res.status(400).json({ success: false, message: "Cricket role required when sport is Cricket" });

    const userData = {
      name,
      role: role.toLowerCase(),
      [type]: identifier,
      gender: gender || "Prefer not to say",
      ...(sport && { sport }),
      ...(sport === "Cricket" && cricketRole && { cricketRole }),
      ...(age && { age }),
    };

    const newUser = new User(userData);
    await newUser.save();
    const { accessToken, refreshToken } = generateTokens(newUser);
    newUser.refreshTokens.push(refreshToken);
    await newUser.save();

    return res.json({
      success: true,
      message: "Account created successfully",
      data: {
        accessToken,
        refreshToken,
        user: { id: newUser._id, email: newUser.email, phone: newUser.phone, role: newUser.role, name: newUser.name },
      },
    });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success: false, message: "Email or phone already exists" });
    res.status(500).json({ success: false, message: "Failed to verify OTP." });
  }
}

module.exports = { sendOTP, verifyOTP };
