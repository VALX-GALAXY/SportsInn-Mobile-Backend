const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const User = require("../models/userModel");
const profileService = require("../services/profileService");
const roleFields = require(path.join(__dirname, "../../shared/roleFields"));
const cloudinary = require("../config/cloudinary");
const Post = require("../models/postModel");

async function getProfile(req, res) {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid user id" });
  const user = await profileService.getProfile(id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
}

async function updateProfile(req, res, next) {
  try {
    const id = req.params.id;
    if (String(id) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "You can only update your own profile" });
    }

    const allowed = roleFields[req.user.role] || [];
    const protectedFields = ["password", "email", "role", "refreshTokens", "_id", "isAdmin"];
    const updates = {};

    if (req.body.profilePic !== undefined) updates.profilePic = req.body.profilePic;
    if (req.body.gender) {
      if (!["Male", "Female", "Other", "Prefer not to say"].includes(req.body.gender)) {
        return res.status(400).json({ success: false, message: "Invalid gender value" });
      }
      updates.gender = req.body.gender;
    }
    if (req.body.sport) {
      updates.sport = req.body.sport;
      if (req.body.sport === "Cricket") {
        if (!req.body.cricketRole || !["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].includes(req.body.cricketRole)) {
          return res.status(400).json({ success: false, message: "Invalid cricket role" });
        }
        updates.cricketRole = req.body.cricketRole;
      } else updates.cricketRole = undefined;
    }

    for (const key of Object.keys(req.body)) {
      if (protectedFields.includes(key)) continue;
      if (allowed.length && !allowed.includes(key) && !["name", "location", "contactInfo", "bio", "profilePic", "gender", "sport", "cricketRole"].includes(key)) continue;
      updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("-passwordHash -refreshTokens");
    res.json({ success: true, data: user, message: "Profile updated" });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePicture(req, res, next) {
  try {
    const id = req.params.id;
    if (String(id) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    let url;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const result = await cloudinary.uploader.upload(file.path, { resource_type: "image" });
      url = result.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } else {
      url = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/${path.basename(file.path)}`;
    }

    const user = await User.findByIdAndUpdate(id, { profilePic: url }, { new: true }).select("-passwordHash -refreshTokens");
    res.json({ success: true, data: user, message: "Profile picture updated", profilePic: url });
  } catch (err) {
    next(err);
  }
}

async function getGallery(req, res) {
  try {
    const user = await User.findById(req.params.id).select("gallery");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.gallery || [] });
  } catch (err) {
    next(err);
  }
}

async function addGalleryImage(req, res) {
  try {
    const id = req.params.id;
    if (String(id) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });

    let url;
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      const r = await cloudinary.uploader.upload(file.path, { resource_type: "image", folder: `gallery/${id}` });
      url = r.secure_url;
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } else {
      url = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/${path.basename(file.path)}`;
    }

    const user = await User.findByIdAndUpdate(id, { $push: { gallery: url } }, { new: true }).select("-passwordHash -refreshTokens");
    res.json({ success: true, data: user.gallery, message: "Image added", url });
  } catch (err) {
    next(err);
  }
}

async function removeGalleryImage(req, res) {
  try {
    const id = req.params.id;
    if (String(id) !== String(req.user._id) && req.user.role !== "admin") return res.status(403).json({ success: false, message: "Not allowed" });
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "url required" });
    const user = await User.findByIdAndUpdate(id, { $pull: { gallery: url } }, { new: true }).select("-passwordHash -refreshTokens");
    res.json({ success: true, data: user.gallery, message: "Image removed" });
  } catch (err) {
    next(err);
  }
}

async function getPostsByUser(req, res) {
  try {
    const posts = await Post.find({ authorId: req.params.id }).populate("authorId", "name role profilePic").sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, uploadProfilePicture, getGallery, addGalleryImage, removeGalleryImage, getPostsByUser };
