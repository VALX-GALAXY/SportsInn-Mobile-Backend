const path = require("path");
const { verifyAccessToken } = require(path.join(__dirname, "../../shared/jwtUtils"));
const User = require("../models/userModel");

async function authWithUser(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = verifyAccessToken(token);
    if (!decoded) return res.status(403).json({ success: false, message: "Invalid token" });

    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
    if (!userId) return res.status(403).json({ success: false, message: "Invalid token payload" });

    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: "Invalid token" });
  }
}

module.exports = authWithUser;
