const express = require("express");
const router = express.Router();
const { sendMessage, getConversation, markAsRead, getConversations, deleteMessage } = require("../controllers/messageController");
const authWithUser = require("../middlewares/authWithUser");

router.post("/", authWithUser, sendMessage);
router.get("/conversations/:userId", authWithUser, getConversations);
router.get("/:userId", authWithUser, getConversation);
router.put("/read/:id", authWithUser, markAsRead);
router.delete("/message/:id", authWithUser, deleteMessage);

module.exports = router;
