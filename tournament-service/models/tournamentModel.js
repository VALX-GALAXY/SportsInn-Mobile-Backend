const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["applied", "selected", "rejected"], default: "applied" },
  appliedAt: { type: Date, default: () => new Date() },
  decidedAt: { type: Date },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  teamName: { type: String, default: "" },
  contactEmail: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  notes: { type: String, default: "" },
}, { _id: true });

const tournamentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  entryFee: { type: Number, default: 0 },
  location: { type: String, default: "" },
  type: { type: String, default: "Open" },
  vacancies: { type: Number, default: 0 },
  deadline: { type: Date },
  prizePool: { type: Number, default: 0 },
  startDate: { type: Date },
  image: { type: String, default: null },
  imageUrl: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applicants: [applicantSchema],
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  featured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Tournament", tournamentSchema);
