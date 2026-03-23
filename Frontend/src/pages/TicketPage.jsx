// src/pages/TicketPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = async (p) => {
  const r = await fetch(API_BASE + p, { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const safe = (v, fallback = "-") => (v == null || v === "" ? fallback : v);

const fmt = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", {
    day:    "2-digit",
    month:  "short",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export default function TicketPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    if (!id) { navigate("/booking", { replace: true }); return; }
    (async () => {
      try {
        const res = await api(`/reservations/${id}`);
        setData(res);
      } catch (e) {
        console.error("Ticket load error:", e);
        setError("Could not load ticket. The reservation may not exist.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-500">Loading ticket…</p>
    </div>
  );

  if (error || !data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-red-500">{error || "Ticket not found."}</p>
      <button
        className="px-4 py-2 rounded-lg bg-blue-600 text-white"
        onClick={() => navigate("/booking")}
      >
        Back to Booking
      </button>
    </div>
  );

  // ✅ All dynamic fields from real DB response
  const userName        = safe(data.user?.fullName, safe(data.user?.name, "Guest"));
  const userEmail       = safe(data.user?.email);
  const vehicleMake     = safe(data.vehicle?.make);
  const vehicleModel    = safe(data.vehicle?.model);
  const vehiclePlate    = safe(data.vehicle?.plate, "").toUpperCase();
  const slotName        = safe(data.slot?.name);
  const slotLocation    = safe(data.slot?.location);
  const startTime       = fmt(data.startTime);
  const endTime         = fmt(data.endTime);
  const reservationId   = safe(data._id, id);
  const confirmCode     = safe(data.confirmationCode);
  const status          = safe(data.status, "confirmed");
  const amount          = data.amount ?? 0;
  const slots           = Array.isArray(data.slots) && data.slots.length > 0
                            ? data.slots.join(", ")
                            : slotName;

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Parking Ticket</h1>

      <div className="bg-white border rounded-xl p-5 grid gap-4 shadow-sm">

        {/* Header row */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Customer</p>
            <p className="font-semibold text-gray-900">{userName}</p>
            {userEmail !== "-" && (
              <p className="text-xs text-gray-500 mt-0.5">{userEmail}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Amount Paid</p>
            <p className="text-xl font-bold text-blue-600">₹{amount}</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
              status === "confirmed"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {status.toUpperCase()}
            </span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Info grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          <Info label="Vehicle"          value={`${vehicleMake} ${vehicleModel} • ${vehiclePlate}`} />
          <Info label="Parking Slot"     value={slots} />
          <Info label="Location"         value={slotLocation} />
          <Info label="Confirmation Code"value={confirmCode} />
          <Info label="Check In"         value={startTime} />
          <Info label="Check Out"        value={endTime} />
          <Info label="Reservation ID"   value={reservationId} mono />
          <Info label="Status"           value={status} />
        </div>

        {/* Actions */}
        <div className="mt-2 flex gap-3 justify-end flex-wrap">
          <button
            className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
            onClick={() => navigate("/booking")}
          >
            Back to Booking
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            onClick={() => window.print()}
          >
            Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-semibold break-words text-gray-900 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}