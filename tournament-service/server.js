const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const PORT = process.env.TOURNAMENT_SERVICE_PORT || 4006;

const tournamentRoutes = require("./routes/tournamentRoutes");
const tournamentRequestRoutes = require("./routes/tournamentRequestRoutes");
const { generalLimiter } = require(path.join(__dirname, "../shared/rateLimiter"));
const errorHandler = require(path.join(__dirname, "../shared/errorHandler"));
const { parseAllowedOrigins } = require(path.join(__dirname, "../shared/corsOrigins"));

const app = express();
app.set("trust proxy", 1);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
app.use(cors({ origin: (o, cb) => (!o || allowedOrigins.includes(o) ? cb(null, true) : cb(new Error("CORS blocked"))), credentials: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(helmet());
app.use(generalLimiter);

app.use("/tournaments", tournamentRoutes);
app.use("/tournament-requests", tournamentRequestRoutes);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Tournament Service running on http://localhost:${PORT}`));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
