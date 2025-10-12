const express = require("express");
const {
  getSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
} = require("../controllers/spotController");
const Spot = require("../models/Spot");

const router = express.Router();

/* Create (admin) */
router.post("/", async (req, res) => {
  try {
    console.log("Incoming spot data:", req.body);

    const { name, location, price, totalSlots, availableSlots, available } = req.body;

    if (!name || !location || typeof price === "undefined") {
      return res.status(400).json({
        message: "Missing required fields: name, location, or price",
      });
    }

    const newSpot = new Spot({
      name,
      location,
      price: Number(price),
      totalSlots: Number(totalSlots) || 0,
      availableSlots:
        typeof availableSlots === "number"
          ? Number(availableSlots)
          : Number(totalSlots) || 0,
      available: typeof available === "boolean" ? available : true,
    });

    // clamp availableSlots
    if (newSpot.availableSlots > newSpot.totalSlots) newSpot.availableSlots = newSpot.totalSlots;
    if (newSpot.availableSlots < 0) newSpot.availableSlots = 0;

    await newSpot.save();
    console.log("✅ Spot created:", newSpot);

    res.status(201).json(newSpot);
  } catch (err) {
    console.error("❌ Error while creating spot:", err);
    res
      .status(500)
      .json({ message: "Server error while creating spot", error: err.message });
  }
});

/* List all spots (admin) */
router.get("/", getSpots);

/* Public list for Booking page (use _id) */
router.get("/public/list", async (req, res, next) => {
  try {
    const spots = await Spot.find({ available: true })
      .select("_id name location price available totalSlots availableSlots")
      .sort({ createdAt: -1 });
    res.json(spots);
  } catch (err) {
    next(err);
  }
});

/* Public: get a single spot by _id (for reservation/details) */
router.get("/by-id/:id", async (req, res, next) => {
  try {
    const spot = await Spot.findById(req.params.id)
      .select("_id name location price available totalSlots availableSlots spots");
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }
    // Normalize inner slots if present
    if (Array.isArray(spot.spots)) {
      spot.spots = spot.spots.map((s, idx) => ({
        spotNumber: s.spotNumber || `P${idx + 1}`,
        status: s.status || "available",
      }));
    }
    res.json(spot);
  } catch (err) {
    next(err);
  }
});

/* Get all spots for a specific location (keeps spots array for per-slot UI) */
router.get("/location/:locationName", async (req, res, next) => {
  try {
    const { locationName } = req.params;

    // Sort by createdAt for stable pillar grouping; you can also sort by name
    const spotsInLocation = await Spot.find({ location: locationName })
      .select("_id name location price available totalSlots availableSlots spots")
      .sort({ createdAt: 1 });

    if (!spotsInLocation || spotsInLocation.length === 0) {
      return res.status(404).json({ message: "No spots found for this location" });
    }

    // Normalize each document's inner spots for front-end safety
    const normalized = spotsInLocation.map((doc) => {
      const mappedSpots = Array.isArray(doc.spots)
        ? doc.spots.map((s, idx) => ({
            spotNumber: s.spotNumber || `P${idx + 1}`,
            status: s.status || "available",
          }))
        : [];
      return {
        _id: doc._id,
        name: doc.name,
        location: doc.location,
        price: doc.price,
        available: doc.available,
        totalSlots: doc.totalSlots,
        availableSlots: doc.availableSlots,
        spots: mappedSpots,
      };
    });

    const capacity = normalized.reduce(
      (sum, s) => sum + (typeof s.totalSlots === "number" ? s.totalSlots : 0),
      0
    );
    const availableSum = normalized.reduce(
      (sum, s) => sum + (typeof s.availableSlots === "number" ? s.availableSlots : 0),
      0
    );

    res.json({
      capacity,
      available: availableSum,
      spots: normalized,
    });
  } catch (err) {
    next(err);
  }
});

/* (Optional legacy) Single spot lookup by custom code — keep if still used somewhere */
router.get("/slots/:customCode", async (req, res, next) => {
  try {
    const { customCode } = req.params;
    const spot = await Spot.findOne({ customCode });
    if (!spot) {
      return res.status(404).json({ message: "Spot not found" });
    }
    res.json(spot);
  } catch (err) {
    next(err);
  }
});

/* Admin: by ID (edit/delete) */
router
  .route("/:id")
  .get(getSpotById)
  .put(updateSpot)
  .delete(deleteSpot);

/* Admin: update by customCode (kept for backwards compatibility) */
router.put("/code/:customCode", async (req, res, next) => {
  try {
    const { customCode } = req.params;
    const payload = { ...req.body };

    if (typeof payload.price !== "undefined") payload.price = Number(payload.price);
    if (typeof payload.totalSlots !== "undefined") payload.totalSlots = Number(payload.totalSlots);
    if (typeof payload.availableSlots !== "undefined") payload.availableSlots = Number(payload.availableSlots);
    if (typeof payload.available !== "undefined") payload.available = !!payload.available;

    let spot = await Spot.findOne({ customCode });
    if (!spot) return res.status(404).json({ message: "Spot not found" });

    spot.name = payload.name ?? spot.name;
    spot.location = payload.location ?? spot.location;
    if (typeof payload.price === "number" && !Number.isNaN(payload.price)) spot.price = payload.price;
    if (typeof payload.available === "boolean") spot.available = payload.available;

    if (typeof payload.totalSlots === "number" && !Number.isNaN(payload.totalSlots)) {
      spot.totalSlots = Math.max(0, payload.totalSlots);
    }
    if (typeof payload.availableSlots === "number" && !Number.isNaN(payload.availableSlots)) {
      const max = typeof payload.totalSlots === "number" && !Number.isNaN(payload.totalSlots)
        ? Math.max(0, payload.totalSlots)
        : spot.totalSlots;
      spot.availableSlots = Math.max(0, Math.min(payload.availableSlots, max));
    }

    await spot.save();
    return res.json(spot);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
