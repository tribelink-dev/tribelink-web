const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  amenities: [{
    type: String
  }], // ['WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 'Room Service']
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
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  roomsAvailable: {
    type: Number,
    required: true,
    min: 0
  },
  totalRooms: {
    type: Number,
    required: true,
    min: 1
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  availability: [{
    date: {
      type: Date,
      required: true
    },
    roomsAvailable: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  policies: {
    checkIn: {
      type: String,
      default: '14:00'
    },
    checkOut: {
      type: String,
      default: '11:00'
    },
    cancellationPolicy: {
      type: String,
      trim: true
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster queries
hotelSchema.index({ 'location.country': 1, 'location.state': 1, 'location.district': 1 });
hotelSchema.index({ pricePerNight: 1 });
hotelSchema.index({ rating: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);

