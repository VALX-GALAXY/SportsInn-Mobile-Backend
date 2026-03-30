const express = require("express");
const router = express.Router();
const path = require("path");
const auth = require(path.join(__dirname, "../../shared/authMiddleware"));
const uploadCtrl = require("../controllers/uploadController");

router.post("/", auth, uploadCtrl.uploadMiddleware(), uploadCtrl.handleUpload);
router.post("/profile", auth, uploadCtrl.uploadMiddleware(), uploadCtrl.handleUpload);
router.post("/post", auth, uploadCtrl.uploadMiddleware(), uploadCtrl.handleUpload);
router.post("/gallery", auth, uploadCtrl.uploadMiddleware(), uploadCtrl.handleUpload);

module.exports = router;
