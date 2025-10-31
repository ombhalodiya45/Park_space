const Vehicle = require("../models/Vehicle");
const User = require("../models/User");

exports.addVehicleController = async (req, res) => {
  try {
    // Accept either normalized userId or _id
    const userId = req.user?.userId || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized. Please log in again." });
    }

    const { vehicleNumber, brand, model } = req.body;

    if (!vehicleNumber || !brand || !model) {
      return res.status(400).json({ message: "Complete all vehicle fields." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const existingVehicle = await Vehicle.findOne({ plate: vehicleNumber, userId });
    if (existingVehicle) {
      return res.status(400).json({ message: "Vehicle already exists." });
    }

    const newVehicle = new Vehicle({
      userId,
      make: brand,
      model,
      plate: vehicleNumber
    });

    await newVehicle.save();

    return res.status(201).json({
      message: "Vehicle added successfully.",
      vehicle: newVehicle
    });
  } catch (err) {
    console.error("Error adding vehicle:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
};
