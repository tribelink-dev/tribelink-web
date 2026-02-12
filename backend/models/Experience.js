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
  category: {
    type: String,
    enum: [
      'Living with the Land',
      'Stories of the Past',
      'The Soul',
      'The Unseen',
      'Creative Pulse',
      'Water & Flow',
      'Gastronomy & Ancestral Flavors',
      'Regional Exclusives'
    ],
    required: true
  },
  subcategory: {
    type: String,
    required: true
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
  },
  // Revolutionary Cultural/Traditional Experience Metadata
  culturalMetadata: {
    heritage: {
      type: String,
      enum: ['Traditional', 'Contemporary', 'Fusion', 'Indigenous', 'Colonial', 'Modern', null],
      default: null
    },
    traditions: [{
      type: String // e.g., 'Festival', 'Cuisine', 'Craft', 'Music', 'Dance', 'Ritual', 'Ceremony'
    }],
    culturalSignificance: {
      type: String,
      enum: ['High', 'Medium', 'Low', null],
      default: null
    },
    authenticityScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5
    },
    regionalTags: [{
      type: String // e.g., 'Kerala Backwaters', 'Tamil Nadu Temples', 'Rajasthan Desert'
    }],
    experienceType: {
      type: String,
      enum: ['Hands-on', 'Observational', 'Interactive', 'Educational', 'Spiritual', 'Festive', 'Culinary', 'Artistic', null],
      default: null
    },
    languageOfExperience: [{
      type: String // Languages used during the experience
    }],
    localCommunityInvolvement: {
      type: Boolean,
      default: false
    },
    seasonalAvailability: [{
      type: String // e.g., 'Monsoon', 'Harvest', 'Festival Season'
    }]
  },
  tags: [{
    type: String // General tags for AI matching
  }],
  // Distinguish between host experiences and guide tours
  experienceSource: {
    type: String,
    enum: ['HOST_EXPERIENCE', 'GUIDE_TOUR'],
    default: 'HOST_EXPERIENCE'
  },
  
  // Experience provider type (for artisans, performers, etc.)
  experienceProviderType: {
    type: String,
    enum: ['ARTISAN_WORKSHOP', 'PERFORMANCE', 'CULTURAL_EXPERIENCE', 'GUIDE_TOUR'],
    default: 'CULTURAL_EXPERIENCE'
  },
  
  // Archive status - archived experiences won't show to travelers
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Experience', experienceSchema);

