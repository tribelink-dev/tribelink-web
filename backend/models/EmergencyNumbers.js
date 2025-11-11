const mongoose = require('mongoose');

const emergencyNumbersSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  countryName: {
    type: String,
    required: true,
    trim: true
  },
  police: {
    type: String,
    required: true,
    trim: true
  },
  fire: {
    type: String,
    required: true,
    trim: true
  },
  ambulance: {
    type: String,
    required: true,
    trim: true
  },
  emergency: {
    type: String,
    trim: true
  },
  embassy: {
    type: String,
    trim: true
  },
  consulate: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

emergencyNumbersSchema.index({ country: 1 });

module.exports = mongoose.model('EmergencyNumbers', emergencyNumbersSchema);

