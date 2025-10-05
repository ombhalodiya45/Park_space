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

// Create + list (admin) - NO CHANGE
router.route("/")
  .post(createSpot)
  .get(getSpots);

// Public list for Booking page - NO CHANGE
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

// === NEW ROUTE TO GET ALL SPOTS FOR A SPECIFIC LOCATION
// This is the route your frontend will call.

router.get("/location/:locationName", async (req, res, next) => {
  try {
    const { locationName } = req.params;
    
    // Find all spots where the 'location' field matches the locationName
    const spotsInLocation = await Spot.find({ location: locationName });

    if (!spotsInLocation || spotsInLocation.length === 0) {
      return res.status(404).json({ message: 'No spots found for this location' });
    }

    // The frontend needs the total count (capacity) and the list of spots
    res.json({
      capacity: spotsInLocation.length,
      spots: spotsInLocation
    });

  } catch (err) {
    next(err);
  }
});

// Your existing route for single spot lookup by custom code - NO CHANGE
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

// Your existing generic route for admin actions by ID - NO CHANGE
router.route("/:id")
  .get(getSpotById)
  .put(updateSpot)
  .delete(deleteSpot);

module.exports = router;
