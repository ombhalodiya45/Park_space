import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const emailRx = /^\S+@\S+\.\S+$/;
const phoneRx = /^\+?[0-9]{7,15}$/;

export default function AdminRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
    org: "",
    role: "owner", // or "superadmin" if you want to allow
    spotIds: [],
  });
  const [spots, setSpots] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSpots = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/spots`);
        if (!res.ok) throw new Error("Failed to load spots");
        const data = await res.json();
        setSpots(data);
      } catch (e) {
        console.error(e);
        alert("Could not load spots for assignment.");
      }
    };
    loadSpots();
  }, []);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleSpot = (id) => {
    setForm((f) => {
      const exists = f.spotIds.includes(id);
      return { ...f, spotIds: exists ? f.spotIds.filter((x) => x !== id) : [...f.spotIds, id] };
    });
  };

  const validate = () => {
    if (!form.name || form.name.trim().length < 2) return "Name must be at least 2 chars";
    if (!emailRx.test(form.email)) return "Enter a valid email";
    if (form.password.length < 8) return "Password must be at least 8 chars";
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
      return "Password must include letters and numbers";
    if (form.password !== form.confirm) return "Passwords do not match";
    if (form.phone && !phoneRx.test(form.phone)) return "Invalid phone number";
    // role can be limited to owner here
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    try {
      setSubmitting(true);
      const body = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone || undefined,
        org: form.org || undefined,
        role: form.role, // keep "owner" if you want to restrict
        spotIds: form.spotIds,
      };
      const res = await fetch(`${API_BASE}/admin/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Registration failed");
      alert("Admin registered successfully");
      // Optionally store token and redirect to admin dashboard
      // localStorage.setItem("admin_token", data.token);
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow p-6 md:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Register Admin (Owner)</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Name">
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="John Doe"
              />
            </Field>
            <Field label="Email">
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="owner@example.com"
              />
            </Field>
            <Field label="Phone (optional)">
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="+919999999999"
              />
            </Field>
            <Field label="Organization (optional)">
              <input
                className="w-full rounded-lg border px-3 py-2"
                value={form.org}
                onChange={(e) => setField("org", e.target.value)}
                placeholder="ParkSpace Partners"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Password">
              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                placeholder="At least 8 chars"
              />
            </Field>
            <Field label="Confirm Password">
              <input
                type="password"
                className="w-full rounded-lg border px-3 py-2"
                value={form.confirm}
                onChange={(e) => setField("confirm", e.target.value)}
                placeholder="Re-enter password"
              />
            </Field>
          </div>

          {/* If you want to lock role to owner, hide this select */}
          <div className="hidden">
            <Field label="Role">
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
              >
                <option value="owner">Owner</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </Field>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Assign Spots</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded-lg p-3">
              {spots.map((s) => (
                <label key={s._id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.spotIds.includes(s._id)}
                    onChange={() => toggleSpot(s._id)}
                  />
                  <span className="text-gray-800">
                    {s.name} • {s.location} • ₹{s.price}/hr
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select the spots this admin can manage (create/update/delete).
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="rounded-lg border px-4 py-2"
              onClick={() =>
                setForm({ name: "", email: "", password: "", confirm: "", phone: "", org: "", role: "owner", spotIds: [] })
              }
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
