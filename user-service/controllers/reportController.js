const Report = require("../models/reportModel");
const Post = require("../models/postModel");

async function createReport(req, res) {
  try {
    const { postId, reason, description } = req.body;
    if (!postId || !reason) return res.status(400).json({ success: false, message: "postId and reason required" });

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const existingReport = await Report.findOne({ postId, reporterId: req.user._id });
    if (existingReport) return res.status(400).json({ success: false, message: "You have already reported this post" });

    const report = await Report.create({
      postId,
      reason,
      description: description || "",
      reporterId: req.user._id,
      status: "pending",
    });
    await report.populate("reporterId", "name email role");
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getAllReports(req, res) {
  try {
    const { page = 1, limit = 10, status = "all" } = req.query;
    const query = status !== "all" ? { status } : {};
    const skip = (page - 1) * limit;
    const reports = await Report.find(query)
      .populate("reporterId", "name email role")
      .populate("postId", "caption authorId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Report.countDocuments(query);
    res.json({
      success: true,
      data: reports,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    if (!status || !["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Valid status required" });
    }

    const report = await Report.findById(id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    report.status = status;
    if (adminNote) report.adminNote = adminNote;
    report.reviewedAt = new Date();
    report.reviewedBy = req.user._id;
    await report.save();
    res.json({ success: true, data: report, message: "Report status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getReportStats(req, res) {
  try {
    const stats = await Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    const totalReports = await Report.countDocuments();
    const recentReports = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    res.json({ success: true, data: { statusBreakdown: stats, totalReports, recentReports } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getReportReasons(req, res) {
  const reasons = {
    post: ["Spam", "Inappropriate content", "Harassment", "False information", "Copyright violation", "Violence", "Hate speech", "Other"],
    user: ["Harassment", "Spam", "Fake account", "Inappropriate behavior", "Hate speech", "Violence", "Other"],
    tournament: ["Fake tournament", "Inappropriate content", "Scam", "False information", "Harassment", "Other"],
  };
  const { type = "post" } = req.query;
  res.json({ success: true, data: reasons[type] || reasons.post });
}

module.exports = { createReport, getAllReports, updateReportStatus, getReportStats, getReportReasons };
