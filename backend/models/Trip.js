const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
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
    required: false, // Optional to support state-only selections (e.g., "All of Kerala")
    default: ''
  },
  locations: [{
    state: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: false, // Optional to support state-only selections
      default: ''
    }
  }], // Array of locations for multi-city trips
  preferences: {
    travelStyle: String,
    pace: String,
    transport: String
  },
  schedule: [{
    date: {
      type: Date,
      required: true
    },
    activities: [{
      experienceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Experience',
        required: true
      },
      title: String,
      price: Number,
      startTime: String, // Format: "HH:mm"
      endTime: String,   // Format: "HH:mm"
      duration: Number,  // hours
      provider: {
        _id: mongoose.Schema.Types.ObjectId,
        name: String
      }
    }],
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null
    },
    hotelSelected: {
      type: Boolean,
      default: false
    },
    chauffeur: {
      type: Boolean,
      default: false
    },
    chauffeurRequired: {
      type: Boolean,
      default: false
    },
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      default: null
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Host',
      default: null
    },
    guideHours: {
      calculated: {
        type: Number,
        default: 0
      },
      adjusted: {
        type: Number,
        default: null
      },
      final: {
        type: Number,
        default: 0
      }
    },
    cab: {
      type: Boolean,
      default: false
    },
    foodOrders: [{
      type: String
    }]
  }],
  guidePricingMode: {
    type: String,
    enum: ['daily', 'hourly'],
    default: 'daily'
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: null
  },
  assignedDriverProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriverProvider',
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);

