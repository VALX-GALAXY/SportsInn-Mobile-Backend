const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const feedController = require("../controllers/feedController");
const authMiddleware = require(path.join(__dirname, "../../shared/authMiddleware"));

const uploadDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const uploadMax = Number(process.env.MULTIPART_MAX_BYTES || process.env.FEED_UPLOAD_MAX_BYTES) || 500 * 1024 * 1024;
const upload = multer({
  storage,
  limits: {
    fileSize: uploadMax,
    files: 2,
    fields: 20,
    fieldSize: 2 * 1024 * 1024,
    parts: 24,
  },
});

function pickSingleFeedUpload(req, res, next) {
  const m = req.files?.media?.[0];
  const i = req.files?.image?.[0];
  if (m && i) {
    return res.status(400).json({ success: false, message: "Send only one file (media or image)" });
  }
  const file = m || i;
  if (!file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  req.file = file;
  next();
}

const mediaOrImage = upload.fields([
  { name: "media", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

router.post("/upload", authMiddleware, mediaOrImage, pickSingleFeedUpload, feedController.uploadMedia);
router.post("/", authMiddleware, feedController.createPost);
router.get("/", authMiddleware, feedController.getFeed);
router.get("/personalized", authMiddleware, feedController.getPersonalizedFeed);
router.get("/:id", authMiddleware, feedController.getPostById);
router.post("/:id/like", authMiddleware, feedController.likePost);
router.post("/:id/unlike", authMiddleware, feedController.unlikePost);
router.put("/:id/toggle-like", authMiddleware, feedController.toggleLike);
router.delete("/:id", authMiddleware, feedController.deletePost);
router.post("/:id/comment", authMiddleware, feedController.addComment);
router.get("/:id/comments", authMiddleware, feedController.getComments);

module.exports = router;
