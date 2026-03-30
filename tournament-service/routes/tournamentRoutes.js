const express = require("express");
const router = express.Router();
const path = require("path");
const tournamentController = require("../controllers/tournamentController");
const authWithUser = require("../middlewares/authWithUser");
const { roleCheck } = require(path.join(__dirname, "../../shared/roleMiddleware"));

router.post("/", authWithUser, roleCheck(["admin", "academy", "club"]), tournamentController.createTournament);
router.get("/", tournamentController.listTournaments);
router.get("/:id", tournamentController.getTournament);
router.post("/apply/:id", authWithUser, roleCheck(["player", "club", "academy"]), tournamentController.applyTournament);
router.post("/apply", authWithUser, roleCheck(["player", "club", "academy"]), tournamentController.applyTournament);
router.get("/user/:id", authWithUser, tournamentController.getUserTournaments);
router.patch("/:id/approve/:playerId", authWithUser, roleCheck(["admin"]), tournamentController.approvePlayer);
router.patch("/:id/reject/:playerId", authWithUser, roleCheck(["admin"]), tournamentController.rejectPlayer);

module.exports = router;
