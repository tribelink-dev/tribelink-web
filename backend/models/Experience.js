const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Host',
    required: true
  },
  location: {
    country: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  availableDates: [{
    date: {
      type: Date,
      required: true
    },
    startTime: {
      type: String, // Format: "HH:mm" (e.g., "09:00")
      default: null
    },
    endTime: {
      type: String, // Format: "HH:mm" (e.g., "17:00")
      default: null
    },
    available: {
      type: Boolean,
      default: true
    }
  }],
  price: {
    type: Number,
    required: true,
    min: 0
  },
  contentUrl: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 2 // hours
  },
  maxParticipants: {
    type: Number,
    default: 10
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Experience', experienceSchema);

