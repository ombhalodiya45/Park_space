const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const connectDB = require("./config/db");
const spotRoutes = require("./routes/spotRoutes");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicalinfo");  // Import vehicle routes
const infoRoutes = require('./routes/info');
const { notFound, errorHandler } = require("./middleware/errorHandler");

dotenv.config();

const app = express();

// CORS + JSON
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Connect DB
connectDB();

// Friendly root page
app.get("/", (_req, res) => {
  res.send("ParkSpace API is running. Try GET /api/health or /api/admin/spots");
});

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/api/admin/spots", spotRoutes);
app.use("/api/auth", authRoutes);  // Register auth routes here
app.use("/api/vehicles", vehicleRoutes);  // REGISTER vehicle routes here
app.use("/api/info", infoRoutes);

// 404 + error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
