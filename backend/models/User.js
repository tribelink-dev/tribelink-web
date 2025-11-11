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

