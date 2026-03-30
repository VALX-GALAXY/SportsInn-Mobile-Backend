const User = require("../models/userModel");
const Tournament = require("../models/tournamentModel");
const Post = require("../models/postModel");
const Message = require("../models/messageModel");

async function playerAnalytics(req, res) {
  try {
    const playerId = req.params.id;
    const user = await User.findById(playerId);
    if (!user || user.role !== "player") return res.status(404).json({ success: false, message: "Player not found" });

    const tournaments = await Tournament.find({ "applicants.userId": playerId }).lean();
    let selectedCount = 0, rejectedCount = 0;
    tournaments.forEach((t) => {
      const app = t.applicants.find((a) => String(a.userId) === String(playerId));
      if (app) {
        if (app.status === "selected") selectedCount++;
        else if (app.status === "rejected") rejectedCount++;
      }
    });

    const posts = await Post.find({ authorId: playerId }).select("likes comments");
    const totalLikes = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);

    const data = {
      tournamentPerformance: {
        tournamentsApplied: tournaments.length,
        selectedCount,
        rejectedCount,
        selectionRate: tournaments.length > 0 ? Math.round((selectedCount / tournaments.length) * 100) : 0,
      },
      socialEngagement: {
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        postsCount: posts.length,
        totalLikes,
        totalComments,
      },
      activity: {
        messagesSent: await Message.countDocuments({ senderId: playerId }),
        messagesReceived: await Message.countDocuments({ receiverId: playerId }),
        totalConnections: (user.followers?.length || 0) + (user.following?.length || 0),
      },
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function academyAnalytics(req, res) {
  try {
    const academyId = req.params.id;
    const user = await User.findById(academyId);
    if (!user || user.role !== "academy") return res.status(404).json({ success: false, message: "Academy not found" });

    const tournaments = await Tournament.find({ createdBy: academyId }).lean();
    let totalApplications = 0, totalSelected = 0, totalRejected = 0;
    tournaments.forEach((t) => {
      totalApplications += t.applicants.length;
      t.applicants.forEach((app) => {
        if (app.status === "selected") totalSelected++;
        else if (app.status === "rejected") totalRejected++;
      });
    });

    const data = {
      tournamentHosting: {
        tournamentsHosted: tournaments.length,
        totalApplications,
        totalSelected,
        totalRejected,
        selectionRate: totalApplications > 0 ? Math.round((totalSelected / totalApplications) * 100) : 0,
      },
      trainees: { traineesCount: user.followers?.length || 0 },
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function scoutAnalytics(req, res) {
  try {
    const scoutId = req.params.id;
    const user = await User.findById(scoutId);
    if (!user || user.role !== "scout") return res.status(404).json({ success: false, message: "Scout not found" });

    const tournaments = await Tournament.find({ "applicants.decidedBy": scoutId }).lean();
    let applicationsReviewed = 0, decisionsMade = 0;
    tournaments.forEach((t) => {
      t.applicants.forEach((app) => {
        if (app.decidedBy && String(app.decidedBy) === String(scoutId)) {
          applicationsReviewed++;
          if (app.status === "selected" || app.status === "rejected") decisionsMade++;
        }
      });
    });

    const data = {
      scoutingActivity: { applicationsReviewed, decisionsMade },
      network: {
        playersScouted: user.followers?.length || 0,
        messagesSent: await Message.countDocuments({ senderId: scoutId }),
        messagesReceived: await Message.countDocuments({ receiverId: scoutId }),
      },
    };
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { playerAnalytics, academyAnalytics, scoutAnalytics };
