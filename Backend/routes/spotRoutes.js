const express = require("express");
const {
  createSpot,
  getSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
  // Make sure you have a controller for the new function or handle it inline
  getSpotByCustomCode, 
} = require("../controllers/spotController");
const Spot = require("../models/Spot");

const router = express.Router();

// Create + list (admin)
router.route("/")
  .post(createSpot)
  .get(getSpots);

// Public list for Booking page
router.get("/public/list", async (req, res, next) => {
  try {
    const spots = await Spot.find({ available: true })
      .select("customCode name location price available")
      .sort({ createdAt: -1 });
    res.json(spots);
  } catch (err) {
    next(err);
  }
});

// NEW: Route to get a single spot by its customCode for the reservation page
router.get("/slots/:customCode", async (req, res, next) => {
  try {
    const { customCode } = req.params;
    const spot = await Spot.findOne({ customCode: customCode });
    if (!spot) {
      return res.status(404).json({ message: 'Spot not found' });
    }
    res.json(spot);
  } catch (err) {
    next(err);
  }
});

// Your existing generic route for admin actions by ID
router.route("/:id")
  .get(getSpotById)
  .put(updateSpot)
  .delete(deleteSpot);

module.exports = router;
