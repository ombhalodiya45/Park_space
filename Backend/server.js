// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const Spot = require("./models/Spot");
const Reservation = require("./models/Reservation");

// Import routes
const spotRoutes = require("./routes/spotRoutes");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicleinfo");
const infoRoutes = require("./routes/info");
const adminAuthRoutes = require("./routes/adminAuth"); // should expose POST /register and POST /login
const reservationRoutes = require("./routes/reservations");
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();
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

// Middleware setup
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
connectDB();

// Root routes
app.get("/", (_req, res) => {
  res.send("🚗 ParkSpace API is running! Try GET /api/health or /api/vehicles");
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, client: CLIENT_URL });
});

// Mount routes
// Admin auth endpoints will be:
// POST /api/admin/auth/register
// POST /api/admin/auth/login
app.use("/api/admin/auth", adminAuthRoutes);

// Admin spots endpoints under /api/admin/spots/...
app.use("/api/admin/spots", spotRoutes);

// Public/user auth and other routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/info", infoRoutes);
app.use("/api/reservations", reservationRoutes);

// Test Ticket route (manual)
app.get("/api/testTicket", (req, res) => {
  const testTicket = {
    _id: "test1234567890",
    user: { name: "John Doe", fullName: "John Doe" },
    vehicle: { make: "Tesla", model: "Model 3", plate: "GJ01AB1234" },
    slot: { name: "A-12", location: "Basement Parking Zone 1" },
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    amount: 120,
    status: "confirmed",
  };

  res.status(200).json(testTicket);
});

// NEW: Mock reservation fetch route for TicketPage.jsx
app.get("/api/reservations/:id", (req, res) => {
  const { id } = req.params;

  const testTicket = {
    _id: id,
    user: { name: "John Doe", fullName: "John Doe" },
    vehicle: { make: "Tesla", model: "Model 3", plate: "GJ01AB1234" },
    slot: { name: "A-12", location: "Basement Parking Zone 1" },
    startTime: new Date(),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    amount: 120,
    status: "confirmed",
  };

  res.status(200).json(testTicket);
});

// Catch unmatched API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🌐 CORS Client Allowed: ${CLIENT_URL}`);
});

// ====================================================================
// 🧹 AUTO SLOT CLEANUP SYSTEM — Frees slots after booking endTime
// ====================================================================
setInterval(async () => {
  try {
    const allReservations = await Reservation.find({
      status: { $in: ["confirmed", "expired"] },
    });

    if (allReservations.length > 0) {
      console.log(`🧹 Resetting ${allReservations.length} slots to available...`);

      for (const r of allReservations) {
        // Mark reservation expired
        r.status = "expired";
        await r.save();

        // Also mark slot available again
        await Spot.findByIdAndUpdate(r.spotId, { isAvailable: true });
      }

      console.log("All slots reset to available!");
    }
  } catch (err) {
    console.error(" Error resetting slots:", err);
  }
}, 1 * 60 * 1000);
