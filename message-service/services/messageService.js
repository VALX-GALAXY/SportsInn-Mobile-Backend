const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

async function sendMessage(sender, receiverId, text) {
  const msg = new Message({ senderId: sender._id, receiverId, text, sentAt: new Date() });
  await msg.save();

  if (String(receiverId) !== String(sender._id)) {
    await Notification.create({
      userId: receiverId,
      type: "message",
      fromUserId: sender._id,
      message: `${sender.name || "Someone"} sent you a message`,
      read: false,
    });
  }
  return msg;
}

async function getConversation(userId, otherUserId, page = 1, limit = 10) {
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const filter = { $or: [{ senderId: userId, receiverId: otherUserId }, { senderId: otherUserId, receiverId: userId }] };
  const total = await Message.countDocuments(filter);
  const messages = await Message.find(filter).sort({ sentAt: 1 }).skip(skip).limit(Number(limit));
  const hasMore = skip + messages.length < total;
  return { messages, pagination: { currentPage: page, nextPage: hasMore ? page + 1 : null, hasMore } };
}

async function markMessageRead(messageId, userId) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");
  if (String(msg.receiverId) !== String(userId)) {
    const err = new Error("Not allowed");
    err.status = 403;
    throw err;
  }
  msg.read = true;
  await msg.save();
  return msg;
}

async function deleteMessage(messageId, userId) {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");
  if (String(msg.senderId) !== String(userId)) {
    const err = new Error("Not allowed");
    err.status = 403;
    throw err;
  }
  await Message.findByIdAndDelete(messageId);
  return { success: true, messageId };
}

async function getConversations(userId) {
  const messages = await Message.find({ $or: [{ senderId: userId }, { receiverId: userId }] }).sort({ sentAt: -1 }).lean();
  const conversationMap = new Map();
  for (const msg of messages) {
    const otherUserId = String(msg.senderId) === String(userId) ? String(msg.receiverId) : String(msg.senderId);
    if (!conversationMap.has(otherUserId)) {
      conversationMap.set(otherUserId, { userId: otherUserId, lastMessage: msg.text, timestamp: msg.sentAt });
    }
  }
  const conversations = [];
  for (const [otherUserId, convData] of conversationMap) {
    const otherUser = await User.findById(otherUserId).select("name email role profilePic").lean();
    if (otherUser) {
      conversations.push({
        id: `conv_${otherUserId}`,
        userId: otherUserId,
        name: otherUser.name || "Unknown",
        avatar: otherUser.profilePic || null,
        profilePic: otherUser.profilePic || null,
        role: otherUser.role || "User",
        lastMessage: convData.lastMessage,
        timestamp: new Date(convData.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    }
  }
  conversations.sort((a, b) => {
    const ta = conversationMap.get(a.userId)?.timestamp || 0;
    const tb = conversationMap.get(b.userId)?.timestamp || 0;
    return new Date(tb) - new Date(ta);
  });
  return conversations;
}

module.exports = { sendMessage, getConversation, markMessageRead, getConversations, deleteMessage };
