import React, { useEffect, useState } from "react";

/* --- Minimal API client (inline) --- */
const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed`);
  return res.json();
}
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE ${path} failed`);
  return res.json();
}
/* --- End API client --- */

const AdminPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  // Spots from API
  const [spots, setSpots] = useState([]);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  // editingId will store customCode (not _id)
  const [editingId, setEditingId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    available: true,
  });

  const resetForm = () => {
    setFormData({ name: "", location: "", price: "", available: true });
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (spot) => {
    setFormData({
      name: spot.name,
      location: spot.location,
      price: spot.price,
      available: spot.available,
    });
    // store customCode as the editing identifier
    setEditingId(spot.customCode || spot._id); // fallback just in case
    setModalOpen(true);
  };

  // Load spots
  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet("/admin/spots");
        setSpots(data);
      } catch (e) {
        console.error("Failed to load spots:", e);
        alert("Could not load spots from server.");
      }
    };
    load();
  }, []);

  // Create or Update (using customCode in URL for update)
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || formData.price === "") {
      alert("Please fill all fields.");
      return;
    }

    try {
      if (editingId) {
        const updated = await apiPut(`/admin/spots/${editingId}`, {
          ...formData,
          price: Number(formData.price),
        });
        setSpots((prev) =>
          prev.map((s) => (s.customCode === updated.customCode ? updated : s))
        );
      } else {
        const created = await apiPost("/admin/spots", {
          ...formData,
          price: Number(formData.price),
        });
        setSpots((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      resetForm();
    } catch (e) {
      console.error("Save failed:", e);
      alert("Save failed. See console for details.");
    }
  };

  // Delete by customCode
  const removeSpot = async (code) => {
    if (!confirm("Delete this spot?")) return;
    try {
      await apiDelete(`/admin/spots/${code}`);
      setSpots((prev) => prev.filter((s) => s.customCode !== code));
    } catch (e) {
      console.error("Delete failed:", e);
      alert("Delete failed.");
    }
  };

  // Toggle availability by customCode
  const toggleAvailability = async (code) => {
    try {
      const current = spots.find((s) => s.customCode === code);
      if (!current) return;
      const updated = await apiPut(`/admin/spots/${code}`, {
        ...current,
        available: !current.available,
      });
      setSpots((prev) =>
        prev.map((s) => (s.customCode === updated.customCode ? updated : s))
      );
    } catch (e) {
      console.error("Toggle failed:", e);
      alert("Toggle failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed md:static z-50 top-0 left-0",
          "h-screen md:h-auto md:min-h-screen",
          "transition-all duration-200 ease-out",
          drawerOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0",
          sidebarExpanded ? "md:w-64" : "md:w-16",
          "bg-blue-600 text-white border-r border-white/10",
          "overflow-y-auto",
        ].join(" ")}
        aria-label="Sidebar"
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={[
                drawerOpen ? "inline" : "hidden",
                "md:inline",
                !sidebarExpanded ? "md:hidden" : "md:inline",
                "font-bold",
              ].join(" ")}
            >
              ParkSpace Admin
            </span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
          <button
            onClick={() => setSidebarExpanded((v) => !v)}
            className="p-2 rounded hover:bg-white/10 hidden md:inline"
            aria-label="Collapse sidebar"
            title="Collapse"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path d="M4 6h16M4 12h10M4 18h16" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 text-sm">
          <a href="#dashboard" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10">
            <span>🏠</span>
            <span
              className={[
                drawerOpen ? "inline" : "hidden",
                "md:inline",
                !sidebarExpanded ? "md:hidden" : "md:inline",
              ].join(" ")}
            >
              Dashboard
            </span>
          </a>

          <a href="#spots" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10">
            <span>🗂️</span>
            <span
              className={[
                drawerOpen ? "inline" : "hidden",
                "md:inline",
                !sidebarExpanded ? "md:hidden" : "md:inline",
              ].join(" ")}
            >
              Manage Spots
            </span>
          </a>

          <button
            onClick={() => {
              setDrawerOpen(false);
              openAdd();
            }}
            className="w-full text-left flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10"
          >
            <span>➕</span>
            <span
              className={[
                drawerOpen ? "inline" : "hidden",
                "md:inline",
                !sidebarExpanded ? "md:hidden" : "md:inline",
              ].join(" ")}
            >
              Add Spot
            </span>
          </button>

          <a href="#logout" className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/10">
            <span>🚪</span>
            <span
              className={[
                drawerOpen ? "inline" : "hidden",
                "md:inline",
                !sidebarExpanded ? "md:hidden" : "md:inline",
              ].join(" ")}
            >
              Logout
            </span>
          </a>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden inline-flex items-center justify-center p-2 rounded hover:bg-gray-100"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path d="M4 6h16M4 12h10M4 18h16" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="relative">
              <input
                placeholder="Search spots..."
                className="w-48 sm:w-60 md:w-72 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center">A</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">Admin</p>
                <p className="text-xs text-gray-500">admin@parkspace.com</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Manage Parking Spots</h1>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 sm:px-4 py-2 text-white font-semibold shadow hover:bg-blue-700"
            >
              <span>＋</span> <span className="hidden sm:inline">Add Spot</span>
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <Th>Code</Th>
                    <Th>Name</Th>
                    <Th>Location</Th>
                    <Th>Price</Th>
                    <Th>Availability</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {spots.map((s) => (
                    <tr key={s.customCode || s._id} className="hover:bg-gray-50">
                      <Td>{s.customCode || s._id}</Td>
                      <Td className="font-medium text-gray-900">{s.name}</Td>
                      <Td>{s.location}</Td>
                      <Td>₹{s.price}/hr</Td>
                      <Td>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {s.available ? "Available" : "Full"}
                        </span>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleAvailability(s.customCode || s._id)}
                          className="mr-2 rounded-lg border px-3 py-1 hover:bg-gray-100"
                        >
                          Toggle
                        </button>
                        <button
                          onClick={() => openEdit(s)}
                          className="mr-2 rounded-lg bg-yellow-400 px-3 py-1 hover:bg-yellow-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeSpot(s.customCode || s._id)}
                          className="rounded-lg bg-red-600 text-white px-3 py-1 hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100">
              {spots.map((s) => (
                <div key={s.customCode || s._id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">Code: {s.customCode || s._id}</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.available ? "Available" : "Full"}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold text-gray-900">{s.name}</h3>
                  <p className="text-gray-600">{s.location}</p>
                  <p className="text-gray-800 mt-1">₹{s.price}/hr</p>

                  <div className="mt-3 grid grid-cols-1 sm:flex sm:flex-wrap gap-2">
                    <button
                      onClick={() => toggleAvailability(s.customCode || s._id)}
                      className="w-full sm:w-auto rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Toggle
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="w-full sm:w-auto rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium hover:bg-yellow-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeSpot(s.customCode || s._id)}
                      className="w-full sm:w-auto rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? "Edit Parking Spot" : "Add Parking Spot"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-gray-100">✕</button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <Field label="Name">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Central Garage"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                />
              </Field>
              <Field label="Location">
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Downtown"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Price (₹/hr)">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                  />
                </Field>
                <Field label="Availability">
                  <select
                    name="available"
                    value={formData.available ? "yes" : "no"}
                    onChange={(e) => setFormData((f) => ({ ...f, available: e.target.value === "yes" }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-600 outline-none"
                  >
                    <option value="yes">Available</option>
                    <option value="no">Full</option>
                  </select>
                </Field>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border px-4 py-2 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700"
                >
                  {editingId ? "Save Changes" : "Save Spot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* Small helpers */
function Th({ children, className = "" }) {
  return <th className={`px-4 py-3 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle text-gray-700 ${className}`}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

export default AdminPage;
