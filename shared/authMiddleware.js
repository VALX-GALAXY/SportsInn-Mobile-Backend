// shared/authMiddleware.js
const { verifyAccessToken } = require("./jwtUtils");

/**
 * Auth middleware for microservices - verifies JWT and attaches user info to req.user
 * Sets req.user = { _id, id, role } from token payload. Services that need full User fetch it locally.
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = verifyAccessToken(token);

    if (!decoded) {
      console.warn("authMiddleware: token verification failed (null payload)");
      return res.status(403).json({ success: false, message: "Invalid token" });
    }

    const userId = decoded.id || decoded._id || decoded.userId || decoded.sub;
    if (!userId) {
      console.warn("authMiddleware: decoded token missing user id", decoded);
      return res.status(403).json({ success: false, message: "Invalid token payload" });
    }

    req.user = { _id: userId, id: userId, role: decoded.role };
    return next();
  } catch (err) {
    console.error("authMiddleware error:", err && err.message);
    return res.status(403).json({ success: false, message: "Invalid token" });
  }
}

module.exports = authMiddleware;
