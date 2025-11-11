const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    required: false,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['phone', 'email'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for phone/email and type
otpSchema.index({ phoneNumber: 1, type: 1 });
otpSchema.index({ email: 1, type: 1 });

module.exports = mongoose.model('OTP', otpSchema);

