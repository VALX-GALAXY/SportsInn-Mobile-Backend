const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const PORT = process.env.UPLOAD_SERVICE_PORT || 4007;

const uploadRoutes = require("./routes/uploadRoutes");
const { generalLimiter } = require(path.join(__dirname, "../shared/rateLimiter"));
const errorHandler = require(path.join(__dirname, "../shared/errorHandler"));
const { parseAllowedOrigins } = require(path.join(__dirname, "../shared/corsOrigins"));

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error("CORS blocked"))), credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(helmet());
app.use(generalLimiter);
app.use("/uploads", express.static(uploadDir));

app.use(uploadRoutes);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Upload Service running on http://localhost:${PORT}`));
