const Application = require("../models/applicationModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

async function createApplication(req, res) {
  try {
    const fromUserId = req.user._id;
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ success: false, message: "toUserId required" });

    const toUser = await User.findById(toUserId);
    if (!toUser) return res.status(404).json({ success: false, message: "Recipient not found" });

    const app = await Application.create({ fromUserId, toUserId, status: "pending" });
    const fromUser = await User.findById(fromUserId).select("name role");
    await Notification.create({
      userId: toUserId,
      type: "application",
      fromUserId,
      message: `${fromUser.name} sent you a request`,
      read: false,
    });
    res.status(201).json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getSentApplications(req, res) {
  try {
    const apps = await Application.find({ fromUserId: req.user._id }).populate("toUserId", "name email role");
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getReceivedApplications(req, res) {
  try {
    const apps = await Application.find({ toUserId: req.user._id }).populate("fromUserId", "name email role");
    res.json({ success: true, data: apps });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["pending", "accepted", "rejected"].includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });
    if (String(app.toUserId) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    app.status = status;
    await app.save();

    if (status !== "pending") {
      await Notification.create({
        userId: app.fromUserId,
        type: "decision",
        fromUserId: req.user._id,
        message: `${req.user.name} ${status === "accepted" ? "accepted" : "rejected"} your request`,
        read: false,
      });
    }
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { createApplication, getSentApplications, getReceivedApplications, updateApplicationStatus };
