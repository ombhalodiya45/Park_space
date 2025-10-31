import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";



const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Keep static grid; only price is dynamic from admin by-id payload
const USE_STATIC = true;
const DEFAULT_PRICE = 50;



// Static two-pillar layout
const STATIC_LEFT = [
  { spotNumber: "P1", status: "available" },
  { spotNumber: "P2", status: "notAvailable" },
  { spotNumber: "P3", status: "available" },
  { spotNumber: "P4", status: "notAvailable" },
  { spotNumber: "P5", status: "available" },
  { spotNumber: "P6", status: "available" },
  { spotNumber: "P7", status: "booked" },
  { spotNumber: "P8", status: "available" },
  { spotNumber: "P9", status: "available" },
  { spotNumber: "P10", status: "notAvailable" },
].map((s) => ({ ...s, pillar: "P" }));

const STATIC_RIGHT = [
  { spotNumber: "S1", status: "available" },
  { spotNumber: "S2", status: "available" },
  { spotNumber: "S3", status: "available" },
  { spotNumber: "S4", status: "booked" },
  { spotNumber: "S5", status: "notAvailable" },
  { spotNumber: "S6", status: "available" },
  { spotNumber: "S7", status: "available" },
  { spotNumber: "S8", status: "booked" },
  { spotNumber: "S9", status: "available" },
  { spotNumber: "S10", status: "notAvailable" },
].map((s) => ({ ...s, pillar: "S" }));

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function SlotReservationPage() {
  const { id, locationName } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);     // holds admin data including price
  const [loading, setLoading] = useState(!!id); // only load when id is present
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");

  // Fetch the spot (for price) when id present
  useEffect(() => {
    const loadPrice = async () => {
      if (!id) {
        setDoc(null);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/admin/spots/by-id/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error("Failed to fetch spot by id");
        const data = await res.json();
        setDoc(data || null);
      } catch (e) {
        console.error(e);
        setError("Could not load price for this spot. Using default.");
        setDoc(null);
      } finally {
        setLoading(false);
      }
    };
    loadPrice();
  }, [id]);

  // Dynamic price from admin (fallback to DEFAULT_PRICE)
  const pricePerSlot = useMemo(() => {
    const p = Number(doc?.price);
    if (Number.isFinite(p) && p >= 0) return p;
    return DEFAULT_PRICE;
  }, [doc?.price]);

  // Build static items (layout remains the same)
  const items = useMemo(() => {
    return [...STATIC_LEFT, ...STATIC_RIGHT].map((s, idx) => ({
      id: `${s.pillar}:${s.spotNumber}:${idx}`,
      label: s.spotNumber,
      status: s.status,
      pillar: s.pillar,
    }));
  }, []);

  const pItems = items.filter((x) => x.pillar === "P");
  const sItems = items.filter((x) => x.pillar === "S");
  const leftPillars = chunk(pItems, 10);
  const rightPillars = chunk(sItems, 10);

  const selectedCount = selected.length;
  const totalAmount = selectedCount * pricePerSlot;

  const toggle = (label, status) => {
    if (status !== "available") return;
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  };

  const tileClass = (label, status) => {
    if (selected.includes(label)) return "bg-green-500 text-white shadow-lg";
    if (status === "booked") return "bg-red-500 text-white";
    if (status === "available") return "bg-gray-300";
    if (status === "notAvailable")
      return "border-2 border-dashed border-gray-400 text-gray-400";
    return "";
  };

  const Title = () => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-lg font-bold">BOOK YOUR SLOT</h2>
        <p className="text-xs text-gray-500 mt-1">
          Price: ₹{pricePerSlot}/hr • Available groups: {leftPillars.length + rightPillars.length}
        </p>
      </div>
      {/* Filter button removed */}
    </div>
  );

  const Legend = () => (
    <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-green-500 rounded-sm" /> Your Selection
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-red-500 rounded-sm" /> Booked
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-300 rounded-sm" /> Available
      </div>
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 border-2 border-dashed border-gray-400" /> Not Available
      </div>
    </div>
  );

  const PillarGrid = ({ groups, pillarName }) => (
    <div className="space-y-10">
      {groups.map((pillarSlots, index) => (
        <div key={`${pillarName}-${index}`} className="space-y-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {pillarSlots.slice(0, 5).map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggle(slot.label, slot.status)}
                className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${tileClass(
                  slot.label,
                  slot.status
                )}`}
              >
                {slot.label}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500">PILLAR NO {index + 1}</p>

          {pillarSlots.length > 5 && (
            <div className="flex flex-wrap gap-4 justify-center">
              {pillarSlots.slice(5, 10).map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => toggle(slot.label, slot.status)}
                  className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${tileClass(
                    slot.label,
                    slot.status
                  )}`}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return <div className="text-center p-10">Loading price…</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <Title />
          <Legend />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="mx-auto max-w-7xl bg-white shadow rounded-xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <PillarGrid groups={leftPillars} pillarName="P" />
            <PillarGrid groups={rightPillars} pillarName="S" />
          </div>

          <div className="flex justify-between text-sm mt-6">
            <span className="ml-4">ENTRY</span>
            <span className="mr-4">EXIT</span>
          </div>
        </div>
      </div>

      {/* Booking details */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Slot Name</span>: {selected.join(", ") || "—"}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Total Slots</span>: {selected.length}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Total Amount</span>: ₹{selected.length * pricePerSlot}
          </div>
          <button
  className={`rounded-lg px-5 py-2 font-semibold ${
    selected.length > 0
      ? "bg-blue-600 text-white hover:bg-blue-700"
      : "bg-gray-200 text-gray-500 cursor-not-allowed"
  }`}
  onClick={() => {
    // Check login using localStorage (assuming you store JWT there)
    const token = localStorage.getItem("token");

    if (!token) {
      // Redirect to login if not logged in
      window.location.href = "/login";
      return;
    }

    // If logged in and slots selected
    if (selected.length > 0) {
      alert(
        `Booked: ${selected.join(", ")} • Amount ₹${selected.length * pricePerSlot}`
      );
    } else {
      alert("Please select at least one slot before booking.");
    }
  }}
>
  Book Slot
</button>

        </div>
      </div>
    </div>
  );
}
