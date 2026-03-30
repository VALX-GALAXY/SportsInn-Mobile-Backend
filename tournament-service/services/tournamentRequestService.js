const TournamentRequest = require("../models/tournamentRequestModel");
const Tournament = require("../models/tournamentModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");

async function createTournamentRequest(user, tournamentData) {
  if (user.role !== "player") {
    const err = new Error("Only players can create tournament requests");
    err.status = 403;
    throw err;
  }

  const request = await TournamentRequest.create({
    requestedBy: user._id,
    tournamentData: {
      title: tournamentData.title,
      entryFee: tournamentData.entryFee || 0,
      location: tournamentData.location || "",
      type: tournamentData.type || "Open",
      vacancies: tournamentData.vacancies || 0,
      deadline: tournamentData.deadline ? new Date(tournamentData.deadline) : null,
      prizePool: tournamentData.prizePool || 0,
      startDate: tournamentData.startDate ? new Date(tournamentData.startDate) : null,
      description: tournamentData.description || "",
    },
    status: "pending",
  });

  const playerAdmins = await User.find({ role: "admin", adminType: "player" }).select("_id");
  if (playerAdmins.length) {
    await Notification.insertMany(
      playerAdmins.map((admin) => ({
        userId: admin._id,
        message: `${user.name || "A player"} requested to create tournament: ${tournamentData.title}`,
        type: "tournament",
        fromUserId: user._id,
        read: false,
      }))
    );
  }
  return request;
}

async function getTournamentRequests(user) {
  const isAdmin = user.role === "admin" || user.isAdmin;
  const isPlayerAdmin = isAdmin && (!user.adminType || user.adminType === "player");

  if (isPlayerAdmin) {
    return TournamentRequest.find()
      .populate("requestedBy", "name email profilePic")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }
  if (user.role === "player") {
    return TournamentRequest.find({ requestedBy: user._id })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();
  }
  return [];
}

async function getTournamentRequestById(id) {
  return TournamentRequest.findById(id)
    .populate("requestedBy", "name email profilePic")
    .populate("reviewedBy", "name email")
    .lean();
}

async function approveTournamentRequest(requestId, adminUser) {
  const isAdmin = adminUser.role === "admin" || adminUser.isAdmin;
  const isPlayerAdmin = isAdmin && (!adminUser.adminType || adminUser.adminType === "player");
  if (!isPlayerAdmin) {
    const err = new Error("Only player admins can approve tournament requests");
    err.status = 403;
    throw err;
  }

  const request = await TournamentRequest.findById(requestId);
  if (!request) {
    const err = new Error("Tournament request not found");
    err.status = 404;
    throw err;
  }
  if (request.status !== "pending") {
    const err = new Error("Tournament request has already been processed");
    err.status = 400;
    throw err;
  }

  request.status = "approved";
  request.reviewedBy = adminUser._id;
  request.reviewedAt = new Date();
  await request.save();

  const tournament = await Tournament.create({
    title: request.tournamentData.title,
    entryFee: request.tournamentData.entryFee,
    location: request.tournamentData.location,
    type: request.tournamentData.type,
    vacancies: request.tournamentData.vacancies,
    deadline: request.tournamentData.deadline,
    prizePool: request.tournamentData.prizePool,
    startDate: request.tournamentData.startDate,
    createdBy: request.requestedBy,
  });

  await Notification.create({
    userId: request.requestedBy,
    message: `Your tournament request "${request.tournamentData.title}" has been approved!`,
    type: "tournament",
    fromUserId: adminUser._id,
    read: false,
  });

  const players = await User.find({ role: "player" }).select("_id");
  if (players.length) {
    await Notification.insertMany(
      players.map((p) => ({ userId: p._id, message: `New tournament: ${tournament.title}`, type: "tournament", read: false }))
    );
  }

  return { request, tournament };
}

async function rejectTournamentRequest(requestId, adminUser, reason) {
  const isAdmin = adminUser.role === "admin" || adminUser.isAdmin;
  const isPlayerAdmin = isAdmin && (!adminUser.adminType || adminUser.adminType === "player");
  if (!isPlayerAdmin) {
    const err = new Error("Only player admins can reject tournament requests");
    err.status = 403;
    throw err;
  }

  const request = await TournamentRequest.findById(requestId);
  if (!request) {
    const err = new Error("Tournament request not found");
    err.status = 404;
    throw err;
  }
  if (request.status !== "pending") {
    const err = new Error("Tournament request has already been processed");
    err.status = 400;
    throw err;
  }

  request.status = "rejected";
  request.reviewedBy = adminUser._id;
  request.reviewedAt = new Date();
  request.rejectionReason = reason || "No reason provided";
  await request.save();

  await Notification.create({
    userId: request.requestedBy,
    message: `Your tournament request "${request.tournamentData.title}" has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
    type: "tournament",
    fromUserId: adminUser._id,
    read: false,
  });

  return request;
}

module.exports = {
  createTournamentRequest,
  getTournamentRequests,
  getTournamentRequestById,
  approveTournamentRequest,
  rejectTournamentRequest,
};
