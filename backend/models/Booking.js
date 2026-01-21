/**
 * Unified Booking Model
 * Supports bookings for adobe stays, experiences, and events
 */

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  bookingType: {
    type: String,
    enum: ['ADOBE_STAY', 'EXPERIENCE', 'EVENT'],
    required: true
  },
  
  // Adobe stay booking
  adobeStay: {
    localHost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LocalHost',
      required: function() { return this.bookingType === 'ADOBE_STAY'; }
    },
    checkIn: {
      type: Date,
      required: function() { return this.bookingType === 'ADOBE_STAY'; }
    },
    checkOut: {
      type: Date,
      required: function() { return this.bookingType === 'ADOBE_STAY'; }
    },
    numberOfGuests: {
      type: Number,
      min: 1,
      default: 1
    },
    specialRequests: {
      type: String
    }
  },
  
  // Experience booking
  experience: {
    experienceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Experience',
      required: function() { return this.bookingType === 'EXPERIENCE'; }
    },
    date: {
      type: Date,
      required: function() { return this.bookingType === 'EXPERIENCE'; }
    },
    startTime: {
      type: String, // Format: "HH:mm"
      required: function() { return this.bookingType === 'EXPERIENCE'; }
    },
    numberOfParticipants: {
      type: Number,
      min: 1,
      default: 1
    },
    specialRequests: {
      type: String
    }
  },
  
  // Event booking
  event: {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: function() { return this.bookingType === 'EVENT'; }
    },
    ticketCount: {
      type: Number,
      min: 1,
      default: 1,
      required: function() { return this.bookingType === 'EVENT'; }
    },
    ticketTier: {
      type: String, // e.g., 'VIP', 'General'
      default: null
    },
    seatNumbers: [{
      type: String // If applicable
    }]
  },
  
  // Booking status
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Refunded'],
    default: 'Pending'
  },
  
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String
  },
  paymentDate: {
    type: Date
  },
  transactionId: {
    type: String
  },
  
  // Cancellation
  cancellationReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  
  // Trip reference (if booking is part of a trip)
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  
  // Contact information for booking
  contactInfo: {
    name: String,
    email: String,
    phone: String
  },
  
  // Notes
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ bookingType: 1, status: 1 });
bookingSchema.index({ 'adobeStay.localHost': 1 });
bookingSchema.index({ 'experience.experienceId': 1 });
bookingSchema.index({ 'event.eventId': 1 });
bookingSchema.index({ trip: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for booking title
bookingSchema.virtual('title').get(function() {
  switch (this.bookingType) {
    case 'ADOBE_STAY':
      return `Adobe Stay Booking`;
    case 'EXPERIENCE':
      return `Experience Booking`;
    case 'EVENT':
      return `Event Booking`;
    default:
      return 'Booking';
  }
});

// Method to cancel booking
bookingSchema.methods.cancel = async function(reason) {
  this.status = 'Cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  
  // Calculate refund based on cancellation policy
  // This can be enhanced based on cancellation policies
  this.refundAmount = this.totalPrice; // Full refund for now
  this.paymentStatus = 'Refunded';
  
  // Update availability
  if (this.bookingType === 'ADOBE_STAY' && this.adobeStay.localHost) {
    const LocalHost = require('./LocalHost');
    const localHost = await LocalHost.findById(this.adobeStay.localHost);
    if (localHost) {
      // Release the dates
      const checkIn = new Date(this.adobeStay.checkIn);
      const checkOut = new Date(this.adobeStay.checkOut);
      let currentDate = new Date(checkIn);
      
      while (currentDate < checkOut) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const availability = localHost.availability.find(avail => {
          const availDateStr = new Date(avail.date).toISOString().split('T')[0];
          return availDateStr === dateStr;
        });
        
        if (availability) {
          availability.bookedSlots = Math.max(0, availability.bookedSlots - this.adobeStay.numberOfGuests);
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      await localHost.save();
    }
  } else if (this.bookingType === 'EVENT' && this.event.eventId) {
    const Event = require('./Event');
    const event = await Event.findById(this.event.eventId);
    if (event) {
      await event.bookTickets(-this.event.ticketCount, this.event.ticketTier); // Negative to add back
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('Booking', bookingSchema);

