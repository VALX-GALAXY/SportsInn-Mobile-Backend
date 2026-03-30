const express = require("express");
const router = express.Router();
const authWithUser = require("../middlewares/authWithUser");
const path = require("path");
const { roleCheck, adminOnly } = require(path.join(__dirname, "../../shared/roleMiddleware"));
const reportController = require("../controllers/reportController");

router.get("/reasons", reportController.getReportReasons);
router.get("/stats", authWithUser, adminOnly, reportController.getReportStats);
router.post("/", authWithUser, reportController.createReport);
router.get("/", authWithUser, adminOnly, reportController.getAllReports);
router.put("/:id", authWithUser, adminOnly, reportController.updateReportStatus);

module.exports = router;
