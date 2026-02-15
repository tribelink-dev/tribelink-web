/**
 * Experiences Routes
 * API endpoints for fetching and managing experiences
 */

const express = require('express');
const Experience = require('../models/Experience');
const Host = require('../models/Host');
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
    
    // Filter out archived experiences from public listings
    query.isArchived = { $ne: true };
    
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
    // First get experiences without populate to get raw provider IDs
    const skip = (Number(page) - 1) * Number(limit);
    const experiencesRaw = await Experience.find(query)
      .select('provider')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .lean();
    
    // Get full experiences with populate
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
    
    // Create a map of raw provider IDs for fallback
    const rawProviderMap = new Map();
    experiencesRaw.forEach((rawExp, idx) => {
      if (rawExp.provider) {
        const providerId = typeof rawExp.provider === 'string' 
          ? rawExp.provider 
          : (rawExp.provider._id ? rawExp.provider._id.toString() : null);
        if (providerId) {
          rawProviderMap.set(experiences[idx]?._id?.toString(), providerId);
        }
      }
    });

    // Ensure provider information is properly formatted
    // Handle cases where provider might not be populated or doesn't exist
    const formattedExperiences = await Promise.all(normalizedExperiences.map(async (exp) => {
      let providerData = null;
      const expId = exp._id?.toString();
      
      // Get provider ID from multiple possible sources
      let providerId = exp.provider?._id 
        ? exp.provider._id.toString()
        : (typeof exp.provider === 'string' ? exp.provider : null);
      
      // If populate failed, try to get provider ID from raw data
      if (!providerId) {
        providerId = rawProviderMap.get(expId) || null;
      }
      
      // If we still don't have a provider ID, check the original experience document
      if (!providerId) {
        const originalExp = experiences.find(e => e._id?.toString() === expId);
        if (originalExp?.provider) {
          providerId = typeof originalExp.provider === 'string' 
            ? originalExp.provider 
            : (originalExp.provider._id ? originalExp.provider._id.toString() : null);
        }
      }
      
      // If provider is populated and has name, use it
      if (exp.provider && exp.provider.name && exp.provider.name.trim()) {
        providerData = {
          _id: exp.provider._id,
          name: exp.provider.name.trim(),
          rating: exp.provider.rating || 0,
          ratingCount: exp.provider.ratingCount || 0,
          profilePicture: exp.provider.profilePicture || null
        };
      } else if (providerId) {
        // Provider ID exists but populate failed or name is missing, fetch directly
        try {
          const provider = await Host.findById(providerId).select('name rating ratingCount profilePicture').lean();
          if (provider && provider.name && provider.name.trim()) {
            providerData = {
              _id: provider._id,
              name: provider.name.trim(),
              rating: provider.rating || 0,
              ratingCount: provider.ratingCount || 0,
              profilePicture: provider.profilePicture || null
            };
          }
        } catch (err) {
          // Silently handle errors - will default to Unknown Host
        }
      }
      
      // Default to Unknown Host if no valid provider found
      return {
        ...exp,
        provider: providerData || {
          name: 'Unknown Host',
          rating: 0,
          ratingCount: 0,
          profilePicture: null
        }
      };
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

    // Format provider information - handle missing or invalid provider
    let providerData = null;
    
    if (normalizedExperience.provider) {
      if (normalizedExperience.provider.name && normalizedExperience.provider.name.trim()) {
        // Provider is properly populated
        providerData = {
          _id: normalizedExperience.provider._id,
          name: normalizedExperience.provider.name.trim(),
          rating: normalizedExperience.provider.rating || 0,
          ratingCount: normalizedExperience.provider.ratingCount || 0,
          profilePicture: normalizedExperience.provider.profilePicture || null,
          email: normalizedExperience.provider.email || null,
          phoneNumber: normalizedExperience.provider.phoneNumber || null
        };
      } else if (normalizedExperience.provider._id) {
        // Provider exists but name is missing, try to fetch it
        try {
          const provider = await Host.findById(normalizedExperience.provider._id)
            .select('name rating ratingCount profilePicture email phoneNumber')
            .lean();
          if (provider && provider.name && provider.name.trim()) {
            providerData = {
              _id: provider._id,
              name: provider.name.trim(),
              rating: provider.rating || 0,
              ratingCount: provider.ratingCount || 0,
              profilePicture: provider.profilePicture || null,
              email: provider.email || null,
              phoneNumber: provider.phoneNumber || null
            };
          }
        } catch (err) {
          console.error(`Error fetching provider ${normalizedExperience.provider._id}:`, err);
        }
      }
    } else if (experience.provider && typeof experience.provider === 'string') {
      // Provider is just an ID string, fetch it
      try {
        const provider = await Host.findById(experience.provider)
          .select('name rating ratingCount profilePicture email phoneNumber')
          .lean();
        if (provider && provider.name && provider.name.trim()) {
          providerData = {
            _id: provider._id,
            name: provider.name.trim(),
            rating: provider.rating || 0,
            ratingCount: provider.ratingCount || 0,
            profilePicture: provider.profilePicture || null,
            email: provider.email || null,
            phoneNumber: provider.phoneNumber || null
          };
        }
      } catch (err) {
        console.error(`Error fetching provider ${experience.provider}:`, err);
      }
    }
    
    const formattedExperience = {
      ...normalizedExperience,
      provider: providerData || {
        name: 'Unknown Host',
        rating: 0,
        ratingCount: 0,
        profilePicture: null,
        email: null,
        phoneNumber: null
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

