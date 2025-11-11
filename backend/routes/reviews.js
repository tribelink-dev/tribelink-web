const express = require('express');
const Review = require('../models/Review');
const Experience = require('../models/Experience');
const { authenticate, requireUser } = require('../middleware/auth');

const router = express.Router();

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

    // Create review
    const review = new Review({
      experience: experienceId,
      user: req.user._id,
      rating,
      comment: comment || '',
      trip: tripId || null
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

