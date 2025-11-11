const mongoose = require('mongoose');

const emergencyEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['SOS', 'CHECK_IN', 'LOCATION_SHARE'],
    default: 'SOS',
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    address: {
      type: String,
      trim: true
    },
    accuracy: {
      type: Number
    }
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  contactsNotified: [{
    contactId: String,
    name: String,
    phone: String,
    email: String,
    notifiedAt: {
      type: Date,
      default: Date.now
    },
    notificationMethod: {
      type: String,
      enum: ['email', 'sms', 'both'],
      default: 'email'
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    }
  }],
  message: {
    type: String,
    trim: true
  },
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
emergencyEventSchema.index({ user: 1, createdAt: -1 });
emergencyEventSchema.index({ eventType: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyEvent', emergencyEventSchema);

