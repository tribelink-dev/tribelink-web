/**
 * Adobe (Local Host) Routes
 * API endpoints for local hosts offering adobe stays
 */

const express = require('express');
const LocalHost = require('../models/LocalHost');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const { authenticate, requireUser, requireHost } = require('../middleware/auth');
const upload = require('../middleware/uploadCloudinary');
const { getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// List all local hosts (adobes) with filters
router.get('/', async (req, res) => {
  try {
    const {
      country,
      state,
      district,
      minPrice,
      maxPrice,
      minRating,
      availableFrom,
      availableTo,
      capacity,
      languages,
      page = 1,
      limit = 20,
      sort = 'rating' // rating, price, newest
    } = req.query;

    // Build query
    const query = {};
    
    if (country) query['location.country'] = country;
    if (state) query['location.state'] = { $regex: new RegExp(state, 'i') };
    if (district) query['location.district'] = { $regex: new RegExp(district, 'i') };
    if (minPrice || maxPrice) {
      query['pricing.pricePerNight'] = {};
      if (minPrice) query['pricing.pricePerNight'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.pricePerNight'].$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (capacity) query['adobeDetails.capacity'] = { $gte: Number(capacity) };
    if (languages) {
      query.languages = { $in: Array.isArray(languages) ? languages : [languages] };
    }
    
    // Filter by availability dates
    if (availableFrom && availableTo) {
      const fromDate = new Date(availableFrom);
      const toDate = new Date(availableTo);
      
      // This is a simplified check - in production, you'd want more sophisticated availability checking
      query['availability.date'] = {
        $gte: fromDate,
        $lte: toDate
      };
      query['availability.available'] = true;
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price':
        sortOption = { 'pricing.pricePerNight': 1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'rating':
      default:
        sortOption = { rating: -1, ratingCount: -1 };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const localHosts = await LocalHost.find(query)
      .populate('providerId', 'name email phoneNumber profilePicture rating')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await LocalHost.countDocuments(query);

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedHosts = localHosts.map(host => {
      const hostObj = host.toObject();
      if (hostObj.images && hostObj.images.length > 0) {
        hostObj.images = hostObj.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        }));
      }
      return hostObj;
    });

    res.json({
      success: true,
      localHosts: normalizedHosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching local hosts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get adobe details by ID
router.get('/:id', async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id)
      .populate('providerId', 'name email phoneNumber profilePicture rating ratingCount');

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const hostObj = localHost.toObject();
    if (hostObj.images && hostObj.images.length > 0) {
      hostObj.images = hostObj.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
      }));
    }

    res.json({
      success: true,
      localHost: hostObj
    });
  } catch (error) {
    console.error('Error fetching local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register as local host (create LocalHost profile)
router.post('/register', authenticate, requireHost, upload.array('images', 10), async (req, res) => {
  try {
    const providerId = req.user._id; // Assuming req.user is the Provider

    // Check if provider is LOCAL_HOST type
    if (req.user.providerType !== 'LOCAL_HOST') {
      return res.status(400).json({ 
        message: 'Provider type must be LOCAL_HOST. Please update your provider type first.' 
      });
    }

    // Check if LocalHost profile already exists
    const existingHost = await LocalHost.findOne({ providerId });
    if (existingHost) {
      return res.status(400).json({ message: 'Local host profile already exists' });
    }

    const {
      adobeDetails,
      culturalPractices,
      nearbyPlaces,
      availability,
      pricing,
      languages,
      familyInfo,
      location
    } = req.body;

    // Handle image uploads
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: file.path || file.url,
          isMain: index === 0,
          caption: file.originalname
        });
      });
    }

    const localHost = new LocalHost({
      providerId,
      adobeDetails: {
        description: adobeDetails?.description || '',
        capacity: adobeDetails?.capacity || 2,
        bedrooms: adobeDetails?.bedrooms || 1,
        bathrooms: adobeDetails?.bathrooms || 1,
        amenities: adobeDetails?.amenities || [],
        houseRules: adobeDetails?.houseRules || [],
        propertyType: adobeDetails?.propertyType || 'Traditional Home'
      },
      culturalPractices: culturalPractices || [],
      nearbyPlaces: nearbyPlaces || [],
      availability: availability || [],
      pricing: {
        pricePerNight: pricing?.pricePerNight || 0,
        currency: pricing?.currency || 'USD',
        weeklyDiscount: pricing?.weeklyDiscount || 0,
        monthlyDiscount: pricing?.monthlyDiscount || 0
      },
      images,
      languages: languages || [],
      familyInfo: familyInfo || {},
      location: {
        country: location?.country || 'India',
        state: location?.state || '',
        district: location?.district || '',
        address: location?.address || '',
        coordinates: {
          lat: location?.coordinates?.lat || 0,
          lng: location?.coordinates?.lng || 0
        },
        nearbyLandmarks: location?.nearbyLandmarks || []
      }
    });

    await localHost.save();

    res.status(201).json({
      success: true,
      message: 'Local host profile created successfully',
      localHost
    });
  } catch (error) {
    console.error('Error creating local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update local host profile
router.put('/:id', authenticate, requireHost, upload.array('images', 10), async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      adobeDetails,
      culturalPractices,
      nearbyPlaces,
      availability,
      pricing,
      languages,
      familyInfo,
      location
    } = req.body;

    // Update fields
    if (adobeDetails) localHost.adobeDetails = { ...localHost.adobeDetails, ...adobeDetails };
    if (culturalPractices) localHost.culturalPractices = culturalPractices;
    if (nearbyPlaces) localHost.nearbyPlaces = nearbyPlaces;
    if (availability) localHost.availability = availability;
    if (pricing) localHost.pricing = { ...localHost.pricing, ...pricing };
    if (languages) localHost.languages = languages;
    if (familyInfo) localHost.familyInfo = { ...localHost.familyInfo, ...familyInfo };
    if (location) localHost.location = { ...localHost.location, ...location };

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, index) => ({
        url: file.path || file.url,
        isMain: localHost.images.length === 0 && index === 0,
        caption: file.originalname
      }));
      localHost.images.push(...newImages);
    }

    await localHost.save();

    res.json({
      success: true,
      message: 'Local host profile updated successfully',
      localHost
    });
  } catch (error) {
    console.error('Error updating local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings for a local host
router.get('/:id/bookings', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = {
      'adobeStay.localHost': req.params.id,
      bookingType: 'ADOBE_STAY'
    };
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(query)
      .populate('user', 'name email phoneNumber')
      .populate('trip')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

