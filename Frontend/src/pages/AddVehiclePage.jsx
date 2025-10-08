import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AddVehiclePage() {
    const [vehicle, setVehicle] = useState({ plateNumber: "", make: "", model: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/dashboard"; // Default redirect if no origin

    const handleChange = (e) => {
        const { name, value } = e.target;
        setVehicle((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!vehicle.plateNumber || !vehicle.make || !vehicle.model) {
            setError("Please fill all fields");
            return;
        }
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        try {
            const response = await fetch("http://localhost:5000/api/users/vehicles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(vehicle),
            });
            const data = await response.json();
            if (response.ok) {
                navigate(from, { replace: true });
            } else {
                setError(data.message || "Failed to add vehicle");
            }
        } catch (error) {
            setError("Network error while adding vehicle");
        }
        setLoading(false);
    };

    const handleSkip = () => {
        navigate('/', { replace: true });
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white rounded shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-center">Add Vehicle</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        name="plateNumber"
                        value={vehicle.plateNumber}
                        onChange={handleChange}
                        placeholder="License Plate"
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        name="make"
                        value={vehicle.make}
                        onChange={handleChange}
                        placeholder="Make (e.g., Honda)"
                        className="w-full px-3 py-2 border rounded"
                    />
                    <input
                        name="model"
                        value={vehicle.model}
                        onChange={handleChange}
                        placeholder="Model (e.g., Civic)"
                        className="w-full px-3 py-2 border rounded"
                    />
                    {error && <div className="text-red-600">{error}</div>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                        {loading ? "Saving..." : "Add Vehicle"}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <button
                        onClick={handleSkip}
                        className="text-blue-600 underline hover:text-blue-800"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}
