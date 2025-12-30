const mongoose = require('mongoose');
const crypto = require('crypto');

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true,
    default: () => `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  experience: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true
  },
  // Experience details at time of booking (snapshot)
  experienceDetails: {
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      default: 2
    },
    location: {
      district: String,
      state: String,
      country: String
    }
  },
  // Schedule details
  scheduledDate: {
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
  // Verification status
  status: {
    type: String,
    enum: ['active', 'verified', 'cancelled', 'expired'],
    default: 'active'
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: null
  },
  // QR code data (can be generated on the fly or stored)
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for quick lookups
ticketSchema.index({ ticketId: 1 });
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ provider: 1, status: 1 });
ticketSchema.index({ experience: 1, scheduledDate: 1 });

// Generate QR code data
ticketSchema.methods.generateQRCode = function() {
  return JSON.stringify({
    ticketId: this.ticketId,
    userId: this.user.toString(),
    experienceId: this.experience.toString(),
    scheduledDate: this.scheduledDate.toISOString(),
    startTime: this.startTime
  });
};

// Check if ticket is valid for verification
ticketSchema.methods.isValidForVerification = function() {
  const now = new Date();
  const scheduledDateTime = new Date(this.scheduledDate);
  const [hours, minutes] = this.startTime.split(':');
  scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Allow verification 30 minutes before start time and up to 2 hours after end time
  const verificationStart = new Date(scheduledDateTime.getTime() - 30 * 60 * 1000);
  const [endHours, endMinutes] = this.endTime.split(':');
  const endDateTime = new Date(scheduledDateTime);
  endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
  const verificationEnd = new Date(endDateTime.getTime() + 2 * 60 * 60 * 1000);
  
  return now >= verificationStart && now <= verificationEnd && this.status === 'active';
};

module.exports = mongoose.model('Ticket', ticketSchema);

