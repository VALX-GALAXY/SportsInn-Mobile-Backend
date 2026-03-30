const tournamentRequestService = require("../services/tournamentRequestService");

async function createTournamentRequest(req, res, next) {
  try {
    const doc = await tournamentRequestService.createTournamentRequest(req.user, req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function getTournamentRequests(req, res, next) {
  try {
    const result = await tournamentRequestService.getTournamentRequests(req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function getTournamentRequestById(req, res, next) {
  try {
    const doc = await tournamentRequestService.getTournamentRequestById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Tournament request not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
}

async function approveTournamentRequest(req, res, next) {
  try {
    const result = await tournamentRequestService.approveTournamentRequest(req.params.id, req.user);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function rejectTournamentRequest(req, res, next) {
  try {
    const { reason } = req.body;
    const result = await tournamentRequestService.rejectTournamentRequest(req.params.id, req.user, reason);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTournamentRequest,
  getTournamentRequests,
  getTournamentRequestById,
  approveTournamentRequest,
  rejectTournamentRequest,
};
