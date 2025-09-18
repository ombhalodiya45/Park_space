const mongoose = require("mongoose");

const SpotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    available: { type: Boolean, default: true },
    customCode: { type: String, unique: true, index: true }, // park3642
  },
  { timestamps: true }
);

module.exports = mongoose.model("Spot", SpotSchema);
