/**
 * Abode (Local Host) Routes
 * API endpoints for local hosts offering abode stays
 */

const express = require('express');
const LocalHost = require('../models/LocalHost');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const { authenticate, requireUser, requireHost } = require('../middleware/auth');
const upload = require('../middleware/uploadCloudinary');
const { getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// List all local hosts (abodes) with filters
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
    
    // Filter out archived abodes from public listings
    query.isArchived = { $ne: true };
    
    if (country) query['location.country'] = country;
    if (state) query['location.state'] = { $regex: new RegExp(state, 'i') };
    if (district) query['location.district'] = { $regex: new RegExp(district, 'i') };
    if (minPrice || maxPrice) {
      query['pricing.pricePerNight'] = {};
      if (minPrice) query['pricing.pricePerNight'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.pricePerNight'].$lte = Number(maxPrice);
    }
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (capacity) query['abodeDetails.capacity'] = { $gte: Number(capacity) };
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

// Get abode details by ID
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

    // Parse JSON strings from FormData (multipart/form-data sends JSON as strings)
    let abodeDetails, culturalPractices, nearbyPlaces, availability, pricing, languages, familyInfo, location;
    
    try {
      abodeDetails = typeof req.body.abodeDetails === 'string' 
        ? JSON.parse(req.body.abodeDetails) 
        : req.body.abodeDetails;
      
      culturalPractices = typeof req.body.culturalPractices === 'string'
        ? JSON.parse(req.body.culturalPractices)
        : req.body.culturalPractices;
      
      nearbyPlaces = typeof req.body.nearbyPlaces === 'string'
        ? JSON.parse(req.body.nearbyPlaces)
        : req.body.nearbyPlaces;
      
      availability = typeof req.body.availability === 'string'
        ? JSON.parse(req.body.availability)
        : req.body.availability;
      
      pricing = typeof req.body.pricing === 'string'
        ? JSON.parse(req.body.pricing)
        : req.body.pricing;
      
      languages = typeof req.body.languages === 'string'
        ? JSON.parse(req.body.languages)
        : req.body.languages;
      
      familyInfo = typeof req.body.familyInfo === 'string'
        ? JSON.parse(req.body.familyInfo)
        : req.body.familyInfo;
      
      location = typeof req.body.location === 'string'
        ? JSON.parse(req.body.location)
        : req.body.location;
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON data in form fields',
        error: parseError.message 
      });
    }

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

    // Validate required fields
    if (!abodeDetails?.title || !abodeDetails.title.trim()) {
      return res.status(400).json({ message: 'Abode title is required' });
    }
    if (!abodeDetails?.description || !abodeDetails.description.trim()) {
      return res.status(400).json({ message: 'Abode description is required' });
    }
    if (!location?.state || !location.state.trim()) {
      return res.status(400).json({ message: 'State is required' });
    }
    if (!location?.district || !location.district.trim()) {
      return res.status(400).json({ message: 'District is required' });
    }

    const localHost = new LocalHost({
      providerId,
      abodeDetails: {
        title: abodeDetails.title.trim(),
        description: abodeDetails.description || '',
        capacity: Number(abodeDetails.capacity) || 2,
        bedrooms: Number(abodeDetails.bedrooms) || 1,
        bathrooms: Number(abodeDetails.bathrooms) || 1,
        amenities: Array.isArray(abodeDetails.amenities) ? abodeDetails.amenities : [],
        houseRules: Array.isArray(abodeDetails.houseRules) ? abodeDetails.houseRules : [],
        propertyType: abodeDetails.propertyType || 'Traditional Home'
      },
      culturalPractices: Array.isArray(culturalPractices) ? culturalPractices : [],
      nearbyPlaces: Array.isArray(nearbyPlaces) ? nearbyPlaces : [],
      availability: Array.isArray(availability) ? availability : [],
      pricing: {
        pricePerNight: Number(pricing?.pricePerNight) || 0,
        currency: pricing?.currency || 'INR',
        weeklyDiscount: Number(pricing?.weeklyDiscount) || 0,
        monthlyDiscount: Number(pricing?.monthlyDiscount) || 0
      },
      images,
      languages: Array.isArray(languages) ? languages : [],
      familyInfo: familyInfo || {},
      location: {
        country: location?.country || 'India',
        state: location.state || '',
        district: location.district || '',
        address: location?.address || '',
        coordinates: {
          lat: Number(location?.coordinates?.lat) || 0,
          lng: Number(location?.coordinates?.lng) || 0
        },
        nearbyLandmarks: Array.isArray(location?.nearbyLandmarks) ? location.nearbyLandmarks : []
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

    // Parse JSON strings from FormData (multipart/form-data sends JSON as strings)
    let abodeDetails, culturalPractices, nearbyPlaces, availability, pricing, languages, familyInfo, location;
    
    try {
      if (req.body.abodeDetails) {
        abodeDetails = typeof req.body.abodeDetails === 'string' 
          ? JSON.parse(req.body.abodeDetails) 
          : req.body.abodeDetails;
      }
      
      if (req.body.culturalPractices) {
        culturalPractices = typeof req.body.culturalPractices === 'string'
          ? JSON.parse(req.body.culturalPractices)
          : req.body.culturalPractices;
      }
      
      if (req.body.nearbyPlaces) {
        nearbyPlaces = typeof req.body.nearbyPlaces === 'string'
          ? JSON.parse(req.body.nearbyPlaces)
          : req.body.nearbyPlaces;
      }
      
      if (req.body.availability) {
        availability = typeof req.body.availability === 'string'
          ? JSON.parse(req.body.availability)
          : req.body.availability;
      }
      
      if (req.body.pricing) {
        pricing = typeof req.body.pricing === 'string'
          ? JSON.parse(req.body.pricing)
          : req.body.pricing;
      }
      
      if (req.body.languages) {
        languages = typeof req.body.languages === 'string'
          ? JSON.parse(req.body.languages)
          : req.body.languages;
      }
      
      if (req.body.familyInfo) {
        familyInfo = typeof req.body.familyInfo === 'string'
          ? JSON.parse(req.body.familyInfo)
          : req.body.familyInfo;
      }
      
      if (req.body.location) {
        location = typeof req.body.location === 'string'
          ? JSON.parse(req.body.location)
          : req.body.location;
      }
    } catch (parseError) {
      console.error('Error parsing JSON fields:', parseError);
      return res.status(400).json({ 
        message: 'Invalid JSON data in form fields',
        error: parseError.message 
      });
    }

    // Update fields
    if (abodeDetails) localHost.abodeDetails = { ...localHost.abodeDetails, ...abodeDetails };
    if (culturalPractices) localHost.culturalPractices = Array.isArray(culturalPractices) ? culturalPractices : localHost.culturalPractices;
    if (nearbyPlaces) localHost.nearbyPlaces = Array.isArray(nearbyPlaces) ? nearbyPlaces : localHost.nearbyPlaces;
    if (availability) localHost.availability = Array.isArray(availability) ? availability : localHost.availability;
    if (pricing) localHost.pricing = { ...localHost.pricing, ...pricing };
    if (languages) localHost.languages = Array.isArray(languages) ? languages : localHost.languages;
    if (familyInfo) localHost.familyInfo = { ...localHost.familyInfo, ...familyInfo };
    if (location) localHost.location = { ...localHost.location, ...location };

    // Handle images: keep existing ones that weren't removed, and add new ones
    let existingImagesToKeep = [];
    if (req.body.existingImages) {
      try {
        const existingImagesData = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
        
        // Map to preserve existing image structure with IDs
        // Find matching images from the database to preserve their MongoDB structure
        const existingImageIds = existingImagesData.map(img => img._id?.toString()).filter(Boolean);
        existingImagesToKeep = localHost.images.filter(img => 
          existingImageIds.includes(img._id.toString())
        );
        
        // Preserve order from the request
        const orderedImages = [];
        existingImagesData.forEach(requestedImg => {
          const found = existingImagesToKeep.find(img => img._id.toString() === requestedImg._id?.toString());
          if (found) {
            // Update properties if changed
            if (requestedImg.isMain !== undefined) found.isMain = requestedImg.isMain;
            if (requestedImg.caption !== undefined) found.caption = requestedImg.caption;
            orderedImages.push(found);
          }
        });
        existingImagesToKeep = orderedImages;
      } catch (parseError) {
        console.error('Error parsing existingImages:', parseError);
        // If parsing fails, keep all existing images
        existingImagesToKeep = localHost.images;
      }
    } else {
      // If no existingImages sent, keep all current images
      existingImagesToKeep = localHost.images;
    }

    // Prepare new images from uploads
    const newImages = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        newImages.push({
        url: file.path || file.url,
          isMain: existingImagesToKeep.length === 0 && index === 0,
          caption: file.originalname || file.filename
        });
      });
    }

    // Combine: existing images (that weren't removed) + new images
    // Set first image as main if there are images
    const allImages = [...existingImagesToKeep, ...newImages];
    if (allImages.length > 0) {
      // Ensure only first image is main
      allImages.forEach((img, idx) => {
        img.isMain = idx === 0;
      });
    }

    localHost.images = allImages;

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

