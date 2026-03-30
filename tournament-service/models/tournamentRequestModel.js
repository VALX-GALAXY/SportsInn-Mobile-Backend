const mongoose = require("mongoose");

const tournamentRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tournamentData: {
    title: { type: String, required: true },
    entryFee: { type: Number, default: 0 },
    location: { type: String, default: "" },
    type: { type: String, default: "Open" },
    vacancies: { type: Number, default: 0 },
    deadline: { type: Date },
    prizePool: { type: Number, default: 0 },
    startDate: { type: Date },
    description: { type: String, default: "" },
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  reviewedAt: { type: Date },
  rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("TournamentRequest", tournamentRequestSchema);
