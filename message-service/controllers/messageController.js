const messageService = require("../services/messageService");
const User = require("../models/userModel");

async function sendMessage(req, res) {
  try {
    const { receiverId, text } = req.body;
    if (!receiverId || !text) return res.status(400).json({ success: false, message: "receiverId and text required" });
    if (text.length > 1000) return res.status(400).json({ success: false, message: "Message too long (max 1000 characters)" });

    const msg = await messageService.sendMessage(req.user, receiverId, text);
    const sender = await User.findById(req.user._id).select("name role profilePic").lean();
    const messageData = {
      ...msg.toObject(),
      sender: sender || { _id: req.user._id, name: req.user.name, role: req.user.role, profilePic: req.user.profilePic },
    };
    res.json({ success: true, data: messageData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getConversation(req, res) {
  try {
    const otherUserId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await messageService.getConversation(req.user._id, otherUserId, page, limit);
    res.json({ success: true, data: result.messages, pagination: result.pagination });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markAsRead(req, res, next) {
  try {
    const msg = await messageService.markMessageRead(req.params.id, req.user._id);
    res.json({ success: true, data: msg });
  } catch (err) {
    next(err);
  }
}

async function getConversations(req, res) {
  try {
    const userId = req.params.userId;
    if (String(userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized" });
    const conversations = await messageService.getConversations(userId);
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function deleteMessage(req, res) {
  try {
    const result = await messageService.deleteMessage(req.params.id, req.user._id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(err.status === 403 ? 403 : 500).json({ success: false, message: err.message });
  }
}

module.exports = { sendMessage, getConversation, markAsRead, getConversations, deleteMessage };
