const express = require("express");
const router = express.Router();
const path = require("path");
const notificationController = require("../controllers/notificationController");
const authMiddleware = require(path.join(__dirname, "../../shared/authMiddleware"));

router.get("/", authMiddleware, notificationController.getNotifications);
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);
router.put("/read/:id", authMiddleware, notificationController.markOneRead);
router.patch("/read-all", authMiddleware, notificationController.markAllRead);
router.delete("/:id", authMiddleware, notificationController.deleteNotification);
router.get("/:userId", authMiddleware, notificationController.getNotifications);

module.exports = router;
