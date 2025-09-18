const express = require("express");
const {
  createSpot,
  getSpots,
  getSpotById,
  updateSpot,
  deleteSpot,
} = require("../controllers/spotController");
const Spot = require("../models/Spot");

const router = express.Router();

// Create + list (admin)
router.route("/")
  .post(createSpot)
  .get(getSpots);

// Public list for Booking page (only available spots, limited fields)
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

// Allow :id to be either Mongo ObjectId or customCode
router.route("/:id")
  .get(getSpotById)
  .put(updateSpot)
  .delete(deleteSpot);

module.exports = router;
