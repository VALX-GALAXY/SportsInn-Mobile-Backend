const Tournament = require("../models/tournamentModel");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");

async function createTournament(user, data) {
  const tournamentData = {
    title: data.title,
    entryFee: data.entryFee || 0,
    location: data.location || "",
    type: data.type || "Open",
    vacancies: data.vacancies || 0,
    deadline: data.deadline ? new Date(data.deadline) : null,
    createdBy: user._id,
    image: data.image || data.imageUrl || null,
    imageUrl: data.imageUrl || data.image || null,
    prizePool: data.prizePool !== undefined && data.prizePool !== null ? parseFloat(data.prizePool) || 0 : 0,
    startDate: data.startDate && !isNaN(new Date(data.startDate)) ? new Date(data.startDate) : undefined,
  };
  const doc = await Tournament.create(tournamentData);

  const players = await User.find({ role: "player" }).select("_id");
  if (players.length) {
    await Notification.insertMany(
      players.map((p) => ({ userId: p._id, message: `New tournament: ${doc.title}`, type: "tournament", read: false }))
    );
  }
  return doc;
}

async function listTournaments(page = 1, limit = 10, filters = {}) {
  const query = {};
  if (filters.status && filters.status !== "all") query.status = filters.status === "open" || filters.status === "Open" ? "Open" : "Closed";
  if (filters.type && filters.type !== "all") query.type = { $regex: filters.type, $options: "i" };
  if (filters.location && filters.location !== "all") query.location = { $regex: filters.location, $options: "i" };
  if (filters.minFee !== undefined && filters.minFee !== "") query.entryFee = { ...(query.entryFee || {}), $gte: Number(filters.minFee) };
  if (filters.maxFee !== undefined && filters.maxFee !== "") query.entryFee = { ...(query.entryFee || {}), $lte: Number(filters.maxFee) };
  if (filters.search && filters.search.trim()) {
    query.$or = [
      { title: { $regex: filters.search, $options: "i" } },
      { location: { $regex: filters.search, $options: "i" } },
      { type: { $regex: filters.search, $options: "i" } },
    ];
  }

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Number(limit));
  const skip = (p - 1) * l;

  const docs = await Tournament.find(query)
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(l + 1)
    .lean();

  const hasMore = docs.length > l;
  const paged = hasMore ? docs.slice(0, l) : docs;
  return { page: p, limit: l, hasMore, nextPage: hasMore ? p + 1 : null, data: paged };
}

async function getTournamentById(id) {
  return Tournament.findById(id).populate("createdBy", "name email").lean();
}

async function applyTournament(user, tournamentId) {
  const t = await Tournament.findById(tournamentId);
  if (!t) {
    const e = new Error("Tournament not found");
    e.status = 404;
    throw e;
  }
  if (t.deadline && new Date() > new Date(t.deadline)) {
    const err = new Error("Application deadline has passed");
    err.status = 400;
    throw err;
  }
  const already = t.applicants.find((a) => String(a.userId) === String(user._id));
  if (already) {
    const err = new Error("Already applied to this tournament");
    err.status = 400;
    throw err;
  }
  t.applicants.push({ userId: user._id, status: "applied", appliedAt: new Date() });
  await t.save();

  const author = await User.findById(t.createdBy).select("name");
  await Notification.create({
    userId: t.createdBy,
    message: `${user.name || "A player"} applied to ${t.title}`,
    type: "application",
    fromUserId: user._id,
    read: false,
  });
  return t;
}

async function getUserApplications(userId) {
  const docs = await Tournament.find({ "applicants.userId": userId }).sort({ createdAt: -1 }).lean();
  return docs.map((d) => {
    const app = d.applicants.find((a) => String(a.userId) === String(userId));
    return { tournament: d, application: app };
  });
}

async function decideApplication(tournamentId, playerId, decision, adminUser) {
  const t = await Tournament.findById(tournamentId);
  if (!t) {
    const err = new Error("Tournament not found");
    err.status = 404;
    throw err;
  }
  const applicant = t.applicants.find((a) => String(a.userId) === String(playerId));
  if (!applicant) {
    const err = new Error("Application not found");
    err.status = 404;
    throw err;
  }
  applicant.status = decision;
  applicant.decidedAt = new Date();
  applicant.decidedBy = adminUser._id;
  await t.save();

  const msg = decision === "selected" ? `You have been selected for ${t.title}` : `You have been rejected for ${t.title}`;
  await Notification.create({
    userId: playerId,
    message: msg,
    type: "decision",
    fromUserId: adminUser._id,
    read: false,
  });
  return t;
}

module.exports = { createTournament, listTournaments, getTournamentById, applyTournament, getUserApplications, decideApplication };
