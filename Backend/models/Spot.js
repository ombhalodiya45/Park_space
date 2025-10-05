const mongoose = require("mongoose");

// We can define the schema for an individual spot first
const SingleSpotSchema = new mongoose.Schema({
  spotNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['available', 'booked', 'notAvailable'],
    default: 'available'
  }
}, { _id: false }); // _id: false prevents Mongoose from creating a separate ID for each spot in the array

const LocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g., "Downtown Garage"
    address: { type: String, required: true, trim: true }, // The physical address of the lot
    capacity: { type: Number, required: true }, // The total number of spots, e.g., 15
    spots: [SingleSpotSchema] // An array of all the spots in this location
  },
  { timestamps: true }
);

module.exports = mongoose.model("Location", LocationSchema);
