const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const PORT = process.env.FEED_SERVICE_PORT || 4003;

const feedRoutes = require("./routes/feedRoutes");
const storyRoutes = require("./routes/storyRoutes");
const { generalLimiter } = require(path.join(__dirname, "../shared/rateLimiter"));
const errorHandler = require(path.join(__dirname, "../shared/errorHandler"));
const { parseAllowedOrigins } = require(path.join(__dirname, "../shared/corsOrigins"));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error("CORS blocked"))), credentials: true }));
const jsonLimit = process.env.JSON_BODY_LIMIT || "50mb";
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: jsonLimit }));
app.use(helmet());
app.use(generalLimiter);
app.use("/uploads", express.static(uploadDir));

app.use("/stories", storyRoutes);
app.use(feedRoutes);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Feed Service running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
