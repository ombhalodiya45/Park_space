// routes/reservations.js
const express = require("express");
const crypto = require("crypto");
const Reservation = require("../models/Reservation");
const Vehicle = require("../models/Vehicle");
const Spot = require("../models/Spot");
const authenticateMiddleware = require("../middleware/authMiddleware");

let vehicleRequired = require("../middleware/vehicleRequired");
if (vehicleRequired && vehicleRequired.vehicleRequired) {
  vehicleRequired = vehicleRequired.vehicleRequired;
}

const router = express.Router();

// 🕒 Auto-clear expired reservations
async function cleanupExpiredReservations() {
  try {
    const now = new Date();

    const result = await Reservation.updateMany(
      {
        $or: [
          { status: "held", holdExpiresAt: { $lt: now } },
          { status: "confirmed", endTime: { $lt: now } },
        ],
      },
      { $set: { status: "expired" } }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleared ${result.modifiedCount} expired reservations`);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

// Run cleanup every 2 minutes (optional)
setInterval(cleanupExpiredReservations, 2 * 60 * 1000);

// Function to check slot availability
async function isAvailable(slotId, start, end) {
  // Run cleanup before checking
  await cleanupExpiredReservations();

  const clash = await Reservation.findOne({
    slotId,
    status: { $in: ["held", "confirmed"] },
    $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
  }).lean();
  return !clash;
}

// -------------------------- HOLD RESERVATION -----------------------------
router.post("/hold", authenticateMiddleware, vehicleRequired, async (req, res) => {
  try {
    const { slotId, hours = 1 } = req.body;
    if (!slotId || hours <= 0)
      return res.status(400).json({ message: "slotId and hours required" });

    const slot = await Spot.findById(slotId).lean();
    if (!slot || slot.archived)
      return res.status(404).json({ message: "Slot not found" });

    const start = new Date();
    const end = new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);

    const free = await isAvailable(slotId, start, end);
    if (!free)
      return res.status(409).json({ message: "Slot not available for selected time" });

    const amount = Math.max(0, Number(slot.price || 0)) * Number(hours);
    const hold = await Reservation.create({
      userId: req.user._id,
      vehicleId: req.vehicle._id,
      slotId,
      status: "held",
      startTime: start,
      endTime: end,
      amount,
      holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins hold
    });

    return res.json({ reservationId: hold._id, amount });
  } catch (e) {
    console.error("Hold error:", e);
    return res.status(500).json({ message: "Hold failed" });
  }
});

// -------------------------- CONFIRM RESERVATION --------------------------
router.post("/:id/confirm", authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Reservation.findOne({ _id: id, userId: req.user._id });
    if (!r) return res.status(404).json({ message: "Reservation not found" });
    if (r.status !== "held")
      return res.status(409).json({ message: "Reservation not in held state" });
    if (r.holdExpiresAt && r.holdExpiresAt.getTime() < Date.now())
      return res.status(409).json({ message: "Hold expired" });

    const paymentStatus =
      (req.body && req.body.paymentResult && req.body.paymentResult.status) ||
      "success";

    r.status = "confirmed";
    r.payment = { provider: "offline", status: paymentStatus };
    r.confirmationCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    await r.save();

    const full = await Reservation.findById(r._id)
      .populate("vehicleId")
      .populate("slotId")
      .populate("userId", "name email")
      .lean();

    return res.json({
      reservationId: r._id,
      status: r.status,
      confirmationCode: r.confirmationCode,
      user: full.userId,
      vehicle: full.vehicleId,
      slot: full.slotId,
      amount: r.amount,
      startTime: r.startTime,
      endTime: r.endTime,
    });
  } catch (e) {
    console.error("Confirm error:", e);
    return res.status(500).json({ message: "Confirm failed" });
  }
});

// -------------------------- GET USER RESERVATIONS --------------------------
router.get("/mine/list", authenticateMiddleware, async (req, res) => {
  try {
    await cleanupExpiredReservations();
    const list = await Reservation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("_id status amount startTime endTime slotId confirmationCode")
      .populate("slotId")
      .lean();
    return res.json(list);
  } catch (e) {
    console.error("List error:", e);
    return res.status(500).json({ message: "List failed" });
  }
});

// -------------------------- SINGLE STEP CONFIRM BOOKING --------------------------
router.post("/", authenticateMiddleware, async (req, res) => {
  try {
    await cleanupExpiredReservations();

    const userId = req.user._id;
    const { slotId, vehicleId, hours = 1, slots = [], pricePerSlot = 0 } = req.body;

    if (!slotId || !vehicleId || Number(hours) <= 0) {
      return res.status(400).json({ message: "slotId, vehicleId and hours are required" });
    }

    const spot = await Spot.findById(slotId).lean();
    if (!spot || spot.archived) {
      return res.status(404).json({ message: "Slot not found" });
    }

    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId }).lean();
    if (!vehicle) {
      return res.status(400).json({ message: "Invalid vehicle" });
    }

    const start = new Date();
    const end = new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);

    const free = await isAvailable(slotId, start, end);
    if (!free) {
      return res.status(409).json({ message: "Slot not available for selected time" });
    }

    const amount =
      (Math.max(0, Number(spot.price || 0)) || Number(pricePerSlot) || 0) *
      Number(hours) *
      (Array.isArray(slots) ? slots.length || 1 : 1);

    const reservation = await Reservation.create({
      userId,
      vehicleId,
      slotId,
      status: "confirmed",
      startTime: start,
      endTime: end,
      amount,
    });

    return res.status(201).json({
      reservationId: reservation._id,
      amount,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
    });
  } catch (e) {
    console.error("Create reservation error:", e);
    return res.status(500).json({ message: "Internal error creating reservation" });
  }
});

module.exports = router;
