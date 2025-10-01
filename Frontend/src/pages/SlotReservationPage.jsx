import React, { useState } from "react";

const ParkingSlots = () => {
  const [selectedSlots, setSelectedSlots] = useState([]);

  const slots = [
    { id: "P1", status: "available" },
    { id: "P2", status: "notAvailable" },
    { id: "P3", status: "available" },
    { id: "P4", status: "notAvailable" },
    { id: "P5", status: "available" },
    { id: "P6", status: "available" },
    { id: "P7", status: "booked" },
    { id: "P8", status: "available" },
    { id: "P9", status: "available" },
    { id: "P10", status: "notAvailable" },
    { id: "S1", status: "available" },
    { id: "S2", status: "available" },
    { id: "S3", status: "available" },
    { id: "S4", status: "booked" },
    { id: "S5", status: "notAvailable" },
    { id: "S6", status: "available" },
    { id: "S7", status: "available" },
    { id: "S8", status: "booked" },
    { id: "S9", status: "available" },
    { id: "S10", status: "notAvailable" },
  ];

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
    <div className="p-6 bg-white shadow rounded-lg max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">BOOK YOUR SLOT</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">+ Add Filter</button>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mb-6 text-sm">
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

      {/* Parking Layout */}
      <div className="grid grid-cols-2 gap-10">
        {/* Left Section */}
        <div className="space-y-6">
          <div className="flex gap-4">
            {slots.slice(0, 5).map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggleSlot(slot.id, slot.status)}
                className={`w-16 h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                  slot.id,
                  slot.status
                )}`}
              >
                {slot.id}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500">PILLAR NO 1</p>

          <div className="flex gap-4">
            {slots.slice(5, 10).map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggleSlot(slot.id, slot.status)}
                className={`w-16 h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                  slot.id,
                  slot.status
                )}`}
              >
                {slot.id}
              </div>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="space-y-6">
          <div className="flex gap-4">
            {slots.slice(10, 15).map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggleSlot(slot.id, slot.status)}
                className={`w-16 h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                  slot.id,
                  slot.status
                )}`}
              >
                {slot.id}
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500">PILLAR NO 2</p>

          <div className="flex gap-4">
            {slots.slice(15, 20).map((slot) => (
              <div
                key={slot.id}
                onClick={() => toggleSlot(slot.id, slot.status)}
                className={`w-16 h-24 flex items-center justify-center font-semibold rounded cursor-pointer ${getSlotClass(
                  slot.id,
                  slot.status
                )}`}
              >
                {slot.id}
              </div>
            ))}
          </div>
        </div>
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
