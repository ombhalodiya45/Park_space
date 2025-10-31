// middleware/vehicleRequired.js
const Vehicle = require("../models/Vehicle");

async function vehicleRequired(req, res, next) {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) return res.status(400).json({ message: "vehicleId required" });
    const v = await Vehicle.findOne({ _id: vehicleId, userId: req.user._id });
    if (!v) return res.status(409).json({ message: "Add/select a valid vehicle" });
    req.vehicle = v;
    next();
  } catch (e) {
    return res.status(500).json({ message: "Vehicle check failed" });
  }
}

module.exports = { vehicleRequired };
