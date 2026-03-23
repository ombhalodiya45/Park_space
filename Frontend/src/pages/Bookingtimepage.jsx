import React, { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../BookingTimePage.css";

// ─── SVG Icon components ─────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11z" />
    <circle cx="12" cy="10" r="2" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const IconTimer = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2 2M9 3h6M12 3v2" />
  </svg>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTodayDate = () => new Date().toISOString().split("T")[0];

const getDefaultStart = () => {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now.toTimeString().slice(0, 5);
};

const addOneHour = (t) => {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h + 1, m, 0, 0);
  return d.toTimeString().slice(0, 5);
};

const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};

const fmtDateShort = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function BookingTimePage() {
  const { id, locationName } = useParams();
  const navigate = useNavigate();

  const [date, setDate] = useState(getTodayDate());
  const [startTime, setStartTime] = useState(getDefaultStart());
  const endTime = useMemo(() => addOneHour(startTime), [startTime]);

  const decoded = locationName ? decodeURIComponent(locationName) : "Parking Location";

  const handleContinue = () => {
    navigate(`/slot-reservation/${id}/${locationName}`, {
      state: { bookingDate: date, startTime, endTime, duration: "1 hour" },
    });
  };

  return (
    <div className="btp-root">
      <div className="btp-card">

        {/* Back */}
        <button className="btp-back" onClick={() => navigate(-1)}>
          <IconArrowLeft />
          Back
        </button>

        {/* Location badge */}
        <div className="btp-loc-badge">
          <IconMapPin />
          <span className="btp-loc-text">{decoded}</span>
        </div>

        {/* Heading */}
        <h1 className="btp-heading">When do you<br />want to park?</h1>
        <p className="btp-sub">
          Select your date and arrival time — we'll hold your slot for 1 hour.
        </p>

        {/* ── Date ── */}
        <label className="btp-label">
          <IconCalendar />
          Date
        </label>
        <div className="btp-input-wrap">
          <input
            type="date"
            min={getTodayDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="btp-input"
          />
        </div>
        {date && <p className="btp-hint">{fmtDate(date)}</p>}

        {/* ── Time row ── */}
        <div className="btp-time-row">
          <div className="btp-time-col">
            <label className="btp-label">
              <IconClock />
              Arrival
            </label>
            <div className="btp-input-wrap">
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="btp-input"
              />
            </div>
          </div>

          <div className="btp-arrow">
            <IconArrowRight />
          </div>

          <div className="btp-time-col">
            <label className="btp-label">
              <IconClock />
              Departure
            </label>
            <div className="btp-input-wrap disabled">
              <input
                type="time"
                value={endTime}
                disabled
                className="btp-input"
              />
            </div>
          </div>
        </div>

        {/* Duration chip */}
        <div className="btp-duration-chip">
          <span className="btp-chip-dot" />
          <IconTimer />
          Duration: <strong style={{ marginLeft: 2 }}>1 Hour</strong>
        </div>

        {/* Summary */}
        <div className="btp-summary">
          <div className="btp-summary-row">
            <span className="btp-summary-label">Date</span>
            <span className="btp-summary-val">{fmtDateShort(date) || "—"}</span>
          </div>
          <div className="btp-divider" />
          <div className="btp-summary-row">
            <span className="btp-summary-label">Time Slot</span>
            <span className="btp-summary-val">{fmt12(startTime)} – {fmt12(endTime)}</span>
          </div>
          <div className="btp-divider" />
          <div className="btp-summary-row">
            <span className="btp-summary-label">Location</span>
            <span className="btp-summary-val">{decoded}</span>
          </div>
        </div>

        {/* CTA */}
        <button className="btp-cta" onClick={handleContinue}>
          View Available Slots
          <IconChevronRight />
        </button>

        <p className="btp-note">You can change your time before confirming the booking.</p>
      </div>
    </div>
  );
}