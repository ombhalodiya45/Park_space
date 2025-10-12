const mongoose = require("mongoose");

/* Single physical slot inside a location */
const SingleSpotSchema = new mongoose.Schema(
  {
    // e.g., "P1", "P2", "S1", "S2"
    spotNumber: { type: String, required: true, trim: true },
    // Optional grouping hint for UI (e.g., "P" or "S")
    pillar: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["available", "booked", "notAvailable"],
      default: "available",
    },
  },
  { _id: false }
);

// Helpful index to speed lookups inside the array by spotNumber (not a global unique constraint)
SingleSpotSchema.index({ spotNumber: 1 });

/* Spot/Location document */
const SpotSchema = new mongoose.Schema(
  {
    // Display details
    name: { type: String, required: true, trim: true }, // e.g., "Downtown Garage"
    address: { type: String, required: false, trim: true, default: "N/A" },

    // Pricing and quick availability toggle
    price: { type: Number, default: 0, min: 0 }, // ₹ per hour
    available: { type: Boolean, default: true }, // quick on/off

    // Admin-editable counts
    totalSlots: { type: Number, required: true, min: 0, default: 0 },
    availableSlots: { type: Number, required: true, min: 0, default: 0 },

    // Optional granular per-slot tracking
    spots: [SingleSpotSchema],
  },
  { timestamps: true }
);

/* Virtuals if you still use the spots array */
SpotSchema.virtual("computedTotalSlots").get(function () {
  return Array.isArray(this.spots) ? this.spots.length : 0;
});
SpotSchema.virtual("computedAvailableSlots").get(function () {
  if (!Array.isArray(this.spots)) return 0;
  return this.spots.filter((s) => s.status === "available").length;
});

/* Clamp counts */
SpotSchema.pre("validate", function (next) {
  if (typeof this.totalSlots === "number" && this.totalSlots < 0) {
    this.totalSlots = 0;
  }
  if (typeof this.availableSlots !== "number") {
    this.availableSlots = 0;
  }
  if (this.availableSlots > this.totalSlots) {
    this.availableSlots = this.totalSlots;
  }
  if (this.availableSlots < 0) {
    this.availableSlots = 0;
  }
  next();
});

/* Optional: auto-sync the spots array length with totalSlots */
SpotSchema.pre("save", function (next) {
  if (!Array.isArray(this.spots)) return next();

  const desired = Number(this.totalSlots || 0);
  const current = this.spots.length;

  if (desired > current) {
    const startIdx = current + 1;
    for (let i = startIdx; i <= desired; i++) {
      // If you want P/S pillars auto-generated, adjust here based on i
      this.spots.push({
        spotNumber: `P${i}`, // default prefix P; you can alternate to "S" if needed
        pillar: "P",
        status: "available",
      });
    }
  } else if (desired < current) {
    this.spots.splice(desired);
  }

  if (this.availableSlots > desired) this.availableSlots = desired;

  next();
});

module.exports = mongoose.model("Spot", SpotSchema);
