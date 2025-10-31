// src/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = async (p, init = {}) => {
  const r = await fetch(API_BASE + p, { credentials: "include", ...init });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

const MAX_HOURS = 6;

export default function CheckoutPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [slot, setSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [billing, setBilling] = useState({ hours: 1 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const slotId = state?.spotId || null;
  const locationName = state?.locationName || "-";
  const slotsSelected = state?.slots || [];
  const pricePerSlot = state?.pricePerSlot ?? 0;
  const baseAmount = slotsSelected.length * pricePerSlot;
  const amount = useMemo(() => baseAmount * billing.hours, [baseAmount, billing.hours]);

  useEffect(() => {
    (async () => {
      if (!slotId) {
        navigate("/booking", { replace: true });
        return;
      }
      try {
        setLoading(true);
        const meRes = await api("/auth/me").catch(() => null);
        if (!meRes) {
          navigate("/login", { state: { returnTo: "/checkout" }, replace: true });
          return;
        }
        setMe(meRes);

        let vehs = Array.isArray(meRes.vehicles) ? meRes.vehicles : null;
        if (!vehs) {
          vehs = await api("/vehicles").catch(() => []);
        }
        setVehicles(vehs || []);
        if (vehs?.length) setSelectedVehicleId(vehs[0]._id || "");

        const spotDoc = await api(`/admin/spots/by-id/${encodeURIComponent(slotId)}`).catch(() => null);
        setSlot(spotDoc);
      } catch (e) {
        console.error(e);
        alert("Could not load checkout data.");
        navigate("/booking", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [slotId, navigate]);

  const createVehicle = async (payload) => {
    const v = await api("/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleNumber: payload.plate?.toUpperCase().trim(),
        brand: payload.make?.toLowerCase().trim(),
        model: payload.model?.toLowerCase().trim()
      })
    });
    const newVehicle = v.vehicle || v;
    setVehicles((prev) => [newVehicle, ...prev]);
    setSelectedVehicleId(newVehicle._id);
  };

  const clampHours = (n) => Math.max(1, Math.min(MAX_HOURS, Number.isFinite(n) ? n : 1));

  const handlePay = async () => {
    const hours = clampHours(billing.hours);
    if (hours !== billing.hours) setBilling((b) => ({ ...b, hours }));
    if (!selectedVehicleId) return alert("Please select or add a vehicle.");
    if (hours > MAX_HOURS) return alert(`Maximum booking is ${MAX_HOURS} hours.`);

    setSubmitting(true);
    try {
      // 1) Create hold
      const hold = await api("/reservations/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          hours,
          vehicleId: selectedVehicleId,
          slots: slotsSelected,
          pricePerSlot
        })
      });

      const holdId = hold.reservationId || hold._id;
      if (!holdId) throw new Error("Invalid hold response.");

      // 2) Confirm (simulate payment success)
      const confirm = await api(`/reservations/${holdId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentResult: { status: "success" } })
      });

      const reservationId = confirm.reservationId || confirm._id;
      if (!reservationId) throw new Error("Invalid confirm response.");

      // 3) Always navigate to ticket page
      navigate(`/ticket/${reservationId}`, { replace: true });
    } catch (e) {
      console.error(e);
      alert("Payment or reservation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6">Loading checkout…</div>;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <p className="text-sm text-gray-500 mt-1">Complete vehicle and billing to proceed.</p>

      <div className="mt-6 grid gap-5">
        {/* Spot Summary */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Parking Spot</p>
              <p className="font-semibold">{slot?.name}</p>
              <p className="text-sm text-gray-600">{slot?.location || locationName}</p>
              <p className="text-sm text-gray-600">Selected: {slotsSelected.join(", ")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Rate</p>
              <p className="font-semibold">₹{pricePerSlot}/slot</p>
            </div>
          </div>
        </div>

        {/* Vehicle select/add with improved UI */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Vehicle</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 border">
              {vehicles.length} saved
            </span>
          </div>

          {vehicles.length > 0 ? (
            <div className="mt-2">
              <label className="block text-xs text-gray-500 mb-1">Choose a vehicle</label>
              <div className="relative">
                <select
                  className="w-full appearance-none border rounded-lg px-3 py-2 pr-9 focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {`${(v.plate || "").toUpperCase()} — ${v.make || "-"} ${v.model || "-"}`}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>

              {selectedVehicleId && (
                <div className="mt-2 text-sm text-gray-700 bg-gray-50 border rounded-lg px-3 py-2">
                  {(() => {
                    const v = vehicles.find((x) => x._id === selectedVehicleId);
                    return v
                      ? `Selected: ${(v.plate || "").toUpperCase()} • ${v.make || "-"} ${v.model || "-"}`
                      : "Selected vehicle";
                  })()}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              No vehicles yet. Add one below to continue.
            </p>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-600">Add a vehicle</summary>
            <AddVehicleInline onCreated={createVehicle} />
          </details>
        </div>

        {/* Billing with 6-hour max */}
        <div className="bg-white border rounded-xl p-4">
          <p className="font-semibold">Billing</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-sm text-gray-600">Hours</label>
            <input
              type="number"
              min={1}
              max={MAX_HOURS}
              className="w-28 border rounded-lg px-3 py-2"
              value={billing.hours}
              onChange={(e) =>
                setBilling((b) => ({ ...b, hours: clampHours(Number(e.target.value || 1)) }))
              }
            />
            <span className="text-xs text-gray-500">Max {MAX_HOURS} hours</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-semibold">₹{amount}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button className="px-4 py-2 rounded-lg border" onClick={() => navigate(-1)}>
            Back
          </button>
          <button
            onClick={handlePay}
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Pay & Reserve"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddVehicleInline({ onCreated }) {
  const [form, setForm] = useState({ make: "", model: "", plate: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.plate) return alert("Plate is required.");
    setBusy(true);
    try {
      await onCreated(form);
      setForm({ make: "", model: "", plate: "" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="mt-3 grid gap-3" onSubmit={submit}>
      <div className="grid sm:grid-cols-3 gap-3">
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Make"
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 uppercase"
          placeholder="Plate"
          value={form.plate}
          onChange={(e) => setForm({ ...form, plate: e.target.value })}
        />
      </div>
      <button
        disabled={busy}
        className="justify-self-end px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
      >
        {busy ? "Adding..." : "Add Vehicle"}
      </button>
    </form>
  );
}
