const Story = require("../models/storyModel");
const User = require("../models/userModel");
const feedService = require("./feedService");

/** List window for stories (Mongo filter). Media stays in Cloudinary; tune via STORY_MAX_AGE_MS. Default 7d. */
const STORY_MAX_AGE_MS = Number(process.env.STORY_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

async function createStory(userId, file, mediaTypeHint) {
  const { url, type } = await feedService.uploadFile(file, { subfolder: "stories" });
  const mediaType =
    mediaTypeHint === "video" || type === "video" ? "video" : "image";
  const story = await Story.create({ userId, mediaUrl: url, mediaType });
  const populated = await Story.findById(story._id).populate("userId", "name profilePic").lean();
  return populated;
}

function inferMediaTypeFromUrl(mediaUrl, hint) {
  const h = String(hint || "").toLowerCase();
  if (h === "video" || h === "image") return h;
  if (/\.(mp4|mov|webm|m4v|3gp)(\?|#|$)/i.test(mediaUrl)) return "video";
  return "image";
}

/** Persist story when media was already uploaded (e.g. via POST /feed/upload). */
async function createStoryFromMediaUrl(userId, mediaUrl, mediaTypeHint) {
  const mediaType = inferMediaTypeFromUrl(String(mediaUrl), mediaTypeHint);
  const story = await Story.create({ userId, mediaUrl: String(mediaUrl), mediaType });
  return Story.findById(story._id).populate("userId", "name profilePic").lean();
}

async function listGrouped() {
  const since = new Date(Date.now() - STORY_MAX_AGE_MS);
  // Lean + batch User lookup: populate() drops the whole story when the User doc is missing,
  // which made stories "disappear" from the feed even though they still exist in MongoDB.
  const stories = await Story.find({ createdAt: { $gte: since } })
    .sort({ createdAt: -1 })
    .lean();

  const rawIds = stories.map((s) => s.userId).filter(Boolean);
  const uniqueIds = [...new Set(rawIds.map((id) => String(id)))];
  const users =
    uniqueIds.length === 0
      ? []
      : await User.find({ _id: { $in: uniqueIds } } }).select("name profilePic").lean();
  const userById = new Map(users.map((u) => [String(u._id), u]));

  const byUser = new Map();
  for (const s of stories) {
    if (s.userId == null) continue;
    const uid = String(s.userId);
    if (!byUser.has(uid)) {
      const u = userById.get(uid) || {};
      byUser.set(uid, {
        userId: uid,
        userName: u.name || "",
        userAvatar: u.profilePic || "",
        stories: [],
      });
    }
    byUser.get(uid).stories.push({
      _id: s._id,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      createdAt: s.createdAt,
    });
  }

  for (const g of byUser.values()) {
    g.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  return Array.from(byUser.values());
}

async function deleteStory(requestingUserId, storyId) {
  const story = await Story.findById(storyId);
  if (!story) {
    const err = new Error("Story not found");
    err.code = "NOT_FOUND";
    throw err;
  }
  if (String(story.userId) !== String(requestingUserId)) {
    const err = new Error("Not authorized");
    err.code = "FORBIDDEN";
    throw err;
  }
  await Story.deleteOne({ _id: storyId });
  // Do not delete Cloudinary (or local) files here. Story media lives in the stories/ folder and
  // may be refetched by URL; removing CDN assets broke users who expected uploads to persist.
  return { deleted: true };
}

module.exports = { createStory, createStoryFromMediaUrl, listGrouped, deleteStory };
