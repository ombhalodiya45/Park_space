import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* --- Auth helpers --- */
const auth = {
  token: () => localStorage.getItem("admin_token") || "",
  profile: () => {
    try { return JSON.parse(localStorage.getItem("admin_profile") || "null"); } catch { return null; }
  },
  isAuthed: () => !!localStorage.getItem("admin_token"),
  logout: () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
  },
};

/* --- API --- */
const API_BASE = import.meta?.env?.VITE_API_URL || "http://localhost:5000/api";
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${auth.token()}` } });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  return res.json();
}
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
  return res.json();
}
async function apiPut(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token()}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT ${path} failed (${res.status})`);
  return res.json();
}
async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: { Authorization: `Bearer ${auth.token()}` } });
  if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status})`);
  return res.json();
}

const AdminPage = () => {
  const navigate = useNavigate();

  const isLoggedIn = auth.isAuthed();
  const profile = auth.profile();
  const initials = (() => {
    const n = profile?.name?.trim() || "A";
    const p = n.split(/\s+/);
    return ((p[0]?.[0] || "A") + (p[1]?.[0] || "")).toUpperCase();
  })();

  const handleLogout = () => { auth.logout(); navigate(0); };

  /* Mobile drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Sidebar width collapse on desktop (kept for future) */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const [spots, setSpots] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [assignMe, setAssignMe] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    price: "",
    available: true,
    totalSlots: "",
    availableSlots: "",
  });

  const searchRef = useRef(null);
  const tableRef = useRef(null);

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      price: "",
      available: true,
      totalSlots: "",
      availableSlots: "",
    });
    setAssignMe(true);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };
  const openEdit = (spot) => {
    setFormData({
      name: spot.name,
      location: spot.location,
      price: spot.price,
      available: spot.available,
      totalSlots: typeof spot.totalSlots === "number" ? spot.totalSlots : "",
      availableSlots: typeof spot.availableSlots === "number" ? spot.availableSlots : "",
    });
    setAssignMe(false);
    setEditingId(spot._id);
    setModalOpen(true);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGet("/admin/spots");
        setSpots(data);
      } catch (e) {
        console.error("Failed to load spots:", e);
        alert(
          e.message.includes("(401)") ? "Please login as admin." :
          e.message.includes("(403)") ? "You do not have permission to view spots." :
          "Could not load spots."
        );
      }
    };
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.location || formData.price === "") {
      alert("Please fill all fields.");
      return;
    }
    const payload = {
      ...formData,
      price: Number(formData.price),
      totalSlots: formData.totalSlots === "" ? 0 : Number(formData.totalSlots),
      availableSlots:
        formData.availableSlots === ""
          ? formData.totalSlots === ""
            ? 0
            : Number(formData.totalSlots)
          : Number(formData.availableSlots),
      assignMe: !editingId && assignMe,
    };
    try {
      if (editingId) {
        const updated = await apiPut(`/admin/spots/${editingId}`, payload);
        setSpots((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      } else {
        const created = await apiPost("/admin/spots", payload);
        setSpots((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      resetForm();
    } catch (e2) {
      console.error("Save failed:", e2);
      alert(
        e2.message.includes("(401)") ? "Please login as admin." :
        e2.message.includes("(403)") ? "You are not allowed to modify this spot." :
        "Save failed. See console."
      );
    }
  };

  const removeSpot = async (id) => {
    if (!confirm("Delete this spot?")) return;
    try {
      await apiDelete(`/admin/spots/${id}`);
      setSpots((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      console.error("Delete failed:", e);
      alert(
        e.message.includes("(401)") ? "Please login as admin." :
        e.message.includes("(403)") ? "You are not allowed to delete this spot." :
        "Delete failed."
      );
    }
  };

  const toggleAvailability = async (id) => {
    try {
      const current = spots.find((s) => s._id === id);
      if (!current) return;
      const updated = await apiPut(`/admin/spots/${id}`, { ...current, available: !current.available });
      setSpots((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    } catch (e) {
      console.error("Toggle failed:", e);
      alert(
        e.message.includes("(401)") ? "Please login as admin." :
        e.message.includes("(403)") ? "You are not allowed to update this spot." :
        "Toggle failed."
      );
    }
  };

  /* Go to manage section */
  const goToManage = () => {
    setDrawerOpen(false);
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      searchRef.current?.focus();
    });
  };

  const NavIcon = ({ children }) => (
    <span className="inline-flex items-center justify-center w-8 h-8 bg-white/15 rounded-md">
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-gray-100 flex">
      {/* Sidebar: fixed on md+, drawer on mobile */}
      {/* Drawer overlay (mobile) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={[
          "fixed md:static z-50 md:z-20 top-0 left-0",
          "h-screen md:h-auto transition-transform duration-300 ease-out",
          drawerOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          sidebarExpanded ? "w-64 md:w-64" : "w-56 md:w-56",
          "bg-[#1747C8] text-white shadow-xl md:shadow-none",
          "overflow-y-auto"
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Sidebar header with close on mobile */}
        <div className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-5 border-b border-white/10">
          <span className="font-extrabold tracking-wide text-base sm:text-lg">ParkSpace Admin</span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 rounded hover:bg-white/10 md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="py-4 sm:py-5 space-y-1">
          <button
            onClick={goToManage}
            className="w-full text-left flex items-center gap-3 px-4 sm:px-6 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <NavIcon>🗂️</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Manage Spots</span>
          </button>
          <button
            onClick={() => { setDrawerOpen(false); openAdd(); }}
            className="w-full text-left flex items-center gap-3 px-4 sm:px-6 py-2 rounded-lg hover:bg-white/10 transition"
          >
            <NavIcon>➕</NavIcon>
            <span className={sidebarExpanded ? "inline" : "hidden"}>Add Spot</span>
          </button>
        </nav>

        {/* Desktop width toggle (optional) */}
        <button
          onClick={() => setSidebarExpanded((v) => !v)}
          className="absolute -right-4 top-4 bg-white text-[#1747C8] p-2 rounded-full shadow-md border border-white/70 hidden md:block"
          aria-label="Collapse sidebar"
          title="Toggle sidebar"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" fill="none" strokeWidth="2" />
          </svg>
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-100 px-3 sm:px-4 md:px-6">
          <div className="py-2 sm:py-3 md:h-16 md:py-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Hamburger only on mobile */}
              <button
                className="md:hidden text-[#1747C8] p-2 rounded hover:bg-blue-50"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open sidebar"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" fill="none" strokeWidth="2" />
                </svg>
              </button>

              <input
                ref={searchRef}
                placeholder="Search spots..."
                className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-sm w-[60vw] sm:w-72 md:w-80 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {!isLoggedIn ? (
                <button
                  onClick={() => navigate("/admin/register")}
                  className="rounded-lg bg-[#1747C8] text-white px-4 py-2 text-sm font-semibold hover:bg-[#1238a0]"
                >
                  Login
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-[#1747C8] text-white flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 leading-4">
                        {profile?.name || "Admin"}
                      </p>
                      <p className="text-xs text-[#1747C8] leading-4">
                        {profile?.email || "admin@parkspace.com"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="p-3 sm:p-4 md:p-8 space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#1747C8] tracking-tight">
              Manage Parking Spots
            </h1>
            <button
              onClick={openAdd}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1747C8] px-4 py-2 text-white font-semibold shadow hover:bg-[#1238a0] transition w-full sm:w-auto"
            >
              <span>＋</span>
              <span>Add Spot</span>
            </button>
          </div>

          {/* Anchor */}
          <div ref={tableRef} />

          {/* Table (desktop) */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-blue-100 overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-blue-50 sticky top-0">
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Location</Th>
                  <Th>Price</Th>
                  <Th>Availability</Th>
                  <Th>Slots</Th>
                  <Th className="text-right pr-5">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {spots.map((s) => (
                  <tr key={s._id} className="hover:bg-blue-50/60 transition">
                    <Td>{s._id}</Td>
                    <Td className="font-medium text-blue-900">{s.name}</Td>
                    <Td className="text-blue-700">{s.location}</Td>
                    <Td className="text-blue-900">₹{s.price}/hr</Td>
                    <Td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {s.available ? "Available" : "Full"}
                      </span>
                    </Td>
                    <Td>
                      {typeof s.availableSlots === "number" ? s.availableSlots : "-"} /{" "}
                      {typeof s.totalSlots === "number" ? s.totalSlots : "-"}
                    </Td>
                    <Td className="text-right whitespace-nowrap pr-5">
                      <button
                        onClick={() => toggleAvailability(s._id)}
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
                        onClick={() => removeSpot(s._id)}
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

          {/* Cards (mobile) */}
          <div className="sm:hidden grid grid-cols-1 gap-3">
            {spots.map((s) => (
              <div key={s._id} className="bg-white shadow-sm rounded-xl p-3 border border-blue-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-500">Code: {s._id}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      s.available ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}
                  >
                    {s.available ? "Available" : "Full"}
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-blue-900">{s.name}</h3>
                <p className="text-blue-600">{s.location}</p>
                <p className="text-blue-900 mt-1 font-medium">₹{s.price}/hr</p>
                <p className="text-blue-700 mt-1">
                  Slots: {typeof s.availableSlots === "number" ? s.availableSlots : "-"} /{" "}
                  {typeof s.totalSlots === "number" ? s.totalSlots : "-"}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button
                    onClick={() => toggleAvailability(s._id)}
                    className="rounded-lg border px-2 py-2 text-sm font-medium hover:bg-blue-50 transition"
                    title="Toggle Availability"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="rounded-lg bg-yellow-400 px-2 py-2 text-sm font-medium hover:bg-yellow-500 transition"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => removeSpot(s._id)}
                    className="rounded-lg bg-red-600 text-white px-2 py-2 text-sm font-semibold hover:bg-red-700 transition"
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-900">
                {editingId ? "Edit Parking Spot" : "Add Parking Spot"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-blue-50" aria-label="Close">
                ✕
              </button>
            </div>
            <form onSubmit={onSubmit} className="px-4 sm:px-6 py-4 space-y-3 sm:space-y-4">
              <Field label="Name">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Central Garage"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                />
              </Field>
              <Field label="Location">
                <input
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Downtown"
                  className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Field label="Price (₹/hr)">
                  <input
                    name="price"
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                  />
                </Field>
                <Field label="Availability">
                  <select
                    name="available"
                    value={formData.available ? "yes" : "no"}
                    onChange={(e) => setFormData((f) => ({ ...f, available: e.target.value === "yes" }))}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                  >
                    <option value="yes">Available</option>
                    <option value="no">Full</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <Field label="Total Slots">
                  <input
                    name="totalSlots"
                    type="number"
                    min="0"
                    value={formData.totalSlots}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                  />
                </Field>
                <Field label="Available Slots">
                  <input
                    name="availableSlots"
                    type="number"
                    min="0"
                    value={formData.availableSlots}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8] outline-none"
                  />
                </Field>
              </div>

              {!editingId && (
                <div className="flex items-center gap-2">
                  <input id="assignMe" type="checkbox" checked={assignMe} onChange={() => setAssignMe((v) => !v)} />
                  <label htmlFor="assignMe" className="text-sm text-gray-700">
                    Assign me as owner of this spot
                  </label>
                </div>
              )}

              <div className="pt-1 sm:pt-2 flex items-center justify-end gap-2 sm:gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 hover:bg-blue-50">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-[#1747C8] text-white px-4 py-2 font-semibold hover:bg-[#1238a0]">
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
  return <th className={`px-5 py-3 text-left font-semibold text-[#1747C8] ${className}`}>{children}</th>;
}
function Td({ children, className = "" }) {
  return <td className={`px-5 py-3 align-middle text-blue-900 ${className}`}>{children}</td>;
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[#1747C8] mb-1">{label}</span>
      {children}
    </label>
  );
}

export default AdminPage;
