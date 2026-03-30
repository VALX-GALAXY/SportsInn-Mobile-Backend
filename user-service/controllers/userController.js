const mongoose = require("mongoose");
const path = require("path");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

async function followUser(req, res) {
  try {
    const targetId = req.params.id;
    const userId = req.user._id.toString();

    if (userId === targetId) return res.status(400).json({ success: false, message: "Cannot follow yourself" });

    const user = await User.findById(userId);
    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });

    const isFollowing = user.following.some((f) => String(f) === String(targetId));

    if (isFollowing) {
      user.following.pull(targetId);
      target.followers.pull(userId);
    } else {
      user.following.push(targetId);
      target.followers.push(userId);
      await Notification.create({
        userId: target._id,
        type: "follow",
        fromUserId: user._id,
        message: `${user.name} started following you`,
        read: false,
      });
    }

    await user.save();
    await target.save();

    res.json({
      success: true,
      message: isFollowing ? "Unfollowed" : "Followed",
      isFollowing: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFollowers(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid user id" });
    const user = await User.findById(id).populate("followers", "name email role");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.followers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getFollowing(req, res) {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid user id" });
    const user = await User.findById(id).populate("following", "name email role profilePic bio");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.following });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function searchUsers(req, res) {
  try {
    const { q } = req.query;
    let query = {};
    if (q && q.trim()) {
      query = {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { role: { $regex: q, $options: "i" } },
        ],
      };
    }
    const users = await User.find(query).select("-passwordHash -refreshTokens").limit(100).lean();
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllUsers(req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    const limit = parseInt(req.query.limit) || 100;
    const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
    const users = await User.find(query).select("-passwordHash -refreshTokens").limit(limit).sort({ name: 1 }).lean();
    res.json({ success: true, data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getUserStats(req, res) {
  try {
    const user = await User.findById(req.params.id).select("stats name");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user.stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { followUser, getFollowers, getFollowing, searchUsers, getUserStats, getAllUsers };
