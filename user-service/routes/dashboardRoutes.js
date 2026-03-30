const express = require("express");
const router = express.Router();
const authWithUser = require("../middlewares/authWithUser");
const { academyFollowers, scoutSearchPlayers, getDashboardStats } = require("../controllers/dashboardController");
const analytics = require("../controllers/analyticsController");

router.get("/academy/followers", authWithUser, academyFollowers);
router.get("/scout/players", authWithUser, scoutSearchPlayers);
router.get("/analytics/player/:id", authWithUser, analytics.playerAnalytics);
router.get("/analytics/academy/:id", authWithUser, analytics.academyAnalytics);
router.get("/analytics/scout/:id", authWithUser, analytics.scoutAnalytics);
router.get("/:userId", authWithUser, getDashboardStats);

module.exports = router;
