const mongoose = require("mongoose");

const OwnershipSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    spot: { type: mongoose.Schema.Types.ObjectId, ref: "Spot", required: true, index: true },
  },
  { timestamps: true }
);

// Ensure one admin-spot pair is unique
OwnershipSchema.index({ admin: 1, spot: 1 }, { unique: true });

module.exports = mongoose.model("Ownership", OwnershipSchema);
