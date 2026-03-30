const express = require("express");
const router = express.Router();
const { followUser, getFollowers, getFollowing, searchUsers, getUserStats, getAllUsers } = require("../controllers/userController");
const authWithUser = require("../middlewares/authWithUser");

router.get("/search", searchUsers);
router.get("/all", authWithUser, getAllUsers);
router.post("/:id/follow", authWithUser, followUser);
router.get("/:id/followers", getFollowers);
router.get("/:id/following", getFollowing);
router.get("/:id/stats", authWithUser, getUserStats);

module.exports = router;
