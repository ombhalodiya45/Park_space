const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Ownership = require("../models/Ownership");

const router = express.Router();

// Helpers
const signToken = (admin) =>
  jwt.sign({ sub: admin._id, role: admin.role }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: "7d",
  });

// POST /api/admin/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phone, org, role, spotIds } = req.body || {};

    // Validations
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const exists = await Admin.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    const passwordHash = await bcrypt.hash(String(password), 10);

    const admin = await Admin.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      phone: phone ? String(phone).trim() : undefined,
      org: org ? String(org).trim() : undefined,
      role: role === "superadmin" ? "superadmin" : "owner",
    });

    // Assign spot ownerships if provided (array of _id strings)
    if (Array.isArray(spotIds) && spotIds.length) {
      const docs = spotIds.map((spotId) => ({ admin: admin._id, spot: spotId }));
      await Ownership.insertMany(docs, { ordered: false }).catch(() => {});
    }

    const token = signToken(admin);
    return res.status(201).json({
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        org: admin.org,
      },
      token,
    });
  } catch (err) {
    console.error("register error:", err?.message);
    return res.status(500).json({ message: "Registration failed" });
  }
});

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "email, password required" });

    const admin = await Admin.findOne({ email: String(email).toLowerCase() });
    if (!admin || !(await admin.comparePassword(String(password)))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    if (!admin.active) return res.status(403).json({ message: "Account disabled" });

    const token = signToken(admin);
    return res.json({
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        org: admin.org,
      },
      token,
    });
  } catch (err) {
    console.error("login error:", err?.message);
    return res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
