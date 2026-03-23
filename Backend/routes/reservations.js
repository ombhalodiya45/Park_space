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

// ─── Helper: parse "HH:MM" on a given date string ────────────────────────────
const parseDateTime = (dateStr, timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const dt = new Date(dateStr + "T00:00:00");
  dt.setHours(h, m, 0, 0);
  return dt;
};

// ✅ Check if a spot has no overlapping active reservation in [start, end]
async function isAvailable(slotId, start, end) {
  const now = new Date();
  const clash = await Reservation.findOne({
    slotId,
    status: { $in: ["held", "confirmed"] },
    startTime: { $lt: end },
    $and: [
      { endTime: { $gt: start } },
      { endTime: { $gt: now } }, // ✅ ignore already-finished reservations
    ],
  }).lean();
  return !clash;
}

// ✅ Check if specific slot labels are free in [start, end]
async function areSlotsAvailable(slotId, slots, start, end) {
  if (!Array.isArray(slots) || slots.length === 0) return true;
  const now = new Date();
  const conflict = await Reservation.findOne({
    slotId,
    status: { $in: ["held", "confirmed"] },
    slots:  { $in: slots },
    startTime: { $lt: end },
    $and: [
      { endTime: { $gt: start } },
      { endTime: { $gt: now } }, // ✅ ignore already-finished reservations
    ],
  }).lean();
  return !conflict;
}

// -------------------------- AVAILABILITY CHECK ---------------------------
// GET /api/reservations/availability?spotId=&date=&startTime=&endTime=
router.get("/availability", async (req, res) => {
  try {
    const { spotId, date, startTime, endTime } = req.query;

    if (!spotId || !date || !startTime || !endTime) {
      return res.status(400).json({
        message: "spotId, date, startTime and endTime are required.",
      });
    }

    const reqStart = parseDateTime(date, startTime);
    const reqEnd   = parseDateTime(date, endTime);

    if (isNaN(reqStart) || isNaN(reqEnd)) {
      return res.status(400).json({ message: "Invalid date or time format." });
    }

    const now = new Date();

    // ✅ Real-time check — slots whose endTime has passed are automatically excluded
    const overlapping = await Reservation.find({
      slotId: spotId,
      status: { $in: ["confirmed", "held"] },
      startTime: { $lt: reqEnd },
      $and: [
        { endTime: { $gt: reqStart } },
        { endTime: { $gt: now } }, // ✅ key: exclude slots whose time is already over
      ],
    }).select("slots -_id").lean();

    const bookedSlots = [
      ...new Set(
        overlapping.flatMap(r => Array.isArray(r.slots) ? r.slots : [])
      ),
    ];

    return res.json({ bookedSlots });
  } catch (err) {
    console.error("Availability Error:", err);
    res.status(500).json({ message: "Could not fetch availability." });
  }
});

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
    const end   = new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);

    const free = await isAvailable(slotId, start, end);
    if (!free)
      return res.status(409).json({ message: "Slot not available for selected time" });

    const amount = Math.max(0, Number(slot.price || 0)) * Number(hours);
    const hold   = await Reservation.create({
      userId:        req.user._id,
      vehicleId:     req.vehicle._id,
      slotId,
      status:        "held",
      startTime:     start,
      endTime:       end,
      amount,
      holdExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
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

    const paymentStatus = (req.body?.paymentResult?.status) || "success";

    r.status           = "confirmed";
    r.payment          = { provider: "offline", status: paymentStatus };
    r.confirmationCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    await r.save();

    const full = await Reservation.findById(r._id)
      .populate("vehicleId")
      .populate("slotId")
      .populate("userId", "name email")
      .lean();

    return res.json({
      reservationId:    r._id,
      status:           r.status,
      confirmationCode: r.confirmationCode,
      user:             full.userId,
      vehicle:          full.vehicleId,
      slot:             full.slotId,
      amount:           r.amount,
      startTime:        r.startTime,
      endTime:          r.endTime,
    });
  } catch (e) {
    console.error("Confirm error:", e);
    return res.status(500).json({ message: "Confirm failed" });
  }
});

// -------------------------- GET USER RESERVATIONS ------------------------
router.get("/mine/list", authenticateMiddleware, async (req, res) => {
  try {
    const list = await Reservation.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("_id status amount startTime endTime slotId confirmationCode slots")
      .populate("slotId")
      .lean();
    return res.json(list);
  } catch (e) {
    console.error("List error:", e);
    return res.status(500).json({ message: "List failed" });
  }
});

// -------------------------- SINGLE STEP CONFIRM BOOKING ------------------
router.post("/", authenticateMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      slotId,
      vehicleId,
      hours        = 1,
      slots        = [],
      pricePerSlot = 0,
      bookingDate,
      startTime,
      endTime,
    } = req.body;

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

    // ✅ Use bookingDate + startTime/endTime if provided, else fallback to now
    let start, end;
    if (bookingDate && startTime && endTime) {
      start = parseDateTime(bookingDate, startTime);
      end   = parseDateTime(bookingDate, endTime);
    } else {
      start = new Date();
      end   = new Date(start.getTime() + Number(hours) * 60 * 60 * 1000);
    }

    const free = await isAvailable(slotId, start, end);
    if (!free) {
      return res.status(409).json({ message: "Slot not available for selected time" });
    }

    const slotsAreFree = await areSlotsAvailable(slotId, slots, start, end);
    if (!slotsAreFree) {
      return res.status(409).json({
        message: `One of the selected slots (${slots.join(", ")}) is already booked for this time.`,
      });
    }

    const amount =
      (Math.max(0, Number(spot.price || 0)) || Number(pricePerSlot) || 0) *
      Number(hours) *
      (Array.isArray(slots) ? slots.length || 1 : 1);

    const reservation = await Reservation.create({
      userId,
      vehicleId,
      slotId,
      slots,
      status:    "confirmed",
      startTime: start,
      endTime:   end,
      amount,
      confirmationCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      payment: {
        provider: "cash",
        intentId: crypto.randomUUID(),
        status:   "success",
      },
    });

    return res.status(201).json({
      reservationId:    reservation._id,
      confirmationCode: reservation.confirmationCode,
      amount,
      startTime:        reservation.startTime,
      endTime:          reservation.endTime,
    });
  } catch (e) {
    console.error("Create reservation error:", e);
    return res.status(500).json({ message: "Internal error creating reservation" });
  }
});

// -------------------------- GET SINGLE RESERVATION (for ticket) ----------
router.get("/:id", authenticateMiddleware, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("userId",    "fullName email")
      .populate("vehicleId", "make model plate")
      .populate("slotId",    "name location")
      .lean();

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    return res.json({
      _id:              reservation._id,
      status:           reservation.status,
      amount:           reservation.amount,
      startTime:        reservation.startTime,
      endTime:          reservation.endTime,
      confirmationCode: reservation.confirmationCode,
      slots:            reservation.slots,
      user:             reservation.userId,
      vehicle:          reservation.vehicleId,
      slot:             reservation.slotId,
    });
  } catch (e) {
    console.error("Get reservation error:", e);
    res.status(500).json({ message: "Could not fetch reservation" });
  }
});

module.exports = router;