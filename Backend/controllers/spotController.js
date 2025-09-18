const Spot = require("../models/Spot.js");

// helper to build a code like "park3642"
function makeCode(prefix = "park") {
  const n = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return `${prefix}${n}`;
}

// @desc    Create spot
// @route   POST /api/admin/spots
// @access  Admin
const createSpot = async (req, res, next) => {
  try {
    const { name, location, price, available } = req.body;

    // Generate a unique custom code, retry a few times if collision
    let customCode = makeCode();
    for (let i = 0; i < 4; i++) {
      const exists = await Spot.findOne({ customCode });
      if (!exists) break;
      customCode = makeCode();
    }

    const spot = await Spot.create({ name, location, price, available, customCode });
    res.status(201).json(spot);
  } catch (err) {
    // If unique index throws duplicate key, try once more
    if (err.code === 11000 && err.keyPattern?.customCode) {
      try {
        const spot = await Spot.create({
          ...req.body,
          customCode: makeCode(),
        });
        return res.status(201).json(spot);
      } catch (e2) {
        return next(e2);
      }
    }
    next(err);
  }
};

// @desc    Get all spots (optional filters: q, available)
// @route   GET /api/admin/spots
const getSpots = async (req, res, next) => {
  try {
    const { q, available } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { customCode: { $regex: q, $options: "i" } },
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
    if (!spot) return res.status(404).json({ message: "Not found" });
    res.json(spot);
  } catch (err) {
    next(err);
  }
};

// @desc    Update spot
// @route   PUT /api/admin/spots/:id
const updateSpot = async (req, res, next) => {
  try {
    const { name, location, price, available } = req.body;
    const spot = await Spot.findByIdAndUpdate(
      req.params.id,
      { name, location, price, available },
      { new: true, runValidators: true }
    );
    if (!spot) return res.status(404).json({ message: "Not found" });
    res.json(spot);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete spot
// @route   DELETE /api/admin/spots/:id
const deleteSpot = async (req, res, next) => {
  try {
    const spot = await Spot.findByIdAndDelete(req.params.id);
    if (!spot) return res.status(404).json({ message: "Not found" });
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
