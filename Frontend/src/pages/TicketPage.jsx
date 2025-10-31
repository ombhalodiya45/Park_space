// src/pages/TicketPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const api = async (p) => {
  const r = await fetch(API_BASE + p, { credentials: "include" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function TicketPage() {
  const { reservationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api(`/reservations/${reservationId}`);
        setData(res);
      } catch (e) {
        alert("Could not load ticket.");
        navigate("/booking", { replace: true });
      }
    })();
  }, [reservationId, navigate]);

  if (!data) return <div className="p-6">Loading ticket…</div>;

  const payload = JSON.stringify({
    id: data._id,
    slot: data.slot?.name,
    when: data.startTime,
    plate: data.vehicle?.plate,
  });

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Parking Ticket</h1>
      <div className="mt-4 bg-white border rounded-xl p-5 grid gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <p className="font-semibold">{data.user?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Amount Paid</p>
            <p className="font-semibold">₹{data.amount}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Info label="Vehicle" value={`${data.vehicle?.make} ${data.vehicle?.model} • ${data.vehicle?.plate}`} />
          <Info label="Parking Slot" value={data.slot?.name} />
          <Info label="Location" value={data.slot?.location} />
          <Info label="Start - End" value={`${new Date(data.startTime).toLocaleString()} → ${new Date(data.endTime).toLocaleString()}`} />
          <Info label="Reservation ID" value={data._id} />
          <Info label="Status" value={data.status} />
        </div>

        <div className="mt-3 flex flex-col items-center gap-2">
          <QRCode value={payload} size={160} />
          <p className="text-xs text-gray-500">Show this QR at entry for quick check-in.</p>
        </div>

        <div className="mt-4 flex justify-end">
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={() => navigate("/")}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-gray-50 border rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
