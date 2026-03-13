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
  // How this trip was planned (manual / automatic / abodes-first, etc.)
  planningMode: {
    type: String,
    enum: ['MANUAL', 'AUTOMATIC', 'ABODE_FIRST'],
    default: 'MANUAL'
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
      },
      // Planner-level source tagging so we know if this came from
      // an abode bundle or from standalone experiences
      source: {
        type: String,
        enum: ['ABODE', 'PURE'],
        default: 'PURE'
      },
      // Optional abode association for ABODE-sourced activities
      abodeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LocalHost',
        default: null
      }
    }],
    // Abode stay for this day (replaces hotel)
    abodeStay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider', // LOCAL_HOST provider
      default: null
    },
    // Optional segment identifier for multi-region trips
    segmentId: {
      type: String,
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

