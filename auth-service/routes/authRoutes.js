const express = require("express");
const router = express.Router();
const { signup, login, refresh, logout, adminLogin, adminSignup, googleAuth, validateToken } = require("../controllers/authController");
const { sendOTP, verifyOTP } = require("../controllers/otpController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post("/admin/login", adminLogin);
router.post("/admin/signup", adminSignup);
router.post("/google", googleAuth);
router.get("/validate", validateToken);
router.post("/otp/send", sendOTP);
router.post("/otp/verify", verifyOTP);

module.exports = router;
