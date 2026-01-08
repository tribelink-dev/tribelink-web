const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  // Unified provider type
  providerType: {
    type: String,
    enum: ['EXPERIENCE_HOST', 'GUIDE', 'ACCOMMODATION_PROVIDER', 'DRIVER_PARTNER'],
    required: true,
    default: 'EXPERIENCE_HOST'
  },
  // Legacy role field for backward compatibility (deprecated, use providerType instead)
  role: {
    type: String,
    enum: ['Host', 'Guide'],
    required: false // Made optional since we're using providerType now
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
  profilePicture: {
    type: String,
    default: null
  },
  // Only for EXPERIENCE_HOST providers
  experiences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience'
  }],
  // Only for GUIDE providers - experiences they can service
  servicedExperiences: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience'
  }],
  // Availability for all provider types
  availability: [{
    date: Date,
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
  // Optional custom hourly rate (overrides tiered calculation)
  hourlyRate: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes to ensure email or phone uniqueness
providerSchema.index({ email: 1 });
providerSchema.index({ phoneNumber: 1 });
// Index for provider type queries
providerSchema.index({ providerType: 1 });
// Compound index for provider type + rating (common query pattern)
providerSchema.index({ providerType: 1, rating: -1 });

/**
 * Get hourly rate for guide based on rating tiers
 * Returns custom hourlyRate if set, otherwise calculates based on rating
 * @returns {Number} Hourly rate in USD
 */
providerSchema.methods.getHourlyRate = function() {
  // If custom hourly rate is set, use it
  if (this.hourlyRate && this.hourlyRate > 0) {
    return this.hourlyRate;
  }
  
  // Calculate based on rating tiers
  const rating = this.rating || 0;
  
  if (rating >= 5.0) return 20;  // $20/hour
  if (rating >= 4.0) return 15;  // $15/hour
  if (rating >= 3.0) return 12;  // $12/hour
  return 10;  // $10/hour for <3.0
};

// Register as both 'Provider' and 'Host' for backward compatibility
const Provider = mongoose.model('Provider', providerSchema);
// Register as 'Host' alias so Experience model can reference it
if (!mongoose.models.Host) {
  mongoose.model('Host', providerSchema);
}

module.exports = Provider;

