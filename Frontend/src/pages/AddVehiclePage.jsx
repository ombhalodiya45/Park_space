import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Components/AuthContext";

export default function AddVehiclePage() {
  const [vehicle, setVehicle] = useState({ plate: "", make: "", model: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVehicle((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vehicle.plate || !vehicle.make || !vehicle.model) {
      setError("Complete all vehicle fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const API_BASE = import.meta.env?.VITE_API_URL || "http://localhost:5000/api";
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/vehicles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: "include",
        body: JSON.stringify({
          // Match controller fields
          vehicleNumber: vehicle.plate.toUpperCase().trim(),
          brand: vehicle.make.toLowerCase().trim(),
          model: vehicle.model.toLowerCase().trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Add vehicle failed:", data);
        setError(data.message || "Failed to add vehicle");
        return;
      }

      if (user) {
        setUser({
          ...user,
          vehicles: [...(user.vehicles || []), data.vehicle]
        });
      }

      const returnTo = location.state?.returnTo || "/booking";
      navigate(returnTo, { replace: true });
    } catch (err) {
      console.error("Network or server error:", err);
      setError("Network error while adding vehicle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center">Add Vehicle</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            name="plate"
            value={vehicle.plate}
            onChange={handleChange}
            placeholder="License Plate"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="make"
            value={vehicle.make}
            onChange={handleChange}
            placeholder="Brand"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            name="model"
            value={vehicle.model}
            onChange={handleChange}
            placeholder="Model"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          {error && <div className="text-red-600 text-center">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? "Adding..." : "Add Vehicle"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/booking", { replace: true })}
            className="text-blue-600 underline hover:text-blue-800"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
