/**
 * Experiences Routes
 * API endpoints for fetching and managing experiences
 */

const express = require('express');
const Experience = require('../models/Experience');
const { getBaseUrlFromRequest, normalizeExperiences } = require('../utils/imageUtils');

const router = express.Router();

// Get all experiences with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      sort = 'rating', // rating, newest, price
      category,
      state,
      district,
      page = 1
    } = req.query;

    // Build query
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (state) {
      query['location.state'] = { $regex: new RegExp(state, 'i') };
    }
    
    if (district) {
      query['location.district'] = { $regex: new RegExp(district, 'i') };
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'price':
        sortOption = { price: 1 };
        break;
      case 'rating':
      default:
        sortOption = { averageRating: -1, reviewCount: -1, createdAt: -1 };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const experiences = await Experience.find(query)
      .populate({
        path: 'provider',
        select: 'name rating ratingCount profilePicture',
        model: 'Host'
      })
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Experience.countDocuments(query);

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperiences = normalizeExperiences(experiences, baseUrl);

    // Ensure provider information is properly formatted
    const formattedExperiences = normalizedExperiences.map(exp => ({
      ...exp,
      provider: exp.provider ? {
        _id: exp.provider._id,
        name: exp.provider.name || 'Unknown Host',
        rating: exp.provider.rating || 0,
        ratingCount: exp.provider.ratingCount || 0,
        profilePicture: exp.provider.profilePicture || null
      } : {
        name: 'Unknown Host',
        rating: 0,
        ratingCount: 0,
        profilePicture: null
      }
    }));

    res.json({
      success: true,
      experiences: formattedExperiences,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get experience by ID
router.get('/:id', async (req, res) => {
  try {
    const experience = await Experience.findById(req.params.id)
      .populate({
        path: 'provider',
        select: 'name rating ratingCount profilePicture email phoneNumber',
        model: 'Host'
      })
      .lean();

    if (!experience) {
      return res.status(404).json({ 
        success: false,
        message: 'Experience not found' 
      });
    }

    // Normalize image URL
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperience = normalizeExperiences([experience], baseUrl)[0];

    // Format provider information
    const formattedExperience = {
      ...normalizedExperience,
      provider: normalizedExperience.provider ? {
        _id: normalizedExperience.provider._id,
        name: normalizedExperience.provider.name || 'Unknown Host',
        rating: normalizedExperience.provider.rating || 0,
        ratingCount: normalizedExperience.provider.ratingCount || 0,
        profilePicture: normalizedExperience.provider.profilePicture || null,
        email: normalizedExperience.provider.email || null,
        phoneNumber: normalizedExperience.provider.phoneNumber || null
      } : {
        name: 'Unknown Host',
        rating: 0,
        ratingCount: 0,
        profilePicture: null
      }
    };

    res.json({
      success: true,
      experience: formattedExperience
    });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;

