const mongoose = require('mongoose');

const infoSchema = new mongoose.Schema({
  data: String, // or any other fields
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Info', infoSchema);
