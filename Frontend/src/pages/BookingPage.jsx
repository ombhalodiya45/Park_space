// src/pages/BookingPage.jsx
const BookingPage = () => {
  const bookings = [
    { id: 1, place: "City Mall", price: "₹50/hr", available: true },
    { id: 2, place: "Downtown Theater", price: "₹40/hr", available: false },
    { id: 3, place: "Corporate Tower", price: "₹60/hr", available: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl text-center font-extrabold text-gray-900 tracking-tight mb-6">
        Book Your Parking Slot
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((slot) => (
          <div
            key={slot.id}
            className="bg-white shadow-md rounded-lg p-5 hover:shadow-lg transition"
          >
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              {slot.place}
            </h2>
            <p className="text-gray-600 mb-2">Price: {slot.price}</p>
            <p
              className={`mb-4 font-medium ${
                slot.available ? "text-green-600" : "text-red-600"
              }`}
            >
              {slot.available ? "Available" : "Full"}
            </p>
            <button
              disabled={!slot.available}
              className={`px-4 py-2 rounded-lg w-full ${
                slot.available
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-400 text-white cursor-not-allowed"
              }`}
            >
              {slot.available ? "Book Now" : "Unavailable"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingPage;
