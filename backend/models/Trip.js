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
    // Adobe stay for this day (replaces hotel)
    adobeStay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider', // LOCAL_HOST provider
      default: null
    },
    // Events booked for this day
    events: [{
      eventId: {
      type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
      },
      ticketCount: {
        type: Number,
        default: 1
      }
    }]
  }],
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);

