const storyService = require("../services/storyService");

function storyPayload(doc, userId) {
  const u = doc.userId || {};
  return {
    _id: doc._id,
    userId: u._id ? String(u._id) : String(userId),
    userName: u.name || "",
    userAvatar: u.profilePic || "",
    mediaUrl: doc.mediaUrl,
    mediaType: doc.mediaType,
    createdAt: doc.createdAt,
  };
}

async function createStory(req, res) {
  try {
    const img = req.files?.image?.[0];
    const med = req.files?.media?.[0];
    if (img && med) {
      return res.status(400).json({ success: false, message: "Send only one file (image or media)" });
    }
    const file = img || med;
    if (!file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const mediaType = (req.body?.mediaType || "").toString().toLowerCase();
    const userId = req.user._id || req.user.id;
    const doc = await storyService.createStory(userId, file, mediaType);
    res.status(201).json({ success: true, data: storyPayload(doc, userId) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Story create failed" });
  }
}

/** JSON body: { mediaUrl, mediaType? } after uploading file to /feed/upload. */
async function createStoryFromBody(req, res) {
  try {
    const { mediaUrl, mediaType } = req.body || {};
    if (!mediaUrl || typeof mediaUrl !== "string") {
      return res.status(400).json({ success: false, message: "mediaUrl required" });
    }
    const userId = req.user._id || req.user.id;
    const doc = await storyService.createStoryFromMediaUrl(userId, mediaUrl.trim(), mediaType);
    res.status(201).json({ success: true, data: storyPayload(doc, userId) });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || "Story create failed" });
  }
}

async function listStories(req, res, next) {
  try {
    const data = await storyService.listGrouped();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function deleteStory(req, res) {
  try {
    const userId = req.user._id || req.user.id;
    await storyService.deleteStory(userId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res.status(404).json({ success: false, message: err.message });
    }
    if (err.code === "FORBIDDEN") {
      return res.status(403).json({ success: false, message: err.message });
    }
    res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
}

module.exports = { createStory, createStoryFromBody, listStories, deleteStory };
