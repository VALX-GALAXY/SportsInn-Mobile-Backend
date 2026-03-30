const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  role: { type: String },
  profilePic: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
