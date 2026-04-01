const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");
const Post = require("../models/postModel");
const Story = require("../models/storyModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const cloudFolderRoot = () =>
  (process.env.CLOUDINARY_FOLDER || "project-1").replace(/^\/+|\/+$/g, "");

async function uploadFile(file, options = {}) {
  if (!file) throw new Error("No file provided");
  const subfolder = (options.subfolder || "feed").replace(/^\/+|\/+$/g, "");
  const folder = `${cloudFolderRoot()}/${subfolder}`.replace(/\/+/g, "/");
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const res = await cloudinary.uploader.upload(file.path, {
      resource_type: "auto",
      folder,
    });
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    return { url: res.secure_url, type: res.resource_type };
  }
  const url = `${process.env.BASE_URL || "http://localhost:3000"}/uploads/${path.basename(file.path)}`;
  return { url, type: file.mimetype.startsWith("video") ? "video" : "image" };
}

function publicIdFromCloudinaryUrl(url) {
  if (!url || typeof url !== "string") return null;
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let tail = url.slice(idx + marker.length).split("?")[0];
  const segs = tail.split("/").filter(Boolean);
  const keep = [];
  for (const s of segs) {
    if (/^v\d+$/i.test(s)) continue;
    if (s.includes(",")) continue;
    keep.push(s);
  }
  if (keep.length === 0) return null;
  const last = keep[keep.length - 1];
  const dot = last.lastIndexOf(".");
  if (dot > 0) keep[keep.length - 1] = last.slice(0, dot);
  return keep.join("/");
}

async function deleteStoredFeedMedia(post) {
  const mediaUrl = post.mediaUrl;
  if (!mediaUrl || typeof mediaUrl !== "string") return;

  if (process.env.CLOUDINARY_CLOUD_NAME && mediaUrl.includes("res.cloudinary.com")) {
    const publicId = publicIdFromCloudinaryUrl(mediaUrl);
    if (!publicId) return;
    const resourceType = mediaUrl.includes("/video/upload/") ? "video" : "image";
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
      console.warn("Cloudinary feed media delete:", err && err.message ? err.message : err);
    }
    return;
  }

  try {
    const uploadsMarker = "/uploads/";
    const pos = mediaUrl.indexOf(uploadsMarker);
    if (pos === -1) return;
    const rest = decodeURIComponent(mediaUrl.slice(pos + uploadsMarker.length).split("?")[0]);
    const base = path.basename(rest);
    if (!base || base.includes("..")) return;
    const uploadDir = path.join(__dirname, "..", "uploads");
    const fp = path.join(uploadDir, base);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch (err) {
    console.warn("Local feed media delete:", err && err.message ? err.message : err);
  }
}

async function createPost(user, body) {
  const post = new Post({
    authorId: user._id,
    role: user.role,
    caption: body.caption || body.content || "",
    mediaUrl: body.mediaUrl || null,
    mediaType: body.mediaType || null,
    likes: [],
  });
  await post.save();
  const populated = await Post.findById(post._id).populate("authorId", "name role profilePic").lean();
  return populated;
}

async function getFeed(filters = {}, page = 1, limit = 10) {
  const q = {};
  if (filters.role) q.role = filters.role;
  if (filters.type === "text") q.mediaUrl = { $in: [null, ""] };
  else if (filters.type === "image") q.mediaType = "image";
  else if (filters.type === "video") q.mediaType = "video";

  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const docs = await Post.find(q)
    .populate("authorId", "name role profilePic")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit) + 1);

  const hasMore = docs.length > limit;
  const paged = hasMore ? docs.slice(0, limit) : docs;
  return { page, limit: Number(limit), hasMore, nextPage: hasMore ? page + 1 : null, data: paged };
}

async function likePost(user, postId) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  const userIdStr = String(user._id);
  if (!post.likes.some((l) => String(l) === userIdStr)) {
    post.likes.push(user._id);
    await post.save();
    if (String(post.authorId) !== userIdStr) {
      const author = await User.findById(post.authorId).select("name");
      await Notification.create({
        userId: post.authorId,
        type: "like",
        fromUserId: user._id,
        postId: post._id,
        message: `${user.name || "Someone"} liked your post`,
        read: false,
      });
    }
  }
  return { likesCount: post.likes.length };
}

