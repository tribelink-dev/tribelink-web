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
  // Only for EXPERIENCE_HOST providers
  experiences: [{
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
  }]
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

// Register as both 'Provider' and 'Host' for backward compatibility
const Provider = mongoose.model('Provider', providerSchema);
// Register as 'Host' alias so Experience model can reference it
if (!mongoose.models.Host) {
  mongoose.model('Host', providerSchema);
}

module.exports = Provider;

