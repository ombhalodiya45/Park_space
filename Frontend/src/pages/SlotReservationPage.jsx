import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "../SlotReservationPage.css";

const API_BASE      = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const DEFAULT_PRICE = 50;
const MAX_SLOTS     = 1;
const POLL_INTERVAL = 30000; // ✅ 30 seconds

const SLOTS_LEFT  = ["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10"];
const SLOTS_RIGHT = ["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10"];
const ALL_SLOTS   = [...SLOTS_LEFT, ...SLOTS_RIGHT];

// ─── SVG Icons ───────────────────────────────────────────────────────────────
const IconArrowLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
  </svg>
);
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11z"/><circle cx="12" cy="10" r="2"/>
  </svg>
);
const IconCar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><rect x="7" y="17" width="2" height="2" rx="1"/><rect x="15" y="17" width="2" height="2" rx="1"/><path d="M5 12h14"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
);
const IconWarning = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);


// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12).toString().padStart(2,"0")}:${m.toString().padStart(2,"0")} ${ampm}`;
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function SlotReservationPage() {
  const { id, locationName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { bookingDate, startTime, endTime, duration } = location.state || {};

  const [doc,         setDoc]         = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [avLoading,   setAvLoading]   = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selected,    setSelected]    = useState([]);
  const [error,       setError]       = useState("");
  const [warning,     setWarning]     = useState("");

  const decoded = locationName ? decodeURIComponent(locationName) : "Parking";

  // ─── Load price ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!bookingDate || !startTime) {
      navigate(`/booking-time/${id}/${locationName}`, { replace: true });
      return;
    }
    const loadPrice = async () => {
      if (!id) { setLoading(false); return; }
      try {
        const res  = await fetch(`${API_BASE}/admin/spots/by-id/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setDoc(data || null);
      } catch {
        setError("Could not load price. Using default.");
      } finally {
        setLoading(false);
      }
    };
    loadPrice();
  }, [id]);

  // ─── fetchAvailability (useCallback so it can be used in interval) ────────
  const fetchAvailability = useCallback(async () => {
    if (!id || !bookingDate || !startTime) return;
    setAvLoading(true);
    try {
      // ✅ Use max possible endTime (startTime + 6hrs) so ALL booked slots
      // are detected regardless of how many hours someone booked (1-6hrs)
      const addHrs = (t, h) => {
        const [hh, mm] = t.split(":").map(Number);
        const total = hh * 60 + mm + h * 60;
        return `${String(Math.floor(total/60)%24).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
      };
      const maxEndTime = addHrs(startTime, 6);

      const params = new URLSearchParams({
        spotId:    id,
        date:      bookingDate,
        startTime: startTime,
        endTime:   maxEndTime, // ✅ check full 6hr window to catch all bookings
      });
      const res  = await fetch(`${API_BASE}/reservations/availability?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const booked = data.bookedSlots || [];
      setBookedSlots(booked);

      // ✅ If selected slot just got booked by someone else → deselect + warn
      setSelected(prev => {
        if (prev.length > 0 && booked.includes(prev[0])) {
          setWarning(`Slot ${prev[0]} was just booked by someone else. Please choose another.`);
          return [];
        }
        return prev;
      });
    } catch {
      // silent fail on poll — don't show error on every poll
    } finally {
      setAvLoading(false);
    }
  }, [id, bookingDate, startTime]); // ✅ no endTime dependency — we calculate it inside

  // ─── Load availability + start 30s polling ───────────────────────────────
  useEffect(() => {
    if (!id || !bookingDate || !startTime) return;

    // fetch immediately
    fetchAvailability();

    // ✅ poll every 30 seconds for real-time updates
    const interval = setInterval(fetchAvailability, POLL_INTERVAL);

    // ✅ cleanup on unmount
    return () => clearInterval(interval);
  }, [fetchAvailability]);

  const pricePerSlot = useMemo(() => {
    const p = Number(doc?.price);
    return Number.isFinite(p) && p >= 0 ? p : DEFAULT_PRICE;
  }, [doc?.price]);

  // ─── Slot toggle with max 1 ───────────────────────────────────────────────
  const toggle = (label) => {
    setWarning("");

    if (bookedSlots.includes(label)) {
      setWarning(`Slot ${label} is already booked for this time. Please choose another.`);
      return;
    }

    setSelected(prev => {
      if (prev.includes(label)) return [];
      if (prev.length >= MAX_SLOTS) {
        setWarning(`Only 1 slot allowed per booking. Deselect "${prev[0]}" first.`);
        return prev;
      }
      return [label];
    });
  };

  const getSlotClass = (label) => {
    if (selected.includes(label))    return "srp-tile selected";
    if (bookedSlots.includes(label)) return "srp-tile booked";
    return "srp-tile available";
  };

  const handleBookNow = () => {
    if (selected.length === 0) {
      setWarning("Please select a slot before booking.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { returnTo: `/slot-reservation/${id}/${locationName}` } });
      return;
    }
    navigate("/checkout", {
      state: {
        spotId: id,
        locationName,
        slots: selected,
        pricePerSlot,
        totalAmount: selected.length * pricePerSlot,
        bookingDate,
        startTime,
        endTime,
        duration,
      }
    });
  };

  if (loading) return (
    <div className="srp-load-wrap">
      <div className="srp-spinner" />
      <p className="srp-load-text">Loading slots…</p>
    </div>
  );


  return (
    <div className="srp-root">

      {/* ── Sticky Header ── */}
      <div className="srp-header">
        <div className="srp-header-inner">
          <div>
            <button className="srp-back-btn" onClick={() => navigate(-1)}>
              <IconArrowLeft /><span>Change Time</span>
            </button>
            <div className="srp-title-row">
              <h2 className="srp-title">Select a Slot</h2>
              <div className="srp-loc-badge">
                <IconMapPin />
                <span className="srp-loc-text">{decoded}</span>
              </div>
            </div>
          </div>

          {bookingDate && startTime && (
            <div className="srp-time-pill">
              <IconClock />
              <div>
                <div className="srp-time-main">{fmt12(startTime)} – {fmt12(endTime)}</div>
                <div className="srp-time-sub">{fmtDate(bookingDate)} · 1 hr</div>
              </div>
            </div>
          )}
        </div>

        {/* Legend + price + availability */}
        <div className="srp-legend-row">
          <span className="srp-price">₹{pricePerSlot}<span className="srp-price-unit">/hr</span></span>
          <div className="srp-legend-items">
            <div className="srp-legend-item"><div className="srp-legend-dot selected" /><span>Selected</span></div>
            <div className="srp-legend-item"><div className="srp-legend-dot booked" /><span>Booked</span></div>
            <div className="srp-legend-item"><div className="srp-legend-dot available" /><span>Available</span></div>
          </div>

          <div className="srp-max-chip">Max 1 slot per booking</div>
        </div>

        {error   && <p className="srp-error-msg">{error}</p>}
        {warning && (
          <div className="srp-warning-banner">
            <IconWarning />
            <span>{warning}</span>
            <button className="srp-warning-close" onClick={() => setWarning("")}><IconX /></button>
          </div>
        )}
      </div>

      {/* ── Slot Grid ── */}
      <div className="srp-grid-wrap">
        <div className="srp-grid-card">
          <div className="srp-grid-inner">

            {/* P Side */}
            <div className="srp-side">
              <p className="srp-side-label">P — Side</p>
              <div className="srp-slot-row">
                {SLOTS_LEFT.slice(0,5).map(label => (
                  <div key={label} onClick={() => toggle(label)} className={getSlotClass(label)}>{label}</div>
                ))}
              </div>
              <p className="srp-pillar-label">— Pillar 1 —</p>
              <div className="srp-slot-row">
                {SLOTS_LEFT.slice(5,10).map(label => (
                  <div key={label} onClick={() => toggle(label)} className={getSlotClass(label)}>{label}</div>
                ))}
              </div>
            </div>

            <div className="srp-divider" />

            {/* S Side */}
            <div className="srp-side">
              <p className="srp-side-label">S — Side</p>
              <div className="srp-slot-row">
                {SLOTS_RIGHT.slice(0,5).map(label => (
                  <div key={label} onClick={() => toggle(label)} className={getSlotClass(label)}>{label}</div>
                ))}
              </div>
              <p className="srp-pillar-label">— Pillar 1 —</p>
              <div className="srp-slot-row">
                {SLOTS_RIGHT.slice(5,10).map(label => (
                  <div key={label} onClick={() => toggle(label)} className={getSlotClass(label)}>{label}</div>
                ))}
              </div>
            </div>

          </div>

          <div className="srp-entry-row">
            <span className="srp-entry-label">▲ ENTRY</span>
            <span className="srp-entry-label">EXIT ▲</span>
          </div>
        </div>
      </div>

      {/* ── Sticky Bottom Bar ── */}
      <div className="srp-bottom-bar">
        <div className="srp-bottom-inner">
          {selected.length === 0 ? (
            <p className="srp-bottom-hint">Tap a slot above to select it</p>
          ) : (
            <div className="srp-bottom-info">
              <div className="srp-bottom-info-item">
                <span className="srp-bottom-info-label">Slot</span>
                <span className="srp-bottom-info-val">{selected[0]}</span>
              </div>
              <div className="srp-bottom-info-item">
                <span className="srp-bottom-info-label">Time</span>
                <span className="srp-bottom-info-val">{fmt12(startTime)} – {fmt12(endTime)}</span>
              </div>
              <div className="srp-bottom-info-item">
                <span className="srp-bottom-info-label">Total</span>
                <span className="srp-bottom-info-val total">₹{pricePerSlot}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleBookNow}
            className={`srp-book-btn ${selected.length > 0 ? "active" : "disabled"}`}
          >
            <IconCar />Book Now<IconChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
}