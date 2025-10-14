const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const spotRoutes = require("./routes/spotRoutes");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicalinfo");
const infoRoutes = require("./routes/info");
const adminAuthRoutes = require("./routes/adminAuth"); // NEW
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// CORS + parsers
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ensure preflights are handled quickly
app.options("*", cors({ origin: CLIENT_URL, credentials: true }));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect DB
connectDB();

// Friendly root page
app.get("/", (_req, res) => {
  res.send("ParkSpace API is running. Try GET /api/health or /api/admin/spots");
});

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// API routes (keep these paths stable)
app.use("/api/admin/auth", adminAuthRoutes); // NEW: register/login admins (owners)
app.use("/api/admin/spots", spotRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/info", infoRoutes);

// 404 fallback for unmatched routes (JSON)
app.use((req, res, next) => {
  if (req.path && !req.path.startsWith("/api/")) {
    return next(); // non-API can be handled by frontend if you serve static later
  }
  return res.status(404).json({ message: "Route not found", path: req.originalUrl });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
