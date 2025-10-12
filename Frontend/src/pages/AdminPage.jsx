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

  // Optionally use this for sidebar icons
  const NavIcon = ({ children }) => (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 rounded text-blue-700">
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-gray-100 flex font-sans">
      {/* Overlay on mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-10 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:static z-50 top-0 left-0",
          "h-screen md:h-auto transition-all duration-300 ease-out",
          drawerOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full w-64 md:translate-x-0",
          sidebarExpanded ? "md:w-64" : "md:w-20",
          "bg-blue-700 text-white",
          "overflow-y-auto"
        ].join(" ")}
        aria-label="Sidebar"
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-blue-600 shadow">
          <span
            className={[
              "font-bold tracking-wide text-lg",
              "transition-all duration-200",
              sidebarExpanded ? "opacity-100" : "opacity-0 md:opacity-100"
            ].join(" ")}
          >
            ParkSpace Admin
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded hover:bg-blue-600 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
        <nav className="py-5 space-y-2">
          <a href="#dashboard" className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            <NavIcon>🏠</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Dashboard</span>
          </a>
          <a href="#spots" className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            <NavIcon>🗂️</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Manage Spots</span>
          </a>
          <button
            onClick={() => {
              setDrawerOpen(false);
              openAdd();
            }}
            className="flex items-center w-full gap-2 px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            <NavIcon>➕</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Add Spot</span>
          </button>
          <a href="#logout" className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            <NavIcon>🚪</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Logout</span>
          </a>
        </nav>
        <button
          onClick={() => setSidebarExpanded((v) => !v)}
          className="absolute -right-5 top-4 bg-blue-500 p-2 rounded-full shadow-lg border border-white hidden md:block"
          aria-label="Collapse sidebar"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h10M4 18h16" stroke="white" fill="none" strokeWidth="2" />
          </svg>
        </button>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden text-blue-700 p-2 rounded hover:bg-blue-50"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h10M4 18h16" stroke="currentColor" fill="none" strokeWidth="2" />
              </svg>
            </button>
            <input
              placeholder="Search spots..."
              className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm w-56 md:w-72 focus:ring-2 focus:ring-blue-200 focus:border-blue-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">Admin</p>
              <p className="text-xs text-blue-700">admin@parkspace.com</p>
            </div>
          </div>
        </header>

        <main className="p-5 md:p-8 space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 tracking-tight">Manage Parking Spots</h1>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-white font-semibold shadow hover:bg-blue-800 transition"
            >
              <span>＋</span>
              <span className="hidden sm:inline">Add Spot</span>
            </button>
          </div>

          {/* Table for desktop */}
          <div className="bg-white rounded-xl shadow border border-blue-100 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50">
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
                  <tr key={s.customCode || s._id} className="hover:bg-blue-50 transition">
                    <Td>{s.customCode || s._id}</Td>
                    <Td className="font-medium text-blue-900">{s.name}</Td>
                    <Td>{s.location}</Td>
                    <Td>₹{s.price}/hr</Td>
                    <Td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.available ? "Available" : "Full"}
                      </span>
                    </Td>
                    <Td className="text-right whitespace-nowrap">
                      <button
                        onClick={() => toggleAvailability(s.customCode || s._id)}
                        className="mr-2 rounded-lg border px-3 py-1 hover:bg-blue-50 transition"
                        title="Toggle Availability"
                      >
                        🔄
                      </button>
                      <button
                        onClick={() => openEdit(s)}
                        className="mr-2 rounded-lg bg-yellow-400 px-3 py-1 hover:bg-yellow-500 transition"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => removeSpot(s.customCode || s._id)}
                        className="rounded-lg bg-red-600 text-white px-3 py-1 hover:bg-red-700 transition"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden">
            {spots.map((s) => (
              <div key={s.customCode || s._id} className="bg-white shadow rounded-lg p-4 mb-4 border border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-400">Code: {s.customCode || s._id}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.available ? "Available" : "Full"}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-blue-900">{s.name}</h3>
                <p className="text-blue-500">{s.location}</p>
                <p className="text-blue-800 mt-1">₹{s.price}/hr</p>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <button
                    onClick={() => toggleAvailability(s.customCode || s._id)}
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-blue-100 transition"
                    title="Toggle Availability"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-medium hover:bg-yellow-500 transition"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeSpot(s.customCode || s._id)}
                    className="rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-semibold hover:bg-red-700 transition"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">
                {editingId ? "Edit Parking Spot" : "Add Parking Spot"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded hover:bg-blue-100"
              >
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="p-6 space-y-4">
              <Field label="Name">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Central Garage"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-700 outline-none"
                />
              </Field>
              <Field label="Location">
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Downtown"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-700 outline-none"
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
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-700 outline-none"
                  />
                </Field>
                <Field label="Availability">
                  <select
                    name="available"
                    value={formData.available ? "yes" : "no"}
                    onChange={(e) => setFormData((f) => ({ ...f, available: e.target.value === "yes" }))}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-blue-700 outline-none"
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
                  className="rounded-lg border px-4 py-2 hover:bg-blue-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 text-white px-4 py-2 font-semibold hover:bg-blue-800"
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
  return <th className={`px-4 py-3 text-left font-semibold text-blue-700 ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-4 py-3 align-middle text-blue-900 ${className}`}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-blue-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

export default AdminPage;
