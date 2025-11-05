import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/admin/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_profile", JSON.stringify(data.admin));
        navigate("/admin");
      } else {
        alert(data.message || "Login failed ❌");
      }
    } catch (err) {
      console.error(err);
      alert("Server error, please try again later!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-50 via-white to-gray-100">
      {/* Mobile-friendly sticky header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="mx-auto max-w-screen-sm px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-extrabold text-[#1747C8] tracking-tight">ParkSpace Admin</h1>
          <button
            onClick={() => navigate("/admin/signup")}
            className="text-[#1747C8] text-sm font-semibold hover:underline"
          >
            Signup
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-screen-sm px-4 py-6 sm:py-10">
        <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-blue-100">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-blue-700 mb-4 sm:mb-6">Admin Login</h2>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label className="text-gray-700 text-sm">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div>
              <label className="text-gray-700 text-sm">Password</label>
              <input
                type="password"
                placeholder="Enter password"
                className="w-full mt-1 px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-200 focus:border-[#1747C8]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 sm:py-3 text-sm sm:text-base font-semibold shadow transition"
            >
              Login
            </button>

            <p className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <span
                onClick={() => navigate("/admin/signup")}
                className="text-[#1747C8] cursor-pointer hover:underline"
              >
                Signup
              </span>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;
