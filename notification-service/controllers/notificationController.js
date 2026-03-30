const Notification = require("../models/notificationModel");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user ? String(req.user._id) : req.params.userId;
    if (!userId) return res.status(401).json({ success: false, message: "No user context" });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const notes = await Notification.find({ userId })
      .populate("fromUserId", "name role profilePic")
      .populate("postId", "caption mediaUrl mediaType")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const transformedNotes = notes.map((note) => {
      const fromUser = note.fromUserId || {};
      let title = "Notification";
      let message = note.message || "You have a new notification";
      switch (note.type) {
        case "follow": title = "New Follower"; message = message || `${fromUser.name || "Someone"} started following you`; break;
        case "like": title = "New Like"; message = message || `${fromUser.name || "Someone"} liked your post`; break;
        case "comment": title = "New Comment"; message = message || `${fromUser.name || "Someone"} commented on your post`; break;
        case "application": title = "New Request"; message = message || `${fromUser.name || "Someone"} sent you a request`; break;
        case "decision": title = "Request Update"; message = message || `${fromUser.name || "Someone"} responded to your request`; break;
        case "message": title = "New Message"; message = message || `${fromUser.name || "Someone"} sent you a message`; break;
        case "tournament": title = "Tournament Update"; break;
      }
      return {
        id: note._id.toString(),
        _id: note._id.toString(),
        type: note.type,
        title,
        message,
        isRead: note.read || false,
        read: note.read || false,
        createdAt: note.createdAt,
        fromUser: fromUser ? { id: fromUser._id?.toString(), name: fromUser.name, role: fromUser.role, profilePic: fromUser.profilePic } : null,
        postId: note.postId ? (note.postId._id?.toString() || note.postId.toString()) : null,
        post: note.postId ? { id: note.postId._id?.toString(), caption: note.postId.caption, mediaUrl: note.postId.mediaUrl } : null,
      };
    });

    const unreadCount = await Notification.countDocuments({ userId, read: false });
    const total = await Notification.countDocuments({ userId });

    res.json({
      success: true,
      page,
      limit,
      notifications: transformedNotes,
      data: transformedNotes,
      unreadCount,
      total,
    });
  } catch (err) {
    next(err);
  }
}

async function markOneRead(req, res, next) {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Notification not found" });
    if (String(note.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not allowed" });
    note.read = true;
    await note.save();
    res.json({ success: true, data: note });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    const modified = result.modifiedCount ?? result.nModified ?? 0;
    res.json({ success: true, data: { modifiedCount: modified }, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ success: false, message: "Notification not found" });
    if (String(note.userId) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not allowed" });
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markOneRead, markAllRead, getUnreadCount, deleteNotification };
