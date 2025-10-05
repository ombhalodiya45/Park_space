import React, { useState } from "react";

// Helper function to split the slots array into "pillars" of 10
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const ParkingSlots = ({ capacity = 20 }) => { // Using a default capacity of 20 as an example
  const [selectedSlots, setSelectedSlots] = useState([]);

  // This now dynamically creates the slots based on the capacity prop
  const slots = Array.from({ length: capacity }, (_, i) => {
    const slotNumber = i + 1;
    // You can replace this with your actual data from the backend
    if (slotNumber % 7 === 0) return { id: `P${slotNumber}`, status: "booked" };
    if (slotNumber % 4 === 0) return { id: `P${slotNumber}`, status: "notAvailable" };
    return { id: `P${slotNumber}`, status: "available" };
  });

  // Automatically group the slots into pillars, each containing up to 10 spots
  const pillars = chunk(slots, 10);

  const toggleSlot = (id, status) => {
    if (status === "booked" || status === "notAvailable") return;
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

  return (
    <div className="p-4 sm:p-6 bg-white shadow rounded-lg max-w-5xl mx-auto">
      {/* Header and Legend remain the same */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">BOOK YOUR SLOT</h2>
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
            {/* First row of the pillar (up to 5 spots) */}
            <div className="flex flex-wrap gap-4 justify-center">
              {pillarSlots.slice(0, 5).map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => toggleSlot(slot.id, slot.status)}
                  className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                    slot.id,
                    slot.status
                  )}`}
                >
                  {slot.id}
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-gray-500">PILLAR NO {index + 1}</p>

            {/* Second row of the pillar (spots 6-10), only rendered if they exist */}
            {pillarSlots.length > 5 && (
              <div className="flex flex-wrap gap-4 justify-center">
                {pillarSlots.slice(5, 10).map((slot) => (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot.id, slot.status)}
                    className={`w-12 h-20 sm:w-16 sm:h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                      slot.id,
                      slot.status
                    )}`}
                  >
                    {slot.id}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Entry / Exit */}
      <div className="flex justify-between text-sm mt-6">
        <span className="ml-4">ENTRY</span>
        <span className="mr-4">EXIT</span>
      </div>
    </div>
  );
};

export default ParkingSlots;
