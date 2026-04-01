const feedService = require("../services/feedService");
const storyService = require("../services/storyService");

async function uploadMedia(req, res) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
    const forStory = String(req.body?.forStory || "").toLowerCase() === "true";
    const { url, type } = await feedService.uploadFile(file, { subfolder: forStory ? "stories" : "feed" });
    const payload = { url, mediaType: type };
    if (forStory) {
      const userId = req.user._id || req.user.id;
      const hint = String(req.body?.mediaType || type || "").toLowerCase();
      const doc = await storyService.createStoryFromMediaUrl(userId, url, hint);
      const u = doc.userId || {};
      payload.story = {
        _id: doc._id,
        userId: u._id ? String(u._id) : String(userId),
        userName: u.name || "",
        userAvatar: u.profilePic || "",
        mediaUrl: doc.mediaUrl,
        mediaType: doc.mediaType,
        createdAt: doc.createdAt,
      };
    }
    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function createPost(req, res) {
  try {
    const post = await feedService.createPost(req.user, req.body);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getFeed(req, res, next) {
  try {
    const role = req.query.role;
    const type = req.query.type;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await feedService.getFeed({ role, type }, page, limit);
    res.json({ success: true, page: result.page, limit: result.limit, hasMore: result.hasMore, nextPage: result.nextPage, data: result.data });
  } catch (err) {
    next(err);
  }
}

async function likePost(req, res) {
  try {
    const result = await feedService.likePost(req.user, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function unlikePost(req, res) {
  try {
    const result = await feedService.unlikePost(req.user, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function toggleLike(req, res) {
  try {
    const result = await feedService.toggleLike(req.user, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
}

async function deletePost(req, res) {
  try {
    const result = await feedService.deletePost(req.user, req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err.code === "IS_STORY") {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(403).json({ success: false, message: err.message });
  }
}

async function getPersonalizedFeed(req, res) {
  try {
    const hasPaging = req.query.page != null || req.query.limit != null;
    if (!hasPaging) {
      const posts = await feedService.getPersonalizedFeed(req.user._id);
      return res.json({ success: true, data: posts });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const result = await feedService.getPersonalizedFeedPaged(req.user._id, page, limit);
    return res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getPostById(req, res) {
  try {
    const post = await feedService.getPostById(req.params.id);
    res.json({ success: true, data: post });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
}

async function addComment(req, res) {
  try {
    const comment = await feedService.addComment(req.user, req.params.id, req.body.text);
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

async function getComments(req, res) {
  try {
    const { page = 1, limit = 5 } = req.query;
    const comments = await feedService.getComments(req.params.id, page, limit);
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
}

module.exports = {
  uploadMedia,
  createPost,
  getFeed,
  getPostById,
  likePost,
  unlikePost,
  toggleLike,
  deletePost,
  getPersonalizedFeed,
  addComment,
  getComments,
};
