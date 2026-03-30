const path = require("path");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");
const { parseAllowedOrigins } = require(path.join(__dirname, "..", "shared", "corsOrigins"));
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const PORT = process.env.PORT || 3000;

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || "http://localhost:4001";
const USER_SERVICE = process.env.USER_SERVICE_URL || "http://localhost:4002";
const FEED_SERVICE = process.env.FEED_SERVICE_URL || "http://localhost:4003";
const MESSAGE_SERVICE = process.env.MESSAGE_SERVICE_URL || "http://localhost:4004";
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4005";
const TOURNAMENT_SERVICE = process.env.TOURNAMENT_SERVICE_URL || "http://localhost:4006";
const UPLOAD_SERVICE = process.env.UPLOAD_SERVICE_URL || "http://localhost:4007";

/** Long timeouts for HD photo/video uploads through the gateway (nginx must allow large bodies too). */
const uploadProxyOptions = {
  proxyTimeout: Number(process.env.PROXY_UPLOAD_TIMEOUT_MS) || 600000,
  timeout: Number(process.env.PROXY_UPLOAD_TIMEOUT_MS) || 600000,
};

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      return callback(new Error("CORS: Not allowed by origin"));
    },
    credentials: true,
  })
);

app.use(helmet());

// IMPORTANT: Proxies must run BEFORE express.json() - otherwise body is consumed and forwarded empty
// Route: /api/auth -> Auth Service (4001)
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
    onError: (err, req, res) => {
      console.error("Auth service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Auth service unavailable" });
    },
  })
);

// Route: /api/users -> User Service (4002)
app.use(
  "/api/users",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/users" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/profile -> User Service (4002)
// pathRewrite fn: v3 passes path after mount (e.g. /123) so we prepend /profile
app.use(
  "/api/profile",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/profile" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/dashboard -> User Service (4002)
app.use(
  "/api/dashboard",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/dashboard" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/search -> User Service (4002)
app.use(
  "/api/search",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/search" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/applications -> User Service (4002)
app.use(
  "/api/applications",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/applications" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/reports -> User Service (4002)
app.use(
  "/api/reports",
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    pathRewrite: (path) => "/reports" + (path || ""),
    onError: (err, req, res) => {
      console.error("User service proxy error:", err.message);
      res.status(502).json({ success: false, message: "User service unavailable" });
    },
  })
);

// Route: /api/feed -> Feed Service (4003)
app.use(
  "/api/feed",
  createProxyMiddleware({
    target: FEED_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/feed": "" },
    ...uploadProxyOptions,
    onError: (err, req, res) => {
      console.error("Feed service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Feed service unavailable" });
    },
  })
);

// Route: /api/stories, /api/story -> Feed Service /stories (4003)
app.use(
  "/api/stories",
  createProxyMiddleware({
    target: FEED_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/stories": "/stories" },
    ...uploadProxyOptions,
    onError: (err, req, res) => {
      console.error("Stories proxy error:", err.message);
      res.status(502).json({ success: false, message: "Feed service unavailable" });
    },
  })
);
app.use(
  "/api/story",
  createProxyMiddleware({
    target: FEED_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/story": "/stories" },
    ...uploadProxyOptions,
    onError: (err, req, res) => {
      console.error("Story (singular) proxy error:", err.message);
      res.status(502).json({ success: false, message: "Feed service unavailable" });
      },
  })
);

// Route: /api/messages -> Message Service (4004)
app.use(
  "/api/messages",
  createProxyMiddleware({
    target: MESSAGE_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/messages": "" },
    onError: (err, req, res) => {
      console.error("Message service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Message service unavailable" });
    },
  })
);

// Route: /api/notifications -> Notification Service (4005)
app.use(
  "/api/notifications",
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/notifications": "" },
    onError: (err, req, res) => {
      console.error("Notification service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Notification service unavailable" });
    },
  })
);

// Route: /api/tournaments -> Tournament Service (4006)
// v3: target includes /tournaments so /api/tournaments -> .../tournaments/, /api/tournaments/123 -> .../tournaments/123
app.use(
  "/api/tournaments",
  createProxyMiddleware({
    target: `${TOURNAMENT_SERVICE}/tournaments`,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error("Tournament service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Tournament service unavailable" });
    },
  })
);

// Route: /api/tournament-requests -> Tournament Service (4006)
app.use(
  "/api/tournament-requests",
  createProxyMiddleware({
    target: `${TOURNAMENT_SERVICE}/tournament-requests`,
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error("Tournament service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Tournament service unavailable" });
    },
  })
);

// Route: /api/upload -> Upload Service (4007)
app.use(
  "/api/upload",
  createProxyMiddleware({
    target: UPLOAD_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/api/upload": "" },
    ...uploadProxyOptions,
    onError: (err, req, res) => {
      console.error("Upload service proxy error:", err.message);
      res.status(502).json({ success: false, message: "Upload service unavailable" });
    },
  })
);

// Body parsers - only for routes the gateway handles directly (e.g. /api/health)
const jsonLimit = process.env.JSON_BODY_LIMIT || "50mb";
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonLimit }));

// Health check
app.get("/api/health", (req, res) =>
  res.json({ success: true, message: "API Gateway OK", timestamp: new Date().toISOString() })
);

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// Serve uploads folder for local file fallback (optional - gateway can serve static)
// app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`  /api/auth -> Auth Service (4001)`);
  console.log(`  /api/users, /api/profile, /api/dashboard, /api/search, /api/applications, /api/reports -> User Service (4002)`);
  console.log(`  /api/feed, /api/stories, /api/story -> Feed Service (4003)`);
  console.log(`  /api/messages -> Message Service (4004)`);
  console.log(`  /api/notifications -> Notification Service (4005)`);
  console.log(`  /api/tournaments, /api/tournament-requests -> Tournament Service (4006)`);
  console.log(`  /api/upload -> Upload Service (4007)`);
});
