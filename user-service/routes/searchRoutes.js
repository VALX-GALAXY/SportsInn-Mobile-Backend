const express = require("express");
const router = express.Router();
const authWithUser = require("../middlewares/authWithUser");
const { searchUsers, getAutocompleteSuggestions, getTrendingContent } = require("../controllers/searchController");

router.get("/", authWithUser, searchUsers);
router.get("/autocomplete", authWithUser, getAutocompleteSuggestions);
router.get("/trending", authWithUser, getTrendingContent);

module.exports = router;
