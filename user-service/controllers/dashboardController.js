const Tournament = require("../models/tournamentModel");
const User = require("../models/userModel");
const Post = require("../models/postModel");
const Report = require("../models/reportModel");

async function academyFollowers(req, res) {
  try {
    if (req.user.role !== "academy") return res.status(403).json({ success: false, message: "Forbidden" });
    const academyId = req.user._id;
    const players = await User.find({ following: academyId, role: "player" }).select("name email age playingRole");
    res.json({ success: true, data: players });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function scoutSearchPlayers(req, res) {
  try {
    if (req.user.role !== "scout") return res.status(403).json({ success: false, message: "Forbidden" });
    const { maxAge = 25, playingRole, page = 1, limit = 50 } = req.query;
    const query = { role: "player", age: { $lt: parseInt(maxAge) } };
    if (playingRole) query.playingRole = playingRole;
    const players = await User.find(query).limit(parseInt(limit)).skip((page - 1) * limit).select("name email age playingRole");
    res.json({ success: true, data: players });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getDashboardStats(req, res, next) {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.role === "player") {
      const tournaments = await Tournament.find({ "applicants.userId": userId }).lean();
      let selectedCount = 0, rejectedCount = 0, pendingCount = 0;
      tournaments.forEach((t) => {
        const app = t.applicants.find((a) => String(a.userId) === String(userId));
        if (app) {
          if (app.status === "selected") selectedCount++;
          else if (app.status === "rejected") rejectedCount++;
          else pendingCount++;
        }
      });
      const followersCount = user.followers?.length || 0;
      const followingCount = user.following?.length || 0;
      const postsCount = await Post.countDocuments({ authorId: userId });
      return res.json({
        success: true,
        data: {
          tournamentsApplied: tournaments.length,
          selectedCount,
          rejectedCount,
          pendingCount,
          selectionRate: tournaments.length > 0 ? Math.round((selectedCount / tournaments.length) * 100) : 0,
          connectionCount: followersCount + followingCount,
          followersCount,
          followingCount,
          postsCount,
        },
      });
    }

    if (user.role === "academy") {
      const tournaments = await Tournament.find({ createdBy: userId }).lean();
      let totalApplications = 0, totalSelected = 0, totalRejected = 0;
      tournaments.forEach((t) => {
        totalApplications += t.applicants.length;
        t.applicants.forEach((app) => {
          if (app.status === "selected") totalSelected++;
          else if (app.status === "rejected") totalRejected++;
        });
      });
      return res.json({
        success: true,
        data: {
          trainees: user.followers?.length || 0,
          tournamentsHosted: tournaments.length,
          totalApplications,
          totalSelected,
          totalRejected,
          selectionRate: totalApplications > 0 ? Math.round((totalSelected / totalApplications) * 100) : 0,
        },
      });
    }

    if (user.role === "scout") {
      const tournaments = await Tournament.find({ "applicants.decidedBy": userId }).lean();
      let applicationsReviewed = 0, decisionsMade = 0;
      tournaments.forEach((t) => {
        t.applicants.forEach((app) => {
          if (app.decidedBy && String(app.decidedBy) === String(userId)) {
            applicationsReviewed++;
            if (app.status === "selected" || app.status === "rejected") decisionsMade++;
          }
        });
      });
      return res.json({
        success: true,
        data: { applicationsReviewed, decisionsMade, playersScouted: user.followers?.length || 0 },
      });
    }

    if (user.role === "club") {
      const tournamentsHosted = await Tournament.countDocuments({ createdBy: userId });
      return res.json({ success: true, data: { tournamentsHosted, playersRecruited: user.followers?.length || 0 } });
    }

    if (user.role === "admin") {
      const totalUsers = await User.countDocuments();
      const totalTournaments = await Tournament.countDocuments();
      const totalReports = await Report.countDocuments();
      const userBreakdown = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
      return res.json({ success: true, data: { totalUsers, totalTournaments, totalReports, userBreakdown } });
    }

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { academyFollowers, scoutSearchPlayers, getDashboardStats };
