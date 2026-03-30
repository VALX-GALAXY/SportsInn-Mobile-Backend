const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const PORT = process.env.USER_SERVICE_PORT || 4002;

const userRoutes = require("./routes/userRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const searchRoutes = require("./routes/searchRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const reportRoutes = require("./routes/reportRoutes");

const { generalLimiter } = require(path.join(__dirname, "../shared/rateLimiter"));
const errorHandler = require(path.join(__dirname, "../shared/errorHandler"));
const { parseAllowedOrigins } = require(path.join(__dirname, "../shared/corsOrigins"));

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(
  cors({
    origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("CORS blocked"))),
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(helmet());
app.use(generalLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/users", userRoutes);
app.use("/profile", profileRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/search", searchRoutes);
app.use("/applications", applicationRoutes);
app.use("/reports", reportRoutes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`User Service running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
