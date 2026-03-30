const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  role: { type: String },
  adminType: { type: String },
  isAdmin: { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
