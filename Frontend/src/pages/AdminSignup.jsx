import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill out all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setError("");
      const res = await fetch(`${API_BASE}/admin/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Signup failed");
      }

      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_profile", JSON.stringify(data.admin));

      setSuccess("Signup successful! Redirecting...");
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-gray-100">
      {/* Mobile-friendly sticky header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-extrabold text-[#1747C8] tracking-tight">ParkSpace Admin</h1>
          <button
            onClick={() => navigate("/admin/register")}
            className="text-[#1747C8] text-sm font-semibold hover:underline"
          >
            Login
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-screen-sm px-4 py-6 sm:py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1747C8] mb-4 sm:mb-6">
            Admin Signup
          </h2>

          {error && <p className="text-red-600 text-sm text-center mb-3 sm:mb-4">{error}</p>}
          {success && <p className="text-green-600 text-sm text-center mb-3 sm:mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-gray-700 text-sm">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                className="w-full mt-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                autoComplete="name"
                inputMode="text"
              />
            </div>

            <div>
              <label className="text-gray-700 text-sm">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full mt-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-gray-700 text-sm">Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-gray-700 text-sm">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full mt-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#1747C8] text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold shadow hover:bg-[#1238a0] transition"
            >
              Signup
            </button>
          </form>

          <p className="text-center text-sm mt-4">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/admin/register")}
              className="text-[#1747C8] cursor-pointer hover:underline"
            >
              Login
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};

export default AdminSignup;
