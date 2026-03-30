const tournamentService = require("../services/tournamentService");

async function createTournament(req, res, next) {
  try {
    const doc = await tournamentService.createTournament(req.user, req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function listTournaments(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      type: req.query.type,
      location: req.query.location,
      minFee: req.query.minFee,
      maxFee: req.query.maxFee,
      search: req.query.search,
    };
    const result = await tournamentService.listTournaments(req.query.page || 1, req.query.limit || 10, filters);
    res.json({ success: true, page: result.page, limit: result.limit, data: result.data });
  } catch (err) {
    next(err);
  }
}

async function getTournament(req, res, next) {
  try {
    const doc = await tournamentService.getTournamentById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Tournament not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function applyTournament(req, res, next) {
  try {
    const tournamentId = req.params.id || req.body.tournamentId;
    const doc = await tournamentService.applyTournament(req.user, tournamentId);
    res.json({ success: true, data: doc, message: "Applied successfully" });
  } catch (err) {
    next(err);
  }
}

async function getUserTournaments(req, res, next) {
  try {
    const result = await tournamentService.getUserApplications(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function approvePlayer(req, res, next) {
  try {
    const t = await tournamentService.decideApplication(req.params.id, req.params.playerId, "selected", req.user);
    res.json({ success: true, data: t });
  } catch (err) {
    next(err);
  }
}

async function rejectPlayer(req, res, next) {
  try {
    const t = await tournamentService.decideApplication(req.params.id, req.params.playerId, "rejected", req.user);
    res.json({ success: true, data: t });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTournament,
  listTournaments,
  getTournament,
  applyTournament,
  getUserTournaments,
  approvePlayer,
  rejectPlayer,
};
