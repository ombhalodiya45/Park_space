import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function SlotReservationPage() {
  const { id, locationName } = useParams();

  const [doc, setDoc] = useState(null);   // single location (by-id)
  const [list, setList] = useState([]);   // locations (by-location)
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]); // array of spotNumber strings, e.g., "P6"
  const [error, setError] = useState("");

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        if (id) {
          const res = await fetch(`${API_BASE}/admin/spots/by-id/${encodeURIComponent(id)}`);
          if (!res.ok) throw new Error("Failed to fetch by id");
          const data = await res.json();
          setDoc(data || null);
          setList([]);
          return;
        }

        if (locationName) {
          const res = await fetch(`${API_BASE}/admin/spots/location/${encodeURIComponent(locationName)}`);
          if (!res.ok) throw new Error("Failed to fetch by location");
          const data = await res.json();
          setList(Array.isArray(data?.spots) ? data.spots : []);
          setDoc(null);
          return;
        }

        setDoc(null);
        setList([]);
      } catch (e) {
        console.error(e);
        setError("Could not load parking data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, locationName]);

  // Normalize to one set of raw slot objects: [{spotNumber, status, pillar}]
  const rawSlots = useMemo(() => {
    if (doc) {
      const arr = Array.isArray(doc.spots) ? doc.spots : [];
      if (arr.length > 0) return arr;
      const total = Number(doc.totalSlots || 0);
      if (total > 0) {
        return Array.from({ length: total }, (_, i) => ({
          spotNumber: `P${i + 1}`,
          pillar: "P",
          status: "available",
        }));
      }
      return [];
    }
    if (Array.isArray(list) && list.length > 0) {
      const combined = list.flatMap((d) => (Array.isArray(d.spots) ? d.spots : []));
      if (combined.length > 0) return combined;
      const sum = list.reduce((s, d) => s + Number(d.totalSlots || 0), 0);
      return Array.from({ length: sum }, (_, i) => ({
        spotNumber: `P${i + 1}`,
        pillar: "P",
        status: "available",
      }));
    }
    return [];
  }, [doc, list]);

  // Derive UI items
  const items = useMemo(() => {
    // Each item has stable id, label (spotNumber), status
    return rawSlots.map((s, idx) => ({
      id: `${doc?._id || "loc"}:${s.spotNumber}:${idx}`,
      label: s.spotNumber || `P${idx + 1}`,
      status: s.status || "available",
      pillar: s.pillar || (String(s.spotNumber || "").toUpperCase().startsWith("S") ? "S" : "P"),
    }));
  }, [rawSlots, doc?._id]);

  // Split into pillars like the reference UI
  const pItems = items.filter((x) => x.pillar === "P");
  const sItems = items.filter((x) => x.pillar === "S");
  const leftPillars = chunk(pItems, 10);
  const rightPillars = chunk(sItems, 10);

  const pricePerHour = Number(doc?.price || (list[0]?.price ?? 0));
  const selectedCount = selected.length;
  const totalAmount = selectedCount * pricePerHour;

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
    if (status === "notAvailable") return "border-2 border-dashed border-gray-400 text-gray-400";
    return "";
    // Note: style classes rely on Tailwind from your project setup
  };

  const onBook = async () => {
    if (selected.length === 0) return alert("Please select at least one slot.");
    try {
      // Example booking payload; adjust endpoint to your booking API
      const payload = {
        spotId: doc?._id || list[0]?._id,
        slots: selected,           // ["P6", "P8"]
        amount: totalAmount,       // simple hourly price * count
      };
      // const res = await fetch(`${API_BASE}/bookings`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      // if (!res.ok) throw new Error("Booking failed");
      // const result = await res.json();
      // alert(`Booked successfully: ${result.reference}`);
      alert(`Booked: ${selected.join(", ")} | Amount ₹${totalAmount}`);
      setSelected([]);
    } catch (e) {
      console.error(e);
      alert("Booking failed. Try again.");
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading parking spots...</div>;
  }
  if (error) {
    return <div className="text-center p-10 text-red-600">{error}</div>;
  }

  const Title = () => (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-lg font-bold">
          {doc?.name
            ? `BOOK YOUR SLOT FOR: ${doc.name}`
            : locationName
            ? `BOOK YOUR SLOT FOR: ${locationName}`
            : "BOOK YOUR SLOT"}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Price: ₹{pricePerHour}/hr • Available groups: {leftPillars.length + rightPillars.length || 1}
        </p>
      </div>
      <button className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Filter</button>
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

  const useTwoColumns = leftPillars.length > 0 || rightPillars.length > 0;

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
          {useTwoColumns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left side: P pillars */}
              <PillarGrid groups={leftPillars} pillarName="P" />
              {/* Right side: S pillars */}
              <PillarGrid groups={rightPillars} pillarName="S" />
            </div>
          ) : (
            // Fallback unified grid if no P/S info present
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <PillarGrid groups={chunk(items, 10)} pillarName="U" />
            </div>
          )}

          {/* Entry/Exit labels */}
          <div className="flex justify-between text-sm mt-6">
            <span className="ml-4">ENTRY</span>
            <span className="mr-4">EXIT</span>
          </div>
        </div>
      </div>

      {/* Booking details footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Slot Name</span>: {selected.join(", ") || "—"}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Total Slots</span>: {selectedCount}
          </div>
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Total Amount</span>: ₹{totalAmount}
          </div>
          <button
            onClick={onBook}
            className={`rounded-lg px-5 py-2 font-semibold ${
              selectedCount > 0
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Book Slot
          </button>
        </div>
      </div>
    </div>
  );
}
 