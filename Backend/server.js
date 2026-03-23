// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

// Import routes
const spotRoutes        = require("./routes/spotRoutes");
const authRoutes        = require("./routes/auth");
const vehicleRoutes     = require("./routes/vehicleinfo");
const infoRoutes        = require("./routes/info");
const adminAuthRoutes   = require("./routes/adminAuth");
const reservationRoutes = require("./routes/reservations");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Trust proxy (for secure cookies in deployment)
app.set("trust proxy", 1);

// CORS setup
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Preflight (OPTIONS) handling
app.options("*", cors({ origin: CLIENT_URL, credentials: true }));

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
connectDB();

// ── Root routes ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.send("ParkSpace API is running!");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, client: CLIENT_URL });
});

// ── Mount routes ─────────────────────────────────────────────────────────────
app.use("/api/admin/auth",   adminAuthRoutes);
app.use("/api/admin/spots",  spotRoutes);
app.use("/api/auth",         authRoutes);
app.use("/api/vehicles",     vehicleRoutes);
app.use("/api/info",         infoRoutes);
app.use("/api/reservations", reservationRoutes);

// ── Catch unmatched API routes ────────────────────────────────────────────────
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

// ── Error handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CORS Client Allowed: ${CLIENT_URL}`);
});