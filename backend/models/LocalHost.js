/**
 * LocalHost Model
 * Extends Provider model for local hosts offering abode stays
 * 
 * Abode stays are cultural immersion experiences where travelers
 * stay with local families to understand traditional practices
 */

const mongoose = require('mongoose');
const Provider = require('./Provider');

// Create a schema that extends Provider
const localHostSchema = new mongoose.Schema({
  // Reference to Provider (LOCAL_HOST type)
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  
  // Abode (home) details
  abodeDetails: {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100 // Catchy title should be concise
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 2 // Number of guests that can be accommodated
    },
    bedrooms: {
      type: Number,
      min: 1,
      default: 1
    },
    bathrooms: {
      type: Number,
      min: 1,
      default: 1
    },
    amenities: [{
      type: String // e.g., 'WiFi', 'Kitchen', 'Air Conditioning', 'Garden', 'Traditional Architecture'
    }],
    houseRules: [{
      type: String // e.g., 'No smoking', 'Respect local customs', 'Quiet hours after 10 PM'
    }],
    propertyType: {
      type: String,
      enum: ['Traditional Home', 'Heritage House', 'Village Home', 'Farmhouse', 'Cottage', 'Other'],
      default: 'Traditional Home'
    }
  },
  
  // Cultural practices the host shares
  culturalPractices: [{
    practice: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    category: {
      type: String,
      enum: ['Cooking', 'Craft', 'Music', 'Dance', 'Ritual', 'Festival', 'Agriculture', 'Traditional Medicine', 'Other']
    }
  }],
  
  // Nearby culturally/historically significant places they guide to
  nearbyPlaces: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    distance: {
      type: Number, // in km
      default: 0
    },
    significance: {
      type: String,
      enum: ['Cultural', 'Historical', 'Religious', 'Natural', 'Artistic', 'Other']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  
  // Availability for hosting
  availability: [{
    date: {
      type: Date,
      required: true
    },
    available: {
      type: Boolean,
      default: true
    },
    bookedSlots: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  // Pricing
  pricing: {
    pricePerNight: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    // Optional: different pricing for longer stays
    weeklyDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0 // Percentage discount for 7+ nights
    },
    monthlyDiscount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0 // Percentage discount for 30+ nights
    }
  },
  
  // Images of the abode
  images: [{
    url: {
      type: String,
      required: true
    },
    isMain: {
      type: Boolean,
      default: false
    },
    caption: {
      type: String
    }
  }],
  
  // Languages spoken by the host family
  languages: [{
    type: String // e.g., 'English', 'Hindi', 'Malayalam', 'Tamil'
  }],
  
  // Optional family background/story
  familyInfo: {
    familySize: {
      type: Number,
      min: 1
    },
    familyMembers: [{
      name: String,
      age: Number,
      role: String // e.g., 'Host', 'Spouse', 'Elder', 'Child'
    }],
    background: {
      type: String // Family history, traditions, story
    },
    generations: {
      type: Number,
      min: 1
    }
  },
  
  // Location details
  location: {
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
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    nearbyLandmarks: [{
      type: String
    }]
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: {
    type: Date
  },
  
  // Rating and reviews
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
  
  // Response time (average time to respond to booking requests)
  averageResponseTime: {
    type: Number, // in hours
    default: 24
  },
  
  // Cancellation policy
  cancellationPolicy: {
    type: String,
    enum: ['Flexible', 'Moderate', 'Strict'],
    default: 'Moderate'
  },
  
  // Archive status - archived abodes won't show to travelers
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for faster queries
localHostSchema.index({ 'location.country': 1, 'location.state': 1, 'location.district': 1 });
localHostSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries
localHostSchema.index({ rating: -1 });
localHostSchema.index({ isVerified: 1 });
localHostSchema.index({ 'pricing.pricePerNight': 1 });

// Virtual for checking if abode is available on a specific date
localHostSchema.methods.isAvailableOnDate = function(date) {
  const dateStr = date.toISOString().split('T')[0];
  const availability = this.availability.find(avail => {
    const availDateStr = new Date(avail.date).toISOString().split('T')[0];
    return availDateStr === dateStr && avail.available === true;
  });
  
  if (!availability) return false;
  
  // Check if capacity is available
    return availability.bookedSlots < this.abodeDetails.capacity;
};

// Virtual for getting main image
localHostSchema.virtual('mainImage').get(function() {
  const mainImg = this.images.find(img => img.isMain);
  return mainImg ? mainImg.url : (this.images[0] ? this.images[0].url : null);
});

module.exports = mongoose.model('LocalHost', localHostSchema);


