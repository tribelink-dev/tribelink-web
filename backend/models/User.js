const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not OAuth user
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null/undefined values - only enforces uniqueness for non-null values
    required: false
    // Don't set default - leave undefined for non-OAuth users
    // This ensures sparse unique index works correctly
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  preferences: {
    travelStyle: {
      type: String,
      enum: ['flexible', 'fixed'],
      default: null
    },
    pace: {
      type: String,
      enum: ['fast', 'slow'],
      default: null
    },
    transport: {
      type: String,
      enum: ['native', 'luxury'],
      default: null
    }
  },
  // Revolutionary AI-Powered Personalization Profile
  personalizationProfile: {
    culturalInterests: [{
      type: String // e.g., 'Traditional Crafts', 'Local Cuisine', 'Religious Sites', 'Festivals'
    }],
    preferredHeritage: [{
      type: String // e.g., 'Traditional', 'Indigenous', 'Colonial'
    }],
    experiencePreferences: {
      handsOn: { type: Number, min: 0, max: 10, default: 5 },
      observational: { type: Number, min: 0, max: 10, default: 5 },
      interactive: { type: Number, min: 0, max: 10, default: 5 },
      educational: { type: Number, min: 0, max: 10, default: 5 },
      spiritual: { type: Number, min: 0, max: 10, default: 5 }
    },
    budgetPattern: {
      averageSpent: { type: Number, default: 0 },
      preferredRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 1000 }
      },
      valueSeeking: { type: Number, min: 0, max: 10, default: 5 } // 0 = luxury, 10 = budget
    },
    accommodationPreferences: {
      preferredTypes: [{
        type: String // e.g., 'Heritage', 'Boutique', 'Luxury', 'Budget', 'Homestay'
      }],
      averageSpentPerNight: { type: Number, default: 0 },
      amenitiesPriority: [{
        type: String // e.g., 'WiFi', 'Pool', 'Breakfast', 'Location'
      }]
    },
    transportationPreferences: {
      preferredVehicleTypes: [{
        type: String // e.g., 'Sedan', 'SUV', 'Luxury'
      }],
      averageSpentPerDay: { type: Number, default: 0 },
      comfortLevel: { type: Number, min: 0, max: 10, default: 5 }
    },
    travelPatterns: {
      averageTripDuration: { type: Number, default: 0 },
      preferredRegions: [{
        type: String
      }],
      repeatLocations: [{
        location: String,
        visitCount: { type: Number, default: 1 }
      }]
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  tripWallet: {
    balance: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  tokens: {
    type: Number,
    default: 2,
    min: 0,
    validate: {
      validator: function(value) {
        return value >= 0;
      },
      message: 'Tokens cannot be negative'
    }
  },
  bucketlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience'
  }],
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }],
  emergencyContacts: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    relationship: {
      type: String,
      enum: ['family', 'friend', 'colleague', 'other'],
      default: 'other'
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  emergencyInfo: {
    medicalInfo: {
      type: String,
      trim: true
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
      default: null
    },
    allergies: [{
      type: String,
      trim: true
    }],
    medications: [{
      type: String,
      trim: true
    }],
    insuranceInfo: {
      provider: String,
      policyNumber: String,
      emergencyContact: String
    }
  },
  safetySettings: {
    locationSharingEnabled: {
      type: Boolean,
      default: false
    },
    checkInReminders: {
      type: Boolean,
      default: false
    },
    autoShareLocationDuringTrips: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Compound index to ensure email or phone uniqueness
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('User', userSchema);

