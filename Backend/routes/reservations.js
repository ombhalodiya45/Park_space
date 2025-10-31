// routes/reservations.js
const express = require("express");
const crypto = require("crypto");
const Reservation = require("../models/Reservation");
const Vehicle = require("../models/Vehicle");
const Spot = require("../models/Spot");
const authenticateMiddleware = require("../middleware/authMiddleware");

// Import vehicleRequired to match your export style:
// If you exported as module.exports = { vehicleRequired } use braces; if module.exports = vehicleRequired, remove braces.
let vehicleRequired = require("../middleware/vehicleRequired");
if (vehicleRequired && vehicleRequired.vehicleRequired) {
  vehicleRequired = vehicleRequired.vehicleRequired; // handle both export styles safely
}

const router = express.Router();

async function isAvailable(slotId, start, end) {
  const clash = await Reservation.findOne({
    slotId,
    status: { $in: ["held", "confirmed"] },
    $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
  }).lean();
  return !clash;
}

// POST /api/reservations/hold
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
      holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 mins
    });

    return res.json({ reservationId: hold._id, amount });
  } catch (e) {
    console.error("Hold error:", e);
    return res.status(500).json({ message: "Hold failed" });
  }
});

// POST /api/reservations/:id/confirm
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

// GET /api/reservations/:id
router.get("/:id", authenticateMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await Reservation.findOne({ _id: id, userId: req.user._id })
      .populate("vehicleId")
      .populate("slotId")
      .populate("userId", "name email")
      .lean();
    if (!r) return res.status(404).json({ message: "Reservation not found" });
    return res.json({
      _id: r._id,
      status: r.status,
      confirmationCode: r.confirmationCode,
      user: r.userId,
      vehicle: r.vehicleId,
      slot: r.slotId,
      amount: r.amount,
      startTime: r.startTime,
      endTime: r.endTime,
    });
  } catch (e) {
    console.error("Get error:", e);
    return res.status(500).json({ message: "Fetch failed" });
  }
});

// GET /api/reservations/mine/list
router.get("/mine/list", authenticateMiddleware, async (req, res) => {
  try {
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

module.exports = router;
