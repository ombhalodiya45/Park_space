const express = require("express");
const router = express.Router();
const { addVehicleController } = require("../controllers/addVehicleController");
const authMiddleware = require("../middleware/authMiddleware");

// Add vehicle (protected)
router.post("/", authMiddleware, addVehicleController);

// Get all vehicles for authenticated user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // If you store vehicles as separate documents, fetch from Vehicle model:
    // const vehicles = await require("../models/Vehicle").find({ userId }).lean();

    // If you still keep an embedded array on the user document:
    const vehicles = req.user.vehicles || [];

    res.json({ success: true, vehicles });
  } catch (error) {
    console.error("Get vehicles error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vehicles" });
  }
});

// Get specific vehicle by plate number
router.get("/:plate", authMiddleware, async (req, res) => {
  try {
    const { plate } = req.params;
    const userVehicles = req.user.vehicles || [];
    const vehicle = userVehicles.find(
      v => v.plate?.toLowerCase() === plate.toLowerCase()
    );

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, vehicle });
  } catch (error) {
    console.error("Get vehicle error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch vehicle" });
  }
});

// Health check route
router.get("/check-auth", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "Authentication successful",
    user: {
      id: req.user.userId || req.user._id,
      email: req.user.email,
      vehicleCount: req.user.vehicles?.length || 0
    }
  });
});

module.exports = router;
