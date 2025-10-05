import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper function to split the slots array into "pillars" of 10
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function SlotReservationPage() {
  // Get the location name from the URL, which was passed by the BookingPage
  const { locationName } = useParams();

  // State to hold the spots data fetched from the API
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState([]);

  // useEffect hook to fetch data when the component mounts or locationName changes
  useEffect(() => {
    if (!locationName) return;

    const loadSpotsForLocation = async () => {
      try {
        const encodedLocationName = encodeURIComponent(locationName);
        const response = await fetch(`${API_BASE}/spots/location/${encodedLocationName}`);
        if (!response.ok) {
          throw new Error("Failed to fetch spots for this location.");
        }
        const data = await response.json();
        setSpots(data.spots); // Update state with the spots from the API
      } catch (e) {
        console.error("Failed to load spots:", e);
        alert("Could not load spots for this location.");
      } finally {
        setLoading(false);
      }
    };

    loadSpotsForLocation();
  }, [locationName]); // Dependency array ensures this runs when locationName changes

  // Group the fetched spots into pillars
  const pillars = chunk(spots, 10);

  const toggleSlot = (id, status) => {
    // Only allow selecting 'available' spots
    if (status !== "available") return;
    setSelectedSlots((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const getSlotClass = (id, status) => {
    if (selectedSlots.includes(id)) return "bg-green-500 text-white shadow-lg";
    if (status === "booked") return "bg-red-500 text-white";
    if (status === "available") return "bg-gray-300";
    if (status === "notAvailable")
      return "border-2 border-dashed border-gray-400 text-gray-400";
    return "";
  };

  // Show a loading message while data is being fetched
  if (loading) {
    return <div className="text-center p-10">Loading parking spots...</div>;
  }

  return (
    <div className="p-4 sm:p-6 bg-white shadow rounded-lg max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">BOOK YOUR SLOT FOR: {locationName}</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Filter</button>
      </div>

      <div className="flex flex-wrap gap-4 sm:gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-green-500 rounded-sm"></div> Your Selection
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-red-500 rounded-sm"></div> Booked
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-300 rounded-sm"></div> Available
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-dashed border-gray-400"></div> Not Available
        </div>
      </div>

      {/* DYNAMIC PARKING LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {pillars.map((pillarSlots, index) => (
          <div key={index} className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {pillarSlots.slice(0, 5).map((slot) => (
                <div
                  key={slot._id} // Use the unique _id from MongoDB
                  onClick={() => toggleSlot(slot._id, slot.available ? 'available' : 'booked')}
                  className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                    slot._id,
                    slot.available ? 'available' : 'booked'
                  )}`}
                >
                  {slot.name} {/* Display the spot name, e.g., 'P1' */}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-500">PILLAR NO {index + 1}</p>

            {pillarSlots.length > 5 && (
              <div className="flex flex-wrap gap-4 justify-center">
                {pillarSlots.slice(5, 10).map((slot) => (
                  <div
                    key={slot._id}
                    onClick={() => toggleSlot(slot._id, slot.available ? 'available' : 'booked')}
                    className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                      slot._id,
                      slot.available ? 'available' : 'booked'
                    )}`}
                  >
                    {slot.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm mt-6">
        <span className="ml-4">ENTRY</span>
        <span className="mr-4">EXIT</span>
      </div>
    </div>
  );
}
