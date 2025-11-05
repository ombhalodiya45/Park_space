const Spot = require("../models/Spot.js");

// Helper: clamp number between min and max
function clamp(n, min, max) {
  const x = Number(n);
  if (Number.isNaN(x)) return min;
  return Math.max(min, Math.min(x, max));
}

// Build an array of parking slots like P1, P2, P3, ...
function buildSlots(count, startFrom = 1, prefix = "P", pillar = "P") {
  const out = [];
  for (let i = startFrom; i <= count; i++) {
    out.push({ spotNumber: `${prefix}${i}`, pillar, status: "available" });
  }
  return out;
}

// @desc    Create spot
// @route   POST /api/admin/spots
// @access  Admin
const createSpot = async (req, res) => {
  try {
    const {
      name,
      location,
      price,
      available = true,
      totalSlots = 0,
      availableSlots,
      spots,
    } = req.body || {};

    // Validation
    if (!name || !location || typeof price === "undefined") {
      return res.status(400).json({ message: "name, location, and price are required" });
    }

    const total = Number(totalSlots) || 0;
    let avail = typeof availableSlots === "number" ? Number(availableSlots) : total;
    avail = clamp(avail, 0, total);

    // Auto-generate spots if not provided
    let slotsArray = Array.isArray(spots)
      ? spots
      : buildSlots(total, 1, "P", "P");

    const spot = await Spot.create({
      name,
      location,
      price: Number(price),
      available: !!available,
      totalSlots: total,
      availableSlots: avail,
      spots: slotsArray,
    });

    return res.status(201).json(spot);
  } catch (err) {
    console.error("createSpot error:", err?.message, err?.errors);
    return res.status(500).json({ message: err?.message || "Failed to create spot" });
  }
};

// @desc    Get all spots
// @route   GET /api/admin/spots
const getSpots = async (req, res, next) => {
  try {
    const { q, available } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
      ];
    }

    if (available === "true" || available === "false") {
      filter.available = available === "true";
    }

    const spots = await Spot.find(filter).sort({ createdAt: -1 });
    res.json(spots);
  } catch (err) {
    next(err);
  }
};

// @desc    Get one spot
// @route   GET /api/admin/spots/:id
const getSpotById = async (req, res, next) => {
  try {
    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: "Spot not found" });
    res.json(spot);
  } catch (err) {
    next(err);
  }
};

// @desc    Update spot
// @route   PUT /api/admin/spots/:id
const updateSpot = async (req, res, next) => {
  try {
    const {
      name,
      location,
      price,
      available,
      totalSlots,
      availableSlots,
      spots,
    } = req.body || {};

    const spot = await Spot.findById(req.params.id);
    if (!spot) return res.status(404).json({ message: "Spot not found" });

    if (typeof name !== "undefined") spot.name = name;
    if (typeof location !== "undefined") spot.location = location;
    if (typeof price !== "undefined") spot.price = Number(price);
    if (typeof available !== "undefined") spot.available = !!available;

    // Replace slots directly if provided
    if (Array.isArray(spots)) {
      spot.spots = spots;
      spot.totalSlots = spots.length;
      if (spot.availableSlots > spot.totalSlots) {
        spot.availableSlots = spot.totalSlots;
      }
    }

    // Handle numeric totalSlots change
    if (typeof totalSlots !== "undefined" && !Array.isArray(spots)) {
      const newTotal = Math.max(0, Number(totalSlots));
      const current = Array.isArray(spot.spots) ? spot.spots.length : 0;

      if (!Array.isArray(spot.spots)) spot.spots = [];

      if (newTotal > current) {
        const startFrom = current + 1;
        spot.spots.push(...buildSlots(newTotal, startFrom, "P", "P"));
      } else if (newTotal < current) {
        spot.spots.splice(newTotal);
      }

      spot.totalSlots = newTotal;
      if (spot.availableSlots > newTotal) spot.availableSlots = newTotal;
    }

    if (typeof availableSlots !== "undefined") {
      const max =
        typeof totalSlots !== "undefined"
          ? Math.max(0, Number(totalSlots))
          : spot.totalSlots;
      spot.availableSlots = clamp(availableSlots, 0, max);
    }

    await spot.save();
    return res.json(spot);
  } catch (err) {
    console.error("updateSpot error:", err?.message, err?.errors);
    next(err);
  }
};

// @desc    Delete spot
// @route   DELETE /api/admin/spots/:id
const deleteSpot = async (req, res, next) => {
  try {
    const spot = await Spot.findByIdAndDelete(req.params.id);
    if (!spot) return res.status(404).json({ message: "Spot not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSpot,
  getSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
};
