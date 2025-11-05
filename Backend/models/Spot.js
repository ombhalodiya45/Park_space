const mongoose = require("mongoose");

/* Schema for a single parking slot inside a location */
const SingleSpotSchema = new mongoose.Schema(
  {
    // e.g., "P1", "P2"
    spotNumber: { type: String, required: true, trim: true },
    // Optional pillar/group indicator
    pillar: { type: String, trim: true, default: "P" },
    status: {
      type: String,
      enum: ["available", "booked", "notAvailable"],
      default: "available",
    },
  },
  { _id: false }
);

// Local index for efficient queries by spotNumber
SingleSpotSchema.index({ spotNumber: 1 });

/* Main parking spot schema */
const SpotSchema = new mongoose.Schema(
  {
    // Display details
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "N/A" },
    location: { type: String, trim: true, default: "" }, // optional location field

    // Pricing and availability
    price: { type: Number, default: 0, min: 0 },
    available: { type: Boolean, default: true },

    // Slot counts
    totalSlots: { type: Number, required: true, min: 0, default: 0 },
    availableSlots: { type: Number, required: true, min: 0, default: 0 },

    // Nested array of individual slots
    spots: [SingleSpotSchema],
  },
  { timestamps: true }
);

/* Virtual properties */
SpotSchema.virtual("computedTotalSlots").get(function () {
  return Array.isArray(this.spots) ? this.spots.length : 0;
});

SpotSchema.virtual("computedAvailableSlots").get(function () {
  if (!Array.isArray(this.spots)) return 0;
  return this.spots.filter((s) => s.status === "available").length;
});

/* Validation to keep values consistent */
SpotSchema.pre("validate", function (next) {
  this.totalSlots = Math.max(0, this.totalSlots);
  this.availableSlots = Math.max(0, this.availableSlots);
  if (this.availableSlots > this.totalSlots) {
    this.availableSlots = this.totalSlots;
  }
  next();
});

/* Auto-sync the spot array with totalSlots count */
SpotSchema.pre("save", function (next) {
  if (!Array.isArray(this.spots)) this.spots = [];

  const desired = Number(this.totalSlots || 0);
  const current = this.spots.length;

  if (desired > current) {
    for (let i = current + 1; i <= desired; i++) {
      this.spots.push({
        spotNumber: `P${i}`,
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
