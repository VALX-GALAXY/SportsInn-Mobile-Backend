const User = require("../models/userModel");
const path = require("path");
const roleFields = require(path.join(__dirname, "../../shared/roleFields"));

async function getProfile(id) {
  return User.findById(id).select("-passwordHash -refreshTokens");
}

module.exports = { getProfile };
