const jwt = require("jsonwebtoken");
const Ownership = require("../models/Ownership");
const Admin = require("../models/Admin");

async function requireAdmin(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const admin = await Admin.findById(payload.sub);
    if (!admin || !admin.active) return res.status(401).json({ message: "Invalid admin" });

    req.admin = { _id: admin._id, role: admin.role };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Allow superadmin always; owners only if they own the spot
async function requireSpotOwner(req, res, next) {
  try {
    const admin = req.admin;
    if (!admin) return res.status(401).json({ message: "Unauthorized" });
    if (admin.role === "superadmin") return next();

    const spotId = req.params.id || req.params.spotId || req.body?.spotId;
    if (!spotId) return res.status(400).json({ message: "spotId is required" });

    const owns = await Ownership.findOne({ admin: admin._id, spot: spotId }).lean();
    if (!owns) return res.status(403).json({ message: "Not owner of this spot" });

    return next();
  } catch (err) {
    return res.status(403).json({ message: "Forbidden" });
  }
}

module.exports = { requireAdmin, requireSpotOwner };
