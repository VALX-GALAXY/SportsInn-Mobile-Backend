const User = require("../models/userModel");
const Post = require("../models/postModel");
const Tournament = require("../models/tournamentModel");
const path = require("path");
const redis = require(path.join(__dirname, "../../shared/redisClient"));

async function searchUsers(req, res) {
  try {
    const { q, type = "all", role, location, ageMin, ageMax, page = 1, limit = 10 } = req.query;
    const cacheKey = `search:${type}:${q || "all"}:${role || "all"}:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached, cached: true });
    } catch (_) {}

    let results = {};

    if (type === "users" || type === "all") {
      const userQuery = {};
      if (q) userQuery.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }, { bio: { $regex: q, $options: "i" } }];
      if (role) userQuery.role = role;
      if (location) userQuery.location = { $regex: location, $options: "i" };
      if (ageMin || ageMax) {
        userQuery.age = {};
        if (ageMin) userQuery.age.$gte = Number(ageMin);
        if (ageMax) userQuery.age.$lte = Number(ageMax);
      }
      results.users = await User.find(userQuery).select("-passwordHash -refreshTokens").sort({ name: 1 }).limit(Number(limit)).lean();
    }

    if (type === "posts" || type === "all") {
      const postQuery = q ? { caption: { $regex: q, $options: "i" } } : {};
      results.posts = await Post.find(postQuery).populate("authorId", "name role profilePic").sort({ createdAt: -1 }).limit(Number(limit)).lean();
    }

    if (type === "tournaments" || type === "all") {
      const tournamentQuery = q ? { $or: [{ title: { $regex: q, $options: "i" } }, { location: { $regex: q, $options: "i" } }] } : {};
      results.tournaments = await Tournament.find(tournamentQuery).populate("createdBy", "name role").sort({ createdAt: -1 }).limit(Number(limit)).lean();
    }

    try {
      await redis.setEx(cacheKey, 300, results);
    } catch (_) {}

    res.json({ success: true, data: results, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAutocompleteSuggestions(req, res) {
  try {
    const { q, type = "users" } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: [] });

    let suggestions = [];
    if (type === "users") {
      const users = await User.find({
        $or: [{ name: { $regex: `^${q}`, $options: "i" } }, { email: { $regex: `^${q}`, $options: "i" } }],
      })
        .select("name email role profilePic")
        .limit(5)
        .lean();
      suggestions = users.map((u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, type: u.role, avatar: u.profilePic || null }));
    } else if (type === "tournaments") {
      const tournaments = await Tournament.find({ title: { $regex: `^${q}`, $options: "i" } }).select("title location type").limit(5).lean();
      suggestions = tournaments.map((t) => ({ id: t._id, title: t.title, location: t.location, type: t.type, searchType: "tournament" }));
    }
    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getTrendingContent(req, res) {
  try {
    const cacheKey = "trending:content";
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached, cached: true });
    } catch (_) {}

    const trendingTournaments = await Tournament.aggregate([
      { $addFields: { applicantCount: { $size: "$applicants" } } },
      { $sort: { applicantCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "createdBy", foreignField: "_id", as: "creator" } },
      { $unwind: "$creator" },
      { $project: { title: 1, location: 1, entryFee: 1, applicantCount: 1, creator: { name: 1, role: 1 } } },
    ]);

    const trendingPosts = await Post.aggregate([
      { $addFields: { likesCount: { $size: "$likes" } } },
      { $sort: { likesCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "author" } },
      { $unwind: "$author" },
      { $project: { caption: 1, likesCount: 1, author: { name: 1, role: 1, profilePic: 1 } } },
    ]);

    const trendingData = { tournaments: trendingTournaments, posts: trendingPosts };
    try {
      await redis.setEx(cacheKey, 600, trendingData);
    } catch (_) {}
    res.json({ success: true, data: trendingData, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { searchUsers, getAutocompleteSuggestions, getTrendingContent };
