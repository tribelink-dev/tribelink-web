const mongoose = require('mongoose');

const driverProviderSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  vehicleType: {
    type: String,
    enum: ['Sedan', 'SUV', 'Luxury', 'Van', 'Mini Bus', 'Bus'],
    required: true
  },
  licenseNumber: {
    type: String,
    required: true,
    trim: true
  },
  licenseDocument: {
    type: String, // URL to uploaded license document
    default: null
  },
  documents: [{
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['License', 'Insurance', 'Registration', 'Other'],
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  availability: [{
    date: {
      type: Date,
      required: true
    },
    available: {
      type: Boolean,
      default: true
    },
    timeSlots: [{
      startTime: String, // Format: "HH:mm"
      endTime: String,   // Format: "HH:mm"
      available: {
        type: Boolean,
        default: true
      }
    }]
  }],
  pricing: {
    perDay: {
      type: Number,
      required: true,
      min: 0,
      default: 50 // Default $50 per day
    },
    perHour: {
      type: Number,
      min: 0,
      default: null // Optional hourly rate
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  rating: {
    type: Number,
    default: 5,
    min: 0,
    max: 5
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
  // Additional driver-specific fields
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  },
  languages: [{
    type: String
  }],
  vehicleDetails: {
    make: String,
    model: String,
    year: Number,
    registrationNumber: String,
    capacity: {
      type: Number,
      min: 1
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
driverProviderSchema.index({ providerId: 1 });
driverProviderSchema.index({ vehicleType: 1 });
driverProviderSchema.index({ rating: -1 });
driverProviderSchema.index({ isVerified: 1 });
// Compound index for availability queries
driverProviderSchema.index({ 'availability.date': 1 });

module.exports = mongoose.model('DriverProvider', driverProviderSchema);

