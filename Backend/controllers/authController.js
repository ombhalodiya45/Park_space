const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "fallbackSecretKey123";

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password, phoneNumber, vehicles } = req.body;

    if (!fullName || !email || !password || !phoneNumber) {
      return res.status(400).json({ message: "Full name, email, password, and phone number are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already registered with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      vehicles: vehicles || []
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        vehicles: newUser.vehicles
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup." });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const payload = { userId: user._id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // also return vehicles from Vehicle collection for immediate UI readiness
    const vehicles = await Vehicle.find({ userId: user._id }).lean();

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        vehicles,          // array from Vehicle collection
        vehicle: vehicles[0] || null // legacy single field for guards
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
};

// AUTH ME (new)
exports.me = async (req, res) => {
  try {
    const uid = req.user?.userId || req.user?._id;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(uid).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const vehicles = await Vehicle.find({ userId: uid }).lean();

    return res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      vehicles,
      vehicle: vehicles[0] || null
    });
  } catch (e) {
    console.error("auth/me error:", e);
    res.status(500).json({ message: "Server error" });
  }
};
