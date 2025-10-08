// models/User.js
const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema({
  plateNumber: { type: String, trim: true },
  make: { type: String, trim: true },
  model: { type: String, trim: true },
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, trim: true }, // Optional at signup
    vehicles: [VehicleSchema] // An array to store one or more user vehicles, optional at signup
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
