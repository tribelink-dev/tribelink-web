const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  experience: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Experience',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  }
}, {
  timestamps: true
});

// Ensure one review per user per experience
reviewSchema.index({ experience: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);

