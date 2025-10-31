// models/Reservation.js
const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: "Spot", required: true },
    status: { type: String, enum: ["held", "confirmed", "cancelled", "expired"], index: true, default: "held" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    amount: { type: Number, required: true },
    holdExpiresAt: { type: Date, index: true },
    confirmationCode: { type: String },
    payment: {
      provider: String,
      intentId: String,
      status: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Reservation", ReservationSchema);
