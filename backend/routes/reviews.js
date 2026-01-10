const express = require('express');
const Review = require('../models/Review');
const Experience = require('../models/Experience');
const Ticket = require('../models/Ticket');
const Trip = require('../models/Trip');
const { authenticate, requireUser } = require('../middleware/auth');

const router = express.Router();

// Check if user can review an experience
router.get('/:experienceId/can-review', authenticate, requireUser, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const userId = req.user._id;

    // Check if experience exists
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found', canReview: false });
    }

    // Check if user already reviewed this experience
    const existingReview = await Review.findOne({
      experience: experienceId,
      user: userId
    });

    if (existingReview) {
      return res.json({ 
        canReview: false, 
        reason: 'You have already reviewed this experience',
        hasExistingReview: true
      });
    }

    // Check if user has a ticket for this experience
    const ticket = await Ticket.findOne({
      experience: experienceId,
      user: userId,
      status: { $in: ['active', 'verified'] }
    });

    if (ticket) {
      return res.json({ 
        canReview: true, 
        reason: 'You have booked this experience',
        hasBooking: true,
        ticketId: ticket._id
      });
    }

    // Check if user has this experience in any completed trip schedule
    const trips = await Trip.find({
      user: userId,
      'schedule.activities.experienceId': experienceId
    }).select('_id fromDate toDate');

    if (trips.length > 0) {
      // Check if any trip is completed (toDate is in the past)
      const completedTrip = trips.find(trip => new Date(trip.toDate) < new Date());
      if (completedTrip) {
        return res.json({ 
          canReview: true, 
          reason: 'You have completed a trip with this experience',
          hasBooking: true,
          tripId: completedTrip._id
        });
      }
    }

    return res.json({ 
      canReview: false, 
      reason: 'You must book and complete this experience before reviewing',
      hasBooking: false
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message, canReview: false });
  }
});

// Create a review
router.post('/:experienceId', authenticate, requireUser, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { rating, comment, tripId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if experience exists
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Check if user already reviewed this experience
    const existingReview = await Review.findOne({
      experience: experienceId,
      user: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this experience' });
    }

    // Verify user has booked this experience
    const ticket = await Ticket.findOne({
      experience: experienceId,
      user: req.user._id,
      status: { $in: ['active', 'verified'] }
    });

    // If no ticket, check if experience is in a completed trip
    let hasBooking = !!ticket;
    let bookingTripId = tripId || null;

    if (!hasBooking) {
      const trips = await Trip.find({
        user: req.user._id,
        'schedule.activities.experienceId': experienceId
      });

      const completedTrip = trips.find(t => new Date(t.toDate) < new Date());
      if (completedTrip) {
        hasBooking = true;
        bookingTripId = completedTrip._id;
      }
    } else {
      bookingTripId = ticket.trip;
    }

    if (!hasBooking) {
      return res.status(403).json({ 
        message: 'You must book and complete this experience before reviewing it' 
      });
    }

    // Create review
    const review = new Review({
      experience: experienceId,
      user: req.user._id,
      rating,
      comment: comment || '',
      trip: bookingTripId
    });

    await review.save();

    // Update experience ratings
    const reviews = await Review.find({ experience: experienceId });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    experience.averageRating = totalRating / reviews.length;
    experience.reviewCount = reviews.length;
    await experience.save();

    // Populate user info for response
    await review.populate('user', 'name email');

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this experience' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reviews for an experience
router.get('/:experienceId', async (req, res) => {
  try {
    const { experienceId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const reviews = await Review.find({ experience: experienceId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalReviews = await Review.countDocuments({ experience: experienceId });

    res.json({
      reviews,
      totalReviews,
      hasMore: parseInt(skip) + reviews.length < totalReviews
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a review
router.put('/:reviewId', authenticate, requireUser, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update experience ratings
    const reviews = await Review.find({ experience: review.experience });
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const experience = await Experience.findById(review.experience);
    experience.averageRating = totalRating / reviews.length;
    await experience.save();

    await review.populate('user', 'name email');

    res.json({
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a review
router.delete('/:reviewId', authenticate, requireUser, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const experienceId = review.experience;
    await review.deleteOne();

    // Update experience ratings
    const reviews = await Review.find({ experience: experienceId });
    const experience = await Experience.findById(experienceId);
    
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      experience.averageRating = totalRating / reviews.length;
      experience.reviewCount = reviews.length;
    } else {
      experience.averageRating = 0;
      experience.reviewCount = 0;
    }
    await experience.save();

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

