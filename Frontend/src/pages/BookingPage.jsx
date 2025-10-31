// src/pages/BookingPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function apiGet(path, opts = {}) {
  const r = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...opts,
  });
  if (!r.ok) throw new Error(`GET ${path} failed`);
  return r.json();
}

export default function BookingPage() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [user, setUser] = useState(null); // added
  const navigate = useNavigate();
  const location = useLocation(); // added

  useEffect(() => {
    const load = async () => {
      try {
        const [spotsData, me] = await Promise.all([
          apiGet("/admin/spots/public/list"),
          apiGet("/auth/me").catch(() => null), // tolerate anonymous
        ]);
        setSpots(spotsData);
        setUser(me);
      } catch (e) {
        console.error("Failed to load:", e);
        alert("Could not load available spots.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = spots.filter((s) => {
    const text = `${s._id ?? ""} ${s.name ?? ""} ${s.location ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  // updated: guard for login + vehicle before proceeding
  const handleBookNow = (id) => {
    const returnTo = location.pathname + location.search;
    // not logged in → go login first (and come back)
    if (!user) {
      navigate("/login", { state: { returnTo } });
      return;
    }
    // no vehicle on file → go add-vehicle, then return here
    const hasVehicle =
      user?.vehicle && (user.vehicle.plate || user.vehicle.number || user.vehicle.regNo);
    if (!hasVehicle) {
      navigate("/add-vehicle", {
        state: { returnTo, after: { kind: "book-slot", spotId: id } },
        replace: true,
      });
      return;
    }
    // ready to book
    navigate(`/slot-reservation/${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-gray-900">
                Book Your Parking Slot
              </h1>
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                Find an available spot near the destination and reserve instantly.
              </p>
            </div>

            {/* Search input */}
            <div className="w-full md:w-auto">
              <label htmlFor="booking-search" className="sr-only">Search spots</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m19 19-4-4m1-6a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    />
                  </svg>
                </span>
                <input
                  id="booking-search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or location..."
                  className="w-full md:w-80 lg:w-96 pl-10 pr-3 py-2 rounded-lg border border-gray-300 bg-white text-sm sm:text-base focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="text-gray-600">Loading spots...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">
              No available spots match the search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((slot, index) => (
                <div
                  key={slot._id || index}
                  className="group bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 truncate">{slot.name}</h2>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{slot._id}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${slot.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {slot.available ? "Available" : "Full"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <p className="text-sm text-gray-600">
                      <span className="mr-1.5">📍</span>
                      {slot.location}
                    </p>
                    <p className="text-sm text-gray-800">
                      <span className="mr-1.5">💰</span>₹{slot.price}/hr
                    </p>
                  </div>

                  <button
                    disabled={!slot.available}
                    onClick={() => handleBookNow(slot._id)}
                    className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold ${
                      slot.available
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {slot.available ? "Book Now" : "Unavailable"}
                  </button>

                  {/* Optional hint when no vehicle */}
                  {!loading && user && slot.available && !(user?.vehicle && (user.vehicle.plate || user.vehicle.number || user.vehicle.regNo)) && (
                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      Add your vehicle to continue booking.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="md:hidden fixed bottom-3 left-3 right-3 pointer-events-none">
          <div className="bg-white/90 backdrop-blur border border-gray-200 rounded-lg p-2 text-center text-xs text-gray-600 shadow-sm">
            Tip: Tap a card to see details and press Book Now to proceed.
          </div>
        </div>
      )}
    </div>
  );
}
