const express = require("express");
const path = require("path");
const multer = require("multer");
const storyController = require("../controllers/storyController");
const authMiddleware = require(path.join(__dirname, "../../shared/authMiddleware"));

const uploadDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const maxBytes = Number(process.env.MULTIPART_MAX_BYTES || process.env.STORY_UPLOAD_MAX_BYTES) || 500 * 1024 * 1024;
const upload = multer({
  storage,
  limits: {
    fileSize: maxBytes,
    files: 2,
    fields: 20,
    fieldSize: 2 * 1024 * 1024,
    parts: 24,
  },
});

const storyFile = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "media", maxCount: 1 },
]);

function storyUploadMiddleware(req, res, next) {
  storyFile(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ success: false, message: "File too large" });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    if (err) return next(err);
    next();
  });
}

const router = express.Router();

function dispatchStoryPost(req, res, next) {
  const ct = (req.headers["content-type"] || "").toLowerCase();
  if (ct.includes("application/json")) {
    return storyController.createStoryFromBody(req, res, next);
  }
  storyUploadMiddleware(req, res, (err) => {
    if (err) return next(err);
    storyController.createStory(req, res, next);
  });
}

router.get("/", authMiddleware, storyController.listStories);
router.post("/", authMiddleware, dispatchStoryPost);
router.delete("/:id", authMiddleware, storyController.deleteStory);

module.exports = router;
