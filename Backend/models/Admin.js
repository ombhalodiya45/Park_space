const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const AdminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    passwordHash: { type: String, required: true },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Invalid phone"],
    },
    // Optional metadata
    org: { type: String, trim: true, maxlength: 80 },
    role: {
      type: String,
      enum: ["superadmin", "owner"],
      default: "owner",
    },
    // Soft flags
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Methods
AdminSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

module.exports = mongoose.model("Admin", AdminSchema);
