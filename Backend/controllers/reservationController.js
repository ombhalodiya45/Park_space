const Reservation = require("../models/Reservation");
const Spot = require("../models/Spot");
const crypto = require("crypto");

// ─── Helper: parse "HH:MM" on a given date string ────────────────────────────
const parseDateTime = (dateStr, timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const dt = new Date(dateStr + "T00:00:00");
  dt.setHours(h, m, 0, 0);
  return dt;
};

// ─── GET /api/reservations/availability ──────────────────────────────────────
// Query: ?spotId=&date=2026-03-23&startTime=13:00&endTime=14:00
// Returns: { bookedSlots: ["P1", "S3", ...] }
exports.getAvailability = async (req, res) => {
  try {
    const { spotId, date, startTime, endTime } = req.query;

    if (!spotId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "spotId, date, startTime and endTime are required." });
    }

    const reqStart = parseDateTime(date, startTime);
    const reqEnd   = parseDateTime(date, endTime);

    if (isNaN(reqStart) || isNaN(reqEnd)) {
      return res.status(400).json({ message: "Invalid date or time format." });
    }

    // Find all active reservations for this spot that overlap with requested window
    const overlapping = await Reservation.find({
      slotId: spotId,
      status: { $in: ["confirmed", "held"] },
      // overlap condition: existing.startTime < reqEnd AND existing.endTime > reqStart
      startTime: { $lt: reqEnd },
      endTime:   { $gt: reqStart },
    }).select("slots -_id").lean();

    // Collect all booked slot labels (e.g. ["P1", "S3"])
    const bookedSlots = [
      ...new Set(
        overlapping.flatMap(r => Array.isArray(r.slots) ? r.slots : [])
      )
    ];

    return res.json({ bookedSlots });
  } catch (err) {
    console.error("Availability Error:", err);
    res.status(500).json({ message: "Could not fetch availability." });
  }
};

// ─── POST /api/reservations ───────────────────────────────────────────────────
exports.createReservation = async (req, res) => {
  try {
    const { slotId, vehicleId, hours, pricePerSlot, slots, bookingDate, startTime, endTime } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!slotId || !vehicleId || !hours) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Fetch spot
    const spot = await Spot.findById(slotId);
    if (!spot) return res.status(404).json({ message: "Parking spot not found" });

    // ✅ Build startTime and endTime from bookingDate + time strings if provided
    // Otherwise fall back to now + hours (old behavior)
    let start, end;
    if (bookingDate && startTime && endTime) {
      start = parseDateTime(bookingDate, startTime);
      end   = parseDateTime(bookingDate, endTime);
    } else {
      start = new Date();
      end   = new Date(start.getTime() + hours * 60 * 60 * 1000);
    }

    // ✅ Check if any selected slot is already booked in this time window
    if (Array.isArray(slots) && slots.length > 0) {
      const conflict = await Reservation.findOne({
        slotId,
        status: { $in: ["confirmed", "held"] },
        slots:  { $in: slots },
        startTime: { $lt: end },
        endTime:   { $gt: start },
      });
      if (conflict) {
        return res.status(409).json({
          message: `Slot ${conflict.slots?.find(s => slots.includes(s))} is already booked for this time. Please choose another.`
        });
      }
    }

    const amount = pricePerSlot * hours;

    const reservation = await Reservation.create({
      userId,
      vehicleId,
      slotId,
      slots: slots || [],           // ✅ store selected slot labels
      status: "confirmed",
      startTime: start,
      endTime: end,
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