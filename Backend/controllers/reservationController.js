const Reservation = require("../models/Reservation");
const Spot = require("../models/Spot");
const crypto = require("crypto");

exports.createReservation = async (req, res) => {
  try {
    const { slotId, vehicleId, hours, pricePerSlot } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!slotId || !vehicleId || !hours) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch slot to ensure it's available
    const spot = await Spot.findById(slotId);
    if (!spot) return res.status(404).json({ message: "Parking spot not found" });

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
    const amount = pricePerSlot * hours;

    const reservation = await Reservation.create({
      userId,
      vehicleId,
      slotId,
      status: "confirmed",
      startTime,
      endTime,
      amount,
      confirmationCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      payment: {
        provider: "cash",
        intentId: crypto.randomUUID(),
        status: "success",
      },
    });

    res.status(201).json({
      message: "Reservation created successfully",
      reservationId: reservation._id,
      confirmationCode: reservation.confirmationCode,
    });
  } catch (err) {
    console.error("Reservation Error:", err);
    res.status(500).json({ message: "Could not create reservation" });
  }
};
