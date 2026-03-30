const express = require("express");
const router = express.Router();
const path = require("path");
const tournamentRequestController = require("../controllers/tournamentRequestController");
const authWithUser = require("../middlewares/authWithUser");
const { roleCheck } = require(path.join(__dirname, "../../shared/roleMiddleware"));

router.post("/", authWithUser, roleCheck(["player"]), tournamentRequestController.createTournamentRequest);
router.get("/", authWithUser, tournamentRequestController.getTournamentRequests);
router.get("/:id", authWithUser, tournamentRequestController.getTournamentRequestById);
router.patch("/:id/approve", authWithUser, roleCheck(["admin"]), tournamentRequestController.approveTournamentRequest);
router.patch("/:id/reject", authWithUser, roleCheck(["admin"]), tournamentRequestController.rejectTournamentRequest);

module.exports = router;
