const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const profileController = require("../controllers/profileController");
const authWithUser = require("../middlewares/authWithUser");

const uploadDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

router.get("/", authWithUser, (req, res, next) => {
  req.params.id = req.user._id;
  return profileController.getProfile(req, res, next);
});
router.put("/", authWithUser, (req, res, next) => {
  req.params.id = req.user._id;
  return profileController.updateProfile(req, res, next);
});

router.get("/:id", profileController.getProfile);
router.put("/:id", authWithUser, profileController.updateProfile);
router.post("/:id/picture", authWithUser, upload.single("profilePic"), profileController.uploadProfilePicture);
router.get("/:id/posts", authWithUser, profileController.getPostsByUser);
router.get("/:id/gallery", profileController.getGallery);
router.post("/:id/gallery", authWithUser, upload.single("file"), profileController.addGalleryImage);
router.delete("/:id/gallery", authWithUser, profileController.removeGalleryImage);

module.exports = router;