// Get abodes by owner (for abode host dashboard)
router.get('/owner/my-abodes', authenticate, requireHost, async (req, res) => {
  try {
    // Check if provider is LOCAL_HOST type
    if (req.user.providerType !== 'LOCAL_HOST') {
      return res.status(403).json({ 
        message: 'Access denied. Only LOCAL_HOST providers can access this endpoint.' 
      });
    }

    const abodes = await LocalHost.find({ providerId: req.user._id })
      .populate('providerId', 'name email phoneNumber profilePicture rating ratingCount')
      .sort({ createdAt: -1 });

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedAbodes = abodes.map(abode => {
      const abodeObj = abode.toObject();
      if (abodeObj.images && abodeObj.images.length > 0) {
        abodeObj.images = abodeObj.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        }));
      }
      return abodeObj;
    });

    res.json({
      success: true,
      abodes: normalizedAbodes
    });
  } catch (error) {
    console.error('Error fetching abodes by owner:', error);
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
      'abodeStay.localHost': req.params.id,
      bookingType: 'ABODE_STAY'
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

// Toggle archive status for an abode
router.patch('/:id/archive', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Toggle archive status
    localHost.isArchived = !localHost.isArchived;
    await localHost.save();

    res.json({
      success: true,
      message: localHost.isArchived ? 'Abode archived successfully' : 'Abode unarchived successfully',
      localHost
    });
  } catch (error) {
    console.error('Error toggling archive status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete local host profile
router.delete('/:id', authenticate, requireHost, async (req, res) => {
  try {
    const localHost = await LocalHost.findById(req.params.id);

    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Verify ownership
    if (localHost.providerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if there are any active bookings
    const activeBookings = await Booking.countDocuments({
      'abodeStay.localHost': req.params.id,
      bookingType: 'ABODE_STAY',
      status: { $in: ['PENDING', 'CONFIRMED'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete abode with active bookings. Please cancel or complete all bookings first.' 
      });
    }

    await LocalHost.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Local host profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting local host:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


