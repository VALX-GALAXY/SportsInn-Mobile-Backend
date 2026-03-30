const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    sparse: true,
    required: function () { return !this.phone; },
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    required: function () { return !this.email; },
  },
  passwordHash: {
    type: String,
    required: function () { return !this.googleId && !this.phone; },
  },
  googleId: { type: String, default: null },
  role: { type: String, enum: ["player", "academy", "club", "scout", "admin"], required: true },
  adminType: { type: String, enum: ["player", "academy", "club", "scout"] },
  gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"], default: "Prefer not to say" },
  sport: { type: String, required: function () { return this.role !== "admin"; } },
  cricketRole: { type: String, enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"], required: function () { return this.sport === "Cricket"; } },
  isAdmin: { type: Boolean, default: false },
  gallery: { type: [String], default: [] },
  profilePic: { type: String, default: "" },
  bio: { type: String, default: "" },
  age: Number,
  playingRole: String,
  location: String,
  contactInfo: String,
  organization: String,
  experience: String,
  refreshTokens: [String],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  stats: { matches: { type: Number, default: 0 }, runs: { type: Number, default: 0 }, wickets: { type: Number, default: 0 } },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
