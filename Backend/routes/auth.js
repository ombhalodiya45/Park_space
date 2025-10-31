const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { signup, login, me } = require("../controllers/authController");

// Signup
router.post("/signup", signup);

// Login
router.post("/login", login);

// Current user (protected)
router.get("/me", authMiddleware, me);

module.exports = router;
