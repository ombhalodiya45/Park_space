// src/pages/CheckoutPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = async (p, init={}) => {
  const r = await fetch(API_BASE + p, { credentials: "include", ...init });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function CheckoutPage() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [slot, setSlot] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [billing, setBilling] = useState({ hours: 1 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const amount = useMemo(() => (slot?.price || 0) * billing.hours, [slot, billing.hours]);

  useEffect(() => {
    (async () => {
      try {
        const [meRes, slotRes, vehs] = await Promise.all([
          api("/auth/me").catch(() => null),
          api(`/admin/spots/public/${slotId}`),
          api("/user/vehicles").catch(() => []),
        ]);
        if (!meRes) {
          navigate("/login", { state: { returnTo: `/checkout/${slotId}` }, replace: true });
          return;
        }
        setMe(meRes);
        setSlot(slotRes);
        setVehicles(vehs);
        if (vehs?.length) setSelectedVehicleId(vehs[0]._id);
      } catch (e) {
        alert("Could not load checkout data.");
        navigate("/booking", { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [slotId, navigate]);

  const createVehicle = async (payload) => {
    const v = await api("/user/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setVehicles((prev) => [v, ...prev]);
    setSelectedVehicleId(v._id);
  };

  const handlePay = async () => {
    if (!selectedVehicleId) return alert("Please select or add a vehicle.");
    setSubmitting(true);
    try {
      // 1) Create a held reservation so the slot is protected while paying
      const hold = await api("/reservations/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          hours: billing.hours,
          vehicleId: selectedVehicleId,
        }),
      });

      // 2) Simulate/perform payment - integrate provider here; on success:
      const confirm = await api(`/reservations/${hold.reservationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentResult: { status: "success" } }),
      });

      // 3) Go to ticket page
      navigate(`/ticket/${confirm.reservationId}`, { replace: true });
    } catch (e) {
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
        {/* Slot summary */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Parking Spot</p>
              <p className="font-semibold">{slot?.name}</p>
              <p className="text-sm text-gray-600">{slot?.location}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Rate</p>
              <p className="font-semibold">₹{slot?.price}/hr</p>
            </div>
          </div>
        </div>

        {/* Vehicle select/add */}
        <div className="bg-white border rounded-xl p-4">
          <p className="font-semibold">Vehicle</p>
          {vehicles.length > 0 ? (
            <select
              className="mt-2 w-full border rounded-lg px-3 py-2"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
            >
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.make} {v.model} • {v.plate}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              No vehicles yet. Add one below to continue.
            </p>
          )}

          {/* Inline add vehicle */}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-600">Add a vehicle</summary>
            <AddVehicleInline onCreated={createVehicle} />
          </details>
        </div>

        {/* Billing */}
        <div className="bg-white border rounded-xl p-4">
          <p className="font-semibold">Billing</p>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-sm text-gray-600">Hours</label>
            <input
              type="number"
              min={1}
              className="w-24 border rounded-lg px-3 py-2"
              value={billing.hours}
              onChange={(e) => setBilling((b) => ({ ...b, hours: Number(e.target.value || 1) }))}
            />
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
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
      <input className="border rounded-lg px-3 py-2" placeholder="Make" value={form.make}
             onChange={(e) => setForm({ ...form, make: e.target.value })} />
      <input className="border rounded-lg px-3 py-2" placeholder="Model" value={form.model}
             onChange={(e) => setForm({ ...form, model: e.target.value })} />
      <input className="border rounded-lg px-3 py-2" placeholder="Plate" value={form.plate}
             onChange={(e) => setForm({ ...form, plate: e.target.value })} />
      <button disabled={busy} className="justify-self-end px-4 py-2 rounded-lg bg-gray-900 text-white">
        {busy ? "Adding..." : "Add Vehicle"}
      </button>
    </form>
  );
}