async function unlikePost(user, postId) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  post.likes.pull(user._id);
  await post.save();
  return { likesCount: post.likes.length };
}

async function toggleLike(user, postId) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  if (post.likes.some((l) => String(l) === String(user._id))) return unlikePost(user, postId);
  return likePost(user, postId);
}

async function deletePost(user, postId) {
  const asStory = await Story.findById(postId).select("_id").lean();
  if (asStory) {
    const err = new Error(
      "This id is a story, not a feed post. Use DELETE /api/stories/:id to remove stories."
    );
    err.code = "IS_STORY";
    throw err;
  }
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  if (String(post.authorId) !== String(user._id)) throw new Error("Not allowed");
  await deleteStoredFeedMedia(post);
  await post.deleteOne();
  return { success: true };
}

/** After deleting a story, remove CDN/local file only if no feed post still uses the same URL. */
async function deleteOrphanStoryMedia(mediaUrl) {
  if (!mediaUrl || typeof mediaUrl !== "string") return;
  const n = await Post.countDocuments({ mediaUrl: mediaUrl.trim() });
  if (n > 0) return;
  await deleteStoredFeedMedia({ mediaUrl: mediaUrl.trim() });
}

async function getPersonalizedFeed(userId) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const following = user.following || [];
  const posts = await Post.find({ authorId: { $in: following } })
    .sort({ createdAt: -1 })
    .populate("authorId", "name role profilePic");
  return posts;
}

async function getPersonalizedFeedPaged(userId, page = 1, limit = 15) {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  const following = user.following || [];
  if (!following.length) {
    return {
      page: Math.max(1, page),
      limit: Number(limit),
      hasMore: false,
      nextPage: null,
      data: [],
    };
  }
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const docs = await Post.find({ authorId: { $in: following } })
    .sort({ createdAt: -1 })
    .populate("authorId", "name role profilePic")
    .skip(skip)
    .limit(Number(limit) + 1);
  const hasMore = docs.length > limit;
  const paged = hasMore ? docs.slice(0, limit) : docs;
  const nextPage = hasMore ? page + 1 : null;
  return {
    page: Math.max(1, page),
    limit: Number(limit),
    hasMore,
    nextPage,
    data: paged,
  };
}

async function getPostsByUser(userId, page = 1, limit = 10) {
  const skip = (Math.max(1, page) - 1) * Math.max(1, limit);
  const docs = await Post.find({ authorId: userId })
    .populate("authorId", "name role profilePic")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit) + 1);
  const hasMore = docs.length > limit;
  const paged = hasMore ? docs.slice(0, limit) : docs;
  return { data: paged, page, limit: Number(limit), hasMore };
}

async function addComment(user, postId, text) {
  const post = await Post.findById(postId);
  if (!post) throw new Error("Post not found");
  const comment = { userId: user._id, text, createdAt: new Date() };
  post.comments.push(comment);
  await post.save();

  if (String(post.authorId) !== String(user._id)) {
    await Notification.create({
      userId: post.authorId,
      type: "comment",
      fromUserId: user._id,
      postId: post._id,
      message: `${user.name || "Someone"} commented on your post`,
      read: false,
    });
  }

  const populated = await Post.findById(postId).populate("comments.userId", "name role profilePic").lean();
  const savedComment = populated.comments[populated.comments.length - 1];
  return savedComment;
}

async function getPostById(postId) {
  const post = await Post.findById(postId).populate("authorId", "name role profilePic").populate("comments.userId", "name role profilePic").lean();
  if (!post) throw new Error("Post not found");
  return post;
}

async function getComments(postId, page = 1, limit = 5) {
  const post = await Post.findById(postId).select("comments").populate("comments.userId", "name role profilePic").lean();
  if (!post) throw new Error("Post not found");
  const comments = post.comments || [];
  const skip = (page - 1) * limit;
  const paged = comments.slice(skip, skip + limit);
  return paged;
}

module.exports = {
  uploadFile,
  createPost,
  getFeed,
  getPostById,
  likePost,
  unlikePost,
  toggleLike,
  deletePost,
  deleteOrphanStoryMedia,
  getPersonalizedFeed,
  getPersonalizedFeedPaged,
  getPostsByUser,
  addComment,
  getComments,
};
