const express = require("express");
const router = express.Router();
const authWithUser = require("../middlewares/authWithUser");
const appCtrl = require("../controllers/applicationController");

router.post("/", authWithUser, appCtrl.createApplication);
router.get("/sent", authWithUser, appCtrl.getSentApplications);
router.get("/received", authWithUser, appCtrl.getReceivedApplications);
router.put("/:id", authWithUser, appCtrl.updateApplicationStatus);

module.exports = router;
