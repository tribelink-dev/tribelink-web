/**
 * Event/Concert Model
 * For live events, concerts, festivals, and cultural performances
 * Supports real-time updates
 */

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Concert', 'Festival', 'Cultural Event', 'Performance', 'Workshop', 'Exhibition', 'Other'],
    required: true
  },
  
  // Organizer information
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider', // Can be a provider or external organizer
    default: null
  },
  organizerName: {
    type: String, // For external organizers
    trim: true
  },
  organizerContact: {
    email: String,
    phone: String
  },
  
  // Date and time
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // Format: "HH:mm"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:mm"
    required: true
  },
  duration: {
    type: Number, // in hours
    default: 2
  },
  
  // Location/venue
  location: {
    venue: {
      type: String,
      required: true
    },
    address: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
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
  
  // Ticket information
  ticketPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0
  },
  // Different ticket tiers (optional)
  ticketTiers: [{
    name: {
      type: String, // e.g., 'VIP', 'General', 'Student'
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    capacity: {
      type: Number,
      required: true,
      min: 0
    },
    available: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Media
  imageUrl: {
    type: String,
    default: null
  },
  contentUrl: {
    type: String, // Video/promo content
    default: null
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
  
  // Real-time update support
  isLive: {
    type: Boolean,
    default: false // Set to true for events that need real-time updates
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updateHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    field: String, // Which field was updated
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    reason: String
  }],
  
  // Event details
  category: {
    type: String,
    enum: [
      'Music',
      'Dance',
      'Theater',
      'Art',
      'Food',
      'Religious',
      'Cultural',
      'Sports',
      'Educational',
      'Other'
    ],
    default: 'Cultural'
  },
  tags: [{
    type: String
  }],
  
  // Additional information
  ageRestriction: {
    type: String, // e.g., 'All Ages', '18+', '21+'
    default: 'All Ages'
  },
  dressCode: {
    type: String
  },
  facilities: [{
    type: String // e.g., 'Parking', 'Food', 'Restrooms', 'Wheelchair Accessible'
  }],
  
  // Status
  status: {
    type: String,
    enum: ['Upcoming', 'Live', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Upcoming'
  },
  
  // Booking information
  bookingOpen: {
    type: Boolean,
    default: true
  },
  bookingDeadline: {
    type: Date // Last date/time to book tickets
  },
  
  // Rating and reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
eventSchema.index({ date: 1, startTime: 1 });
eventSchema.index({ 'location.country': 1, 'location.state': 1, 'location.district': 1 });
eventSchema.index({ 'location.coordinates': '2dsphere' });
eventSchema.index({ type: 1, category: 1 });
eventSchema.index({ isLive: 1, lastUpdated: -1 }); // For real-time updates query
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ bookingOpen: 1, date: 1 });

// Method to update event with tracking
eventSchema.methods.updateWithTracking = function(field, newValue, reason) {
  const oldValue = this[field];
  this[field] = newValue;
  this.lastUpdated = new Date();
  
  this.updateHistory.push({
    timestamp: new Date(),
    field,
    oldValue,
    newValue,
    reason: reason || 'Manual update'
  });
  
  // Keep only last 50 updates
  if (this.updateHistory.length > 50) {
    this.updateHistory = this.updateHistory.slice(-50);
  }
  
  return this.save();
};

// Method to check if tickets are available
eventSchema.methods.hasAvailableTickets = function(count = 1, tier = null) {
  if (tier) {
    const ticketTier = this.ticketTiers.find(t => t.name === tier);
    return ticketTier && ticketTier.available >= count;
  }
  return this.availableTickets >= count;
};

// Method to book tickets
eventSchema.methods.bookTickets = function(count, tier = null) {
  if (!this.hasAvailableTickets(count, tier)) {
    throw new Error('Not enough tickets available');
  }
  
  if (tier) {
    const ticketTier = this.ticketTiers.find(t => t.name === tier);
    if (ticketTier) {
      ticketTier.available -= count;
    }
  } else {
    this.availableTickets -= count;
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

// Virtual for main image
eventSchema.virtual('mainImage').get(function() {
  if (this.imageUrl) return this.imageUrl;
  const mainImg = this.images.find(img => img.isMain);
  return mainImg ? mainImg.url : (this.images[0] ? this.images[0].url : null);
});

module.exports = mongoose.model('Event', eventSchema);


