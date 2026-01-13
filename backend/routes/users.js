const express = require('express');
const User = require('../models/User');
const { authenticate, requireUser } = require('../middleware/auth');
const checkDBConnection = require('../middleware/dbCheck');

const router = express.Router();

// Get current user
router.get('/me', authenticate, requireUser, checkDBConnection, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('bucketlist')
      .populate('bookings');
    
    res.json({ user });
  } catch (error) {
    // Check if it's a MongoDB connection error
    if (error.name === 'MongoServerError' || error.message?.includes('Mongo') || error.message?.includes('connection')) {
      return res.status(503).json({ 
        message: 'Database connection unavailable. MongoDB is not running.',
        error: 'MongoDB connection error'
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit KYT Questionnaire
router.post('/kyt', authenticate, requireUser, async (req, res) => {
  try {
    const { travelStyle, pace, transport } = req.body.preferences;

    if (!travelStyle || !pace || !transport) {
      return res.status(400).json({ message: 'All preference fields are required' });
    }

    const user = await User.findById(req.user._id);
    user.preferences = {
      travelStyle,
      pace,
      transport
    };
    await user.save();

    res.json({ message: 'Preferences saved', preferences: user.preferences });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user bucketlist
router.get('/bucketlist', authenticate, requireUser, async (req, res) => {
  try {
    const { populate } = req.query; // Check if client wants populated experiences
    
    if (populate === 'true') {
      // Return populated experiences with full details
      const user = await User.findById(req.user._id)
        .populate({
          path: 'bucketlist',
          populate: {
            path: 'provider',
            select: 'name rating',
            model: 'Host'
          }
        });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const Experience = require('../models/Experience');
      const { normalizeExperiences, getBaseUrlFromRequest } = require('../utils/imageUtils');
      
      // Normalize experiences for frontend
      const baseUrl = getBaseUrlFromRequest(req);
      const normalizedExperiences = normalizeExperiences(user.bucketlist || [], baseUrl);
      
      res.json({ 
        bucketlist: normalizedExperiences,
        count: normalizedExperiences.length
      });
    } else {
      // Return just IDs (backward compatibility)
      const user = await User.findById(req.user._id).select('bucketlist');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({ 
        bucketlist: (user.bucketlist || []).map(e => e.toString()),
        count: user.bucketlist.length || 0
      });
    }
  } catch (error) {
    console.error('Error fetching bucketlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add experience to bucketlist
router.post('/bucketlist', authenticate, requireUser, async (req, res) => {
  try {
    const { experienceId } = req.body;
    
    console.log('Add to bucketlist request:', { experienceId, userId: req.user._id });
    
    if (!experienceId) {
      return res.status(400).json({ message: 'Experience ID is required' });
    }
    
    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      console.error('Invalid experience ID format:', experienceId);
      return res.status(400).json({ message: 'Invalid experience ID format' });
    }
    
    // Verify experience exists
    const Experience = require('../models/Experience');
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      console.error('Experience not found:', experienceId);
      return res.status(404).json({ message: 'Experience not found' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Convert to ObjectId for consistency
    const experienceObjectId = new mongoose.Types.ObjectId(experienceId);
    const experienceIdStr = experienceId.toString();
    
    // Initialize bucketlist if it doesn't exist
    if (!user.bucketlist) {
      user.bucketlist = [];
    }
    
    const bucketlistIds = user.bucketlist.map(id => id.toString());
    
    if (!bucketlistIds.includes(experienceIdStr)) {
      // Use updateOne to update only the bucketlist field (avoids full document validation)
      await User.updateOne(
        { _id: req.user._id },
        { $push: { bucketlist: experienceObjectId } }
      );
      console.log('Experience added to bucketlist successfully');
    } else {
      console.log('Experience already in bucketlist');
    }

    // Return updated bucketlist without populating (faster, avoids populate errors)
    const updatedUser = await User.findById(req.user._id).select('bucketlist');
    res.json({ 
      message: 'Added to bucketlist', 
      bucketlist: (updatedUser.bucketlist || []).map(e => e.toString())
    });
  } catch (error) {
    console.error('Error adding to bucketlist:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Remove experience from bucketlist
router.delete('/bucketlist/:experienceId', authenticate, requireUser, async (req, res) => {
  try {
    const { experienceId } = req.params;
    
    if (!experienceId) {
      return res.status(400).json({ message: 'Experience ID is required' });
    }
    
    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(experienceId)) {
      return res.status(400).json({ message: 'Invalid experience ID format' });
    }
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const experienceIdStr = experienceId.toString();
    
    const beforeLength = user.bucketlist ? user.bucketlist.length : 0;
    const bucketlistIds = (user.bucketlist || []).map(id => id.toString());
    
    if (!bucketlistIds.includes(experienceIdStr)) {
      return res.status(404).json({ message: 'Experience not found in bucketlist' });
    }
    
    // Use updateOne to update only the bucketlist field (avoids full document validation)
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { bucketlist: new mongoose.Types.ObjectId(experienceId) } }
    );

    // Return updated bucketlist without populating (faster, avoids populate errors)
    const updatedUser = await User.findById(req.user._id).select('bucketlist');
    res.json({ 
      message: 'Removed from bucketlist', 
      bucketlist: updatedUser.bucketlist.map(e => e.toString())
    });
  } catch (error) {
    console.error('Error removing from bucketlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear bucketlist
router.delete('/bucketlist', authenticate, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.bucketlist = [];
    await user.save();

    res.json({ message: 'Bucketlist cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

