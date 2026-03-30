const path = require("path");
const authService = require("../services/authService");
const { verifyIdToken } = require(path.join(__dirname, "../utils/googleVerify"));

async function signup(req, res) {
  const result = await authService.signup(req.body);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, data: result.user, message: "User registered successfully" });
}

async function login(req, res) {
  const result = await authService.login(req.body);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, data: result, message: "Login successful" });
}

async function adminSignup(req, res) {
  const result = await authService.adminSignup(req.body);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
    message: "Admin registered successfully",
  });
}

async function adminLogin(req, res) {
  const result = await authService.adminLogin(req.body);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, data: result, message: "Admin login successful" });
}

async function refresh(req, res) {
  const result = await authService.refresh(req.body.refreshToken);
  if (result.error) return res.status(401).json({ success: false, message: result.error });
  res.json({ success: true, data: result, message: "Token refreshed" });
}

async function logout(req, res) {
  const result = await authService.logout(req.body?.refreshToken);
  if (result.error) return res.status(400).json({ success: false, message: result.error });
  res.json({ success: true, message: "Logged out successfully" });
}

async function validateToken(req, res) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }
    const token = authHeader.split(" ")[1].trim();
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const User = require("../models/userModel");
    const user = await User.findById(decoded.id).select("-passwordHash -refreshTokens");
    if (!user) return res.status(401).json({ success: false, message: "User not found" });
    return res.json({
      success: true,
      message: "Token is valid",
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        tokenInfo: { expiresAt: new Date(decoded.exp * 1000), issuedAt: new Date(decoded.iat * 1000) },
      },
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: err.message });
  }
}

async function googleAuth(req, res) {
  try {
    const { idToken, role, sport, gender = "Prefer not to say", cricketRole } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: "idToken required" });

    const payload = await verifyIdToken(idToken);
    if (!payload) return res.status(400).json({ success: false, message: "Invalid Google token" });
    if (!payload.email_verified) return res.status(400).json({ success: false, message: "Google email not verified" });

    const User = require("../models/userModel");
    const existingUser = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    let sportToUse = sport || existingUser?.sport;
    if (!existingUser && !sport) return res.status(400).json({ success: false, message: "Sport is required for registration" });
    if (sportToUse === "Cricket" && !cricketRole && !existingUser?.cricketRole) {
      return res.status(400).json({ success: false, message: "Cricket role is required when sport is Cricket" });
    }

    const result = await authService.loginWithGoogle({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      role: role || existingUser?.role,
      sport: sportToUse,
      gender,
      cricketRole: sportToUse === "Cricket" ? (cricketRole || existingUser?.cricketRole) : undefined,
    });

    if (result.error) return res.status(400).json({ success: false, message: result.error });
    return res.json({ success: true, data: result, message: "Google login successful" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || "Google auth failed" });
  }
}

module.exports = { signup, login, adminSignup, adminLogin, refresh, logout, googleAuth, validateToken };
