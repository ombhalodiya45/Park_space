// src/pages/SignupPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming you use React Router for navigation

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    vehicles: [{ plateNumber: '', make: '', model: '' }],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (index, e) => {
    const { name, value } = e.target;
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index][name] = value;
    setFormData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const addVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicles: [...prev.vehicles, { plateNumber: '', make: '', model: '' }],
    }));
  };

  const removeVehicle = (index) => {
    const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect this to your backend signup API endpoint
    console.log('Submitting Signup Data:', formData);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800">Create Your Account</h2>
        <p className="mt-2 text-center text-gray-600">
          Already a member?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log In
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name*</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="e.g., Om Patel"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address*</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password*</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+1 234 567 890"
                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="pt-4">
            <h3 className="text-lg font-semibold text-gray-800">Vehicle Information (Optional)</h3>
            <p className="text-sm text-gray-500 mb-4">Add your vehicle details for faster booking.</p>
            {formData.vehicles.map((vehicle, index) => (
              <div key={index} className="p-4 mb-4 border rounded-lg bg-gray-50 relative">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    name="plateNumber"
                    value={vehicle.plateNumber}
                    onChange={(e) => handleVehicleChange(index, e)}
                    placeholder="License Plate"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    name="make"
                    value={vehicle.make}
                    onChange={(e) => handleVehicleChange(index, e)}
                    placeholder="Make (e.g., Honda)"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                  <input
                    name="model"
                    value={vehicle.model}
                    onChange={(e) => handleVehicleChange(index, e)}
                    placeholder="Model (e.g., Civic)"
                    className="w-full px-4 py-2 border rounded-md sm:col-span-2"
                  />
                </div>
                {formData.vehicles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVehicle(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addVehicle}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              + Add Another Vehicle
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 px-4 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
