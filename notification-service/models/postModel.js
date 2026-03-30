const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  caption: { type: String, default: "" },
  mediaUrl: { type: String, default: "" },
  mediaType: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.models.Post || mongoose.model("Post", postSchema);
