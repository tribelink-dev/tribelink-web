const express = require('express');
const Host = require('../models/Host');
const Experience = require('../models/Experience');
const { authenticate, requireHost, requireUser } = require('../middleware/auth');
const upload = require('../middleware/uploadCloudinary');
const { normalizeExperiences, normalizeExperience, getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// Get host availability
router.get('/availability', authenticate, requireHost, async (req, res) => {
  try {
    const host = await Host.findById(req.user._id);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    res.json({ availability: host.availability || [] });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update host availability
router.post('/availability', authenticate, requireHost, async (req, res) => {
  try {
    const { availability } = req.body; // Array of { date: Date, available: boolean, timeSlots?: Array }

    if (!availability || !Array.isArray(availability)) {
      return res.status(400).json({ message: 'Availability array is required' });
    }

    const host = await Host.findById(req.user._id);
    host.availability = availability.map(av => ({
      date: new Date(av.date),
      available: av.available !== false,
      timeSlots: av.timeSlots || []
    }));

    await host.save();

    res.json({ message: 'Availability updated', availability: host.availability });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get host profile
router.get('/me', authenticate, requireHost, async (req, res) => {
  try {
    const host = await Host.findById(req.user._id).select('-password');
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    res.json({
      success: true,
      host: host.toObject()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update host profile
router.patch('/me', authenticate, requireHost, upload.single('profilePicture'), async (req, res) => {
  try {
    const host = await Host.findById(req.user._id);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    const { name, email, phoneNumber, bio, notificationPreferences } = req.body;

    // Update name
    if (name !== undefined && name !== null) {
      const trimmedName = String(name).trim();
      if (trimmedName === '') {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      host.name = trimmedName;
    }

    // Update email with uniqueness check
    if (email !== undefined && email !== null) {
      const trimmedEmail = String(email).toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      
      // Check if email is already taken by another host
      const existingHost = await Host.findOne({ 
        email: trimmedEmail,
        _id: { $ne: req.user._id }
      });
      
      if (existingHost) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      
      host.email = trimmedEmail;
    }

    // Update phone number with format validation
    if (phoneNumber !== undefined && phoneNumber !== null) {
      const trimmedPhone = String(phoneNumber).trim();
      if (!/^\+?[1-9]\d{1,14}$/.test(trimmedPhone)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }
      
      // Check if phone is already taken by another host
      const existingHost = await Host.findOne({ 
        phoneNumber: trimmedPhone,
        _id: { $ne: req.user._id }
      });
      
      if (existingHost) {
        return res.status(400).json({ message: 'Phone number is already registered' });
      }
      
      host.phoneNumber = trimmedPhone;
    }

    // Update bio/description
    if (bio !== undefined) {
      host.bio = bio ? String(bio).trim() : null;
    }

    // Update notification preferences
    if (notificationPreferences !== undefined) {
      try {
        const prefs = typeof notificationPreferences === 'string' 
          ? JSON.parse(notificationPreferences) 
          : notificationPreferences;
        host.notificationPreferences = prefs || {};
      } catch (parseError) {
        return res.status(400).json({ message: 'Invalid notification preferences format' });
      }
    }

    // Update profile picture if uploaded
    if (req.file) {
      host.profilePicture = req.file.path || req.file.url;
    }

    await host.save();

    // Return updated host without password
    const updatedHost = await Host.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      host: updatedHost.toObject()
    });
  } catch (error) {
    console.error('Error updating host profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get host's experiences
router.get('/experiences', authenticate, requireHost, async (req, res) => {
  try {
    console.log('[GET /hosts/experiences] User ID:', req.user._id);
    
    const host = await Host.findById(req.user._id).populate('experiences');
    
    if (!host) {
      console.error('[GET /hosts/experiences] Host not found for user:', req.user._id);
      return res.status(404).json({ message: 'Host not found' });
    }
    
    console.log('[GET /hosts/experiences] Host found, experiences count:', host.experiences?.length || 0);
    
    // Normalize image URLs before sending response
    let baseUrl;
    try {
      baseUrl = getBaseUrlFromRequest(req);
      console.log('[GET /hosts/experiences] Base URL:', baseUrl);
    } catch (urlError) {
      console.error('[GET /hosts/experiences] Error getting base URL:', urlError);
      baseUrl = null; // Continue without normalization if URL detection fails
    }
    
    const experiences = host.experiences || [];
    console.log('[GET /hosts/experiences] Raw experiences count:', experiences.length);
    
    // Convert Mongoose documents to plain objects
    const experiencesArray = experiences.map(exp => {
      try {
        return exp.toObject ? exp.toObject() : exp;
      } catch (convertError) {
        console.error('[GET /hosts/experiences] Error converting experience to object:', convertError);
        // Return as-is if conversion fails
        return typeof exp === 'object' ? exp : {};
      }
    });
    
    console.log('[GET /hosts/experiences] Converted experiences count:', experiencesArray.length);
    
    // Normalize experiences
    let normalizedExperiences;
    try {
      normalizedExperiences = normalizeExperiences(experiencesArray, baseUrl);
      console.log('[GET /hosts/experiences] Normalized experiences count:', normalizedExperiences.length);
    } catch (normalizeError) {
      console.error('[GET /hosts/experiences] Error normalizing experiences:', normalizeError);
      // Return experiences without normalization if it fails
      normalizedExperiences = experiencesArray;
    }
    
    res.json({
      experiences: normalizedExperiences
    });
  } catch (error) {
    console.error('[GET /hosts/experiences] Unexpected error:', error);
    console.error('[GET /hosts/experiences] Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Create experience with image upload
router.post('/experience', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
      availableDates,
      price,
      currency,
      contentUrl,
      duration,
      maxParticipants
    } = req.body;

    if (!title || !description || !location || !availableDates || !price) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Map category ID to category name for enum validation
    const categoryMap = {
      'living-with-the-land': 'Living with the Land',
      'stories-of-the-past': 'Stories of the Past',
      'the-soul': 'The Soul',
      'the-unseen': 'The Unseen',
      'creative-pulse': 'Creative Pulse',
      'water-flow': 'Water & Flow',
      'gastronomy': 'Gastronomy & Ancestral Flavors',
      'regional-exclusives': 'Regional Exclusives'
    };

    // Map category ID to category name for enum validation (only if provided)
    const categoryName = (category && category.trim()) ? (categoryMap[category] || category) : null;

    // Parse location if it's a string
    const locationData = typeof location === 'string' ? JSON.parse(location) : location;

    // Normalize location fields (trim and ensure consistency)
    const normalizedLocation = {
      country: (locationData.country || '').trim(),
      state: (locationData.state || '').trim(),
      district: (locationData.district || '').trim(),
      coordinates: locationData.coordinates || {}
    };

    // Build experience object with optional category/subcategory
    const experienceData = {
      title: title.trim(),
      description: description.trim(),
      provider: req.user._id,
      location: normalizedLocation,
      availableDates: typeof availableDates === 'string' 
        ? JSON.parse(availableDates).map(d => {
            if (typeof d === 'string') {
              return { date: new Date(d), available: true };
            }
            return {
              date: new Date(d.date || d),
              startTime: d.startTime || null,
              endTime: d.endTime || null,
              available: d.available !== false
            };
          })
        : availableDates.map(d => {
            if (typeof d === 'string') {
              return { date: new Date(d), available: true };
            }
            return {
              date: new Date(d.date || d),
              startTime: d.startTime || null,
              endTime: d.endTime || null,
              available: d.available !== false
            };
          }),
      price: parseFloat(price) || 0,
      currency: currency || 'USD',
      contentUrl: contentUrl || null,
      // Cloudinary returns full URL in req.file.path, local storage uses filename
      imageUrl: req.file ? (req.file.path || `/uploads/${req.file.filename}`) : null,
      duration: parseInt(duration) || 2,
      maxParticipants: parseInt(maxParticipants) || 10
    };

    // Only add category/subcategory if provided
    if (categoryName) {
      experienceData.category = categoryName;
    }
    if (subcategory && subcategory.trim()) {
      experienceData.subcategory = subcategory.trim();
    }

    const experience = new Experience(experienceData);

    await experience.save();

    // Add to host's experiences
    const host = await Host.findById(req.user._id);
    host.experiences.push(experience._id);
    await host.save();

    // Normalize image URL before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperience = normalizeExperience(experience.toObject ? experience.toObject() : experience, baseUrl);

    res.status(201).json({
      message: 'Experience created',
      experience: normalizedExperience
    });
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get available hosts/guides for dates
router.get('/available', async (req, res) => {
  try {
    const { fromDate, toDate, role } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Date range required' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    const query = {
      role: role || 'Guide',
      availability: {
        $elemMatch: {
          date: { $gte: from, $lte: to },
          available: true
        }
      }
    };

    const hosts = await Host.find(query)
      .select('-password')
      .sort({ rating: -1 })
      .limit(20);

    res.json({ hosts });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available guides filtered by location, availability, and sorted by rating
router.get('/guides/available', async (req, res) => {
  try {
    const { fromDate, toDate, state, district, country = 'India' } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Date range (fromDate, toDate) is required' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Build query for guides
    const query = {
      providerType: 'GUIDE',
      availability: {
        $elemMatch: {
          date: { $gte: from, $lte: to },
          available: true
        }
      }
    };

    // If location filters are provided, we'll filter guides based on their service areas
    // Note: This assumes guides can serve multiple locations. If guides have location fields,
    // we would filter by those. For now, we'll return all available guides and let frontend
    // handle location-based filtering if needed, or we can add location fields to guides later.

    const guides = await Host.find(query)
      .select('-password -googleId')
      .sort({ rating: -1 }) // Sort by rating (highest first)
      .limit(50)
      .lean();

    // Calculate hourly rate for each guide and format response
    const guidesWithRates = guides.map(guide => {
      // Calculate hourly rate based on rating
      const rating = guide.rating || 0;
      let hourlyRate = 10; // Default
      if (rating >= 5.0) hourlyRate = 20;
      else if (rating >= 4.0) hourlyRate = 15;
      else if (rating >= 3.0) hourlyRate = 12;

      // Use custom hourlyRate if set
      if (guide.hourlyRate && guide.hourlyRate > 0) {
        hourlyRate = guide.hourlyRate;
      }

      return {
        _id: guide._id,
        name: guide.name,
        email: guide.email,
        phoneNumber: guide.phoneNumber,
        rating: guide.rating || 0,
        ratingCount: guide.ratingCount || 0,
        profilePicture: guide.profilePicture,
        hourlyRate: hourlyRate,
        availability: guide.availability || []
      };
    });

    res.json({
      guides: guidesWithRates,
      count: guidesWithRates.length
    });
  } catch (error) {
    console.error('Error fetching available guides:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single experience by ID
router.get('/experience/:experienceId', authenticate, requireHost, async (req, res) => {
  try {
    const { experienceId } = req.params;
    
    console.log('Fetching experience:', {
      experienceId,
      userId: req.user._id
    });

    // Validate experienceId format
    if (!experienceId || experienceId.trim() === '') {
      return res.status(400).json({ message: 'Experience ID is required' });
    }

    const experience = await Experience.findOne({
      _id: experienceId,
      provider: req.user._id
    }).lean(); // Use lean() for better performance

    if (!experience) {
      console.log('Experience not found:', {
        experienceId,
        userId: req.user._id
      });
      
      // Check if experience exists but belongs to different provider
      const exists = await Experience.findById(experienceId).lean();
      if (exists) {
        return res.status(403).json({ 
          message: 'Experience not found or you do not have permission to access it' 
        });
      }
      
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Format availableDates for frontend (convert date objects to ISO strings)
    // availableDates are stored as objects: { date: Date, startTime: String, endTime: String, available: Boolean }
    const formattedExperience = {
      ...experience,
      availableDates: experience.availableDates ? experience.availableDates.map((d) => {
        if (!d) return null;
        
        // Handle object format with date property
        if (d.date) {
          const dateValue = d.date instanceof Date 
            ? d.date.toISOString().split('T')[0]
            : (typeof d.date === 'string' ? d.date.split('T')[0] : d.date);
          return dateValue;
        }
        
        // Handle if it's already a string
        if (typeof d === 'string') {
          return d.split('T')[0];
        }
        
        // Handle if it's a Date object directly
        if (d instanceof Date) {
          return d.toISOString().split('T')[0];
        }
        
        return null;
      }).filter((d) => d !== null) : []
    };

    console.log('Experience found:', {
      id: formattedExperience._id,
      title: formattedExperience.title,
      location: formattedExperience.location
    });

    // Normalize image URL before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperience = normalizeExperience(formattedExperience, baseUrl);

    res.json({ experience: normalizedExperience });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Toggle archive status for an experience
router.patch('/experience/:experienceId/archive', authenticate, requireHost, async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.experienceId,
      provider: req.user._id
    });

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Toggle archive status
    experience.isArchived = !experience.isArchived;
    await experience.save();

    res.json({
      success: true,
      message: experience.isArchived ? 'Experience archived successfully' : 'Experience unarchived successfully',
      experience
    });
  } catch (error) {
    console.error('Error toggling archive status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete experience
router.delete('/experience/:experienceId', authenticate, requireHost, async (req, res) => {
  try {
    const experience = await Experience.findOne({
      _id: req.params.experienceId,
      provider: req.user._id
    });

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Remove experience from host's experiences array
    const host = await Host.findById(req.user._id);
    if (host) {
      host.experiences = host.experiences.filter(
        expId => expId.toString() !== experience._id.toString()
      );
      await host.save();
    }

    // Delete the experience
    await Experience.findByIdAndDelete(experience._id);

    res.json({
      message: 'Experience deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Update experience with image upload
router.put('/experience/:experienceId', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    console.log('=== Update Experience Request ===');
    console.log('Experience ID:', req.params.experienceId);
    console.log('User ID:', req.user._id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Has file:', !!req.file);
    
    const experience = await Experience.findOne({
      _id: req.params.experienceId,
      provider: req.user._id
    });

    if (!experience) {
      console.log('Experience not found or not owned by user');
      return res.status(404).json({ message: 'Experience not found' });
    }

    console.log('Current experience:', {
      title: experience.title,
      price: experience.price,
      location: experience.location,
      availableDatesCount: experience.availableDates?.length
    });

    const {
      title,
      description,
      category,
      subcategory,
      location,
      availableDates,
      price,
      currency,
      contentUrl,
      duration,
      maxParticipants
    } = req.body;
    
    console.log('Parsed fields:', {
      title: title,
      hasDescription: !!description,
      hasLocation: !!location,
      hasAvailableDates: !!availableDates,
      price: price,
      currency: currency,
      duration: duration,
      maxParticipants: maxParticipants
    });

    // Update fields - ensure required fields are never empty
    if (title !== undefined && title !== null && title !== '') {
      const trimmedTitle = String(title).trim();
      if (trimmedTitle === '') {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      experience.title = trimmedTitle;
    }
    if (description !== undefined && description !== null && description !== '') {
      const trimmedDescription = String(description).trim();
      if (trimmedDescription === '') {
        return res.status(400).json({ message: 'Description cannot be empty' });
      }
      experience.description = trimmedDescription;
    }
    if (category !== undefined && category !== null && category !== '') {
      // Map category ID to category name for enum validation
      const categoryMap = {
        'living-with-the-land': 'Living with the Land',
        'stories-of-the-past': 'Stories of the Past',
        'the-soul': 'The Soul',
        'the-unseen': 'The Unseen',
        'creative-pulse': 'Creative Pulse',
        'water-flow': 'Water & Flow',
        'gastronomy': 'Gastronomy & Ancestral Flavors',
        'regional-exclusives': 'Regional Exclusives'
      };
      const categoryName = categoryMap[category] || category;
      experience.category = categoryName;
    }
    if (subcategory !== undefined && subcategory !== null && subcategory !== '') {
      experience.subcategory = String(subcategory).trim();
    }
    if (location) {
      try {
        const locationData = typeof location === 'string' ? JSON.parse(location) : location;
        
        // Ensure required location fields are present
        const newCountry = (locationData.country || experience.location?.country || '').trim();
        const newState = (locationData.state || experience.location?.state || '').trim();
        const newDistrict = (locationData.district || experience.location?.district || '').trim();
        
        if (!newCountry || !newState || !newDistrict) {
          return res.status(400).json({ 
            message: 'Location must include country, state, and district',
            received: { country: newCountry, state: newState, district: newDistrict }
          });
        }
        
        // Handle coordinates - ensure it's an object, not undefined
        let coordinates = {};
        if (locationData.coordinates && typeof locationData.coordinates === 'object') {
          // Use provided coordinates if valid
          coordinates = {
            lat: locationData.coordinates.lat || null,
            lng: locationData.coordinates.lng || null
          };
        } else if (experience.location?.coordinates && typeof experience.location.coordinates === 'object') {
          // Preserve existing coordinates if new ones not provided
          coordinates = {
            lat: experience.location.coordinates.lat || null,
            lng: experience.location.coordinates.lng || null
          };
        }
        // If neither exists, coordinates remains empty object {}
        
        experience.location = {
          country: newCountry,
          state: newState,
          district: newDistrict,
          coordinates: coordinates
        };
        
        console.log('Updated location:', experience.location);
      } catch (parseError) {
        console.error('Error parsing location:', parseError);
        console.error('Location data received:', location);
        return res.status(400).json({ 
          message: 'Invalid location data format',
          error: parseError.message 
        });
      }
    }
    if (availableDates) {
      try {
        const datesArray = typeof availableDates === 'string' ? JSON.parse(availableDates) : availableDates;
        if (!Array.isArray(datesArray)) {
          return res.status(400).json({ message: 'availableDates must be an array' });
        }
        experience.availableDates = datesArray.map(d => {
          let dateObj;
          if (typeof d === 'string') {
            dateObj = new Date(d);
          } else if (d && typeof d === 'object') {
            dateObj = new Date(d.date || d);
          } else {
            dateObj = new Date(d);
          }
          
          // Validate date
          if (isNaN(dateObj.getTime())) {
            throw new Error(`Invalid date: ${d}`);
          }
          
          if (typeof d === 'string') {
            return { date: dateObj, available: true };
          }
          if (d && typeof d === 'object') {
            return {
              date: dateObj,
              startTime: d.startTime || null,
              endTime: d.endTime || null,
              available: d.available !== false
            };
          }
          return { date: dateObj, available: true };
        });
        // Mark as modified to ensure array is saved
        experience.markModified('availableDates');
      } catch (parseError) {
        console.error('Error parsing availableDates:', parseError);
        return res.status(400).json({ message: 'Invalid availableDates format', error: parseError.message });
      }
    }
    if (price !== undefined && price !== null && price !== '') {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({ message: 'Price must be a valid positive number' });
      }
      experience.price = priceNum;
    }
    if (currency !== undefined && currency !== null && currency !== '') {
      experience.currency = String(currency).toUpperCase();
    }
    if (contentUrl !== undefined) {
      experience.contentUrl = contentUrl && contentUrl.trim() !== '' ? contentUrl.trim() : null;
    }
    if (duration !== undefined && duration !== null && duration !== '') {
      const durationNum = parseInt(duration);
      if (isNaN(durationNum) || durationNum < 1) {
        return res.status(400).json({ message: 'Duration must be a valid positive number' });
      }
      experience.duration = durationNum;
    }
    if (maxParticipants !== undefined && maxParticipants !== null && maxParticipants !== '') {
      const maxParticipantsNum = parseInt(maxParticipants);
      if (isNaN(maxParticipantsNum) || maxParticipantsNum < 1) {
        return res.status(400).json({ message: 'Max participants must be a valid positive number' });
      }
      experience.maxParticipants = maxParticipantsNum;
    }
    
    // Update image if new one is uploaded
    // Cloudinary returns full URL in req.file.path, local storage uses filename
    if (req.file) {
      experience.imageUrl = req.file.path || `/uploads/${req.file.filename}`;
    }

    // Validate required fields before saving
    if (!experience.title || experience.title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!experience.description || experience.description.trim() === '') {
      return res.status(400).json({ message: 'Description is required' });
    }
    if (!experience.category) {
      return res.status(400).json({ message: 'Category is required' });
    }
    if (!experience.subcategory) {
      return res.status(400).json({ message: 'Subcategory is required' });
    }
    if (!experience.location || !experience.location.country || !experience.location.state || !experience.location.district) {
      return res.status(400).json({ message: 'Location (country, state, district) is required' });
    }
    if (!experience.price || experience.price < 0) {
      return res.status(400).json({ message: 'Price is required and must be >= 0' });
    }
    if (!experience.availableDates || experience.availableDates.length === 0) {
      return res.status(400).json({ message: 'At least one available date is required' });
    }

    // Ensure coordinates is always an object (not undefined) to prevent Mongoose casting errors
    if (!experience.location.coordinates || typeof experience.location.coordinates !== 'object') {
      experience.location.coordinates = {};
    } else {
      // Ensure it has the correct structure
      experience.location.coordinates = {
        lat: experience.location.coordinates.lat || null,
        lng: experience.location.coordinates.lng || null
      };
    }

    // Mark location as modified to ensure nested object is saved
    experience.markModified('location');
    
    // Mark availableDates as modified if it was updated
    if (availableDates) {
      experience.markModified('availableDates');
    }
    
    // Save with validation
    try {
      console.log('Attempting to save experience:', {
        title: experience.title,
        price: experience.price,
        location: experience.location,
        availableDatesCount: experience.availableDates?.length,
        duration: experience.duration,
        maxParticipants: experience.maxParticipants
      });
      
      await experience.save();
      console.log('Experience saved successfully');
    } catch (saveError) {
      console.error('Mongoose save error:', saveError);
      console.error('Error name:', saveError.name);
      console.error('Error message:', saveError.message);
      
      // Handle mongoose validation errors
      if (saveError.name === 'ValidationError') {
        const errors = Object.values(saveError.errors).map((err) => ({
          field: err.path,
          message: err.message,
          value: err.value
        }));
        console.error('Validation errors:', errors);
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: errors.map(e => e.message),
          details: errors
        });
      }
      
      // Handle other mongoose errors
      if (saveError.name === 'CastError') {
        return res.status(400).json({ 
          message: 'Invalid data format', 
          error: saveError.message 
        });
      }
      
      throw saveError; // Re-throw if not a handled error
    }

    // Verify the save by reloading
    const updatedExperience = await Experience.findById(experience._id).lean();
    
    console.log('Experience updated:', {
      id: experience._id.toString(),
      title: experience.title,
      location: {
        district: updatedExperience.location.district,
        state: updatedExperience.location.state,
        country: updatedExperience.location.country
      },
      savedLocation: updatedExperience.location
    });

    // Normalize image URL before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedExperience = normalizeExperience(updatedExperience, baseUrl);

    res.json({
      message: 'Experience updated',
      experience: normalizedExperience
    });
  } catch (error) {
    console.error('Error updating experience:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    console.error('Request params:', req.params);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get assigned trips for a guide
// Get trips for the authenticated guide (using their own ID)
router.get('/guides/trips/me', authenticate, requireHost, async (req, res) => {
  try {
    const guideId = req.user._id.toString();
    const Trip = require('../models/Trip');

    // Verify guide exists and is a GUIDE type
    const host = await Host.findById(guideId);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    // Get trips where this guide is assigned in the schedule
    const trips = await Trip.find({
      'schedule.guide': guideId,
      paymentStatus: { $in: ['Pending', 'Completed'] } // Only active trips
    })
    .populate('user', 'name email phoneNumber')
    .populate('schedule.hotel', 'name address')
    .populate('schedule.guide', 'name')
    .sort({ fromDate: 1 }); // Sort by start date

    res.json({
      trips: trips.map(trip => ({
        _id: trip._id,
        user: trip.user,
        fromDate: trip.fromDate,
        toDate: trip.toDate,
        country: trip.country,
        state: trip.state,
        district: trip.district,
        locations: trip.locations,
        schedule: trip.schedule,
        totalPrice: trip.totalPrice,
        paymentStatus: trip.paymentStatus
      }))
    });
  } catch (error) {
    console.error('Error fetching guide trips:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all available experiences for guides to select
router.get('/guides/experiences/available', authenticate, requireHost, async (req, res) => {
  try {
    const Experience = require('../models/Experience');
    const { state, district, category, search } = req.query;
    
    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    // Build query - only show HOST_EXPERIENCE, exclude GUIDE_TOUR
    // Handle both new experiences with experienceSource and old ones without (backward compatibility)
    const baseQuery = {
      $or: [
        { experienceSource: 'HOST_EXPERIENCE' },
        { experienceSource: { $exists: false } } // Old experiences without the field
      ]
    };
    
    const query = { ...baseQuery };
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;
    if (category) query.category = category;
    
    if (search) {
      // Combine search with experienceSource filter using $and
      query.$and = [
        baseQuery,
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        }
      ];
      // Remove the top-level $or when using $and
      delete query.$or;
      delete query['location.state'];
      delete query['location.district'];
      delete query.category;
      // Add them to $and instead
      if (state) query.$and.push({ 'location.state': state });
      if (district) query.$and.push({ 'location.district': district });
      if (category) query.$and.push({ category });
    }

    const experiences = await Experience.find(query)
      .populate('provider', 'name rating')
      .select('-__v')
      .sort({ rating: -1, createdAt: -1 })
      .limit(100);

    // Get guide's already selected experiences
    const selectedIds = host.servicedExperiences?.map(id => id.toString()) || [];

    const formattedExperiences = experiences.map(exp => ({
      _id: exp._id,
      title: exp.title,
      description: exp.description,
      category: exp.category,
      subcategory: exp.subcategory,
      location: exp.location,
      price: exp.price,
      duration: exp.duration,
      imageUrl: exp.imageUrl,
      rating: exp.rating || 0,
      ratingCount: exp.ratingCount || 0,
      provider: exp.provider,
      isSelected: selectedIds.includes(exp._id.toString())
    }));

    res.json({ experiences: formattedExperiences });
  } catch (error) {
    console.error('Error fetching available experiences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get guide's selected serviced experiences
router.get('/guides/experiences', authenticate, requireHost, async (req, res) => {
  try {
    const host = await Host.findById(req.user._id).populate('servicedExperiences');
    
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    res.json({ 
      servicedExperiences: host.servicedExperiences || [],
      count: host.servicedExperiences?.length || 0
    });
  } catch (error) {
    console.error('Error fetching serviced experiences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add experience to guide's serviced experiences
router.post('/guides/experiences/:experienceId', authenticate, requireHost, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const Experience = require('../models/Experience');
    
    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    // Verify experience exists
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Check if already added
    if (host.servicedExperiences?.some(id => id.toString() === experienceId)) {
      return res.status(400).json({ message: 'Experience already added to serviced experiences' });
    }

    // Add to serviced experiences
    if (!host.servicedExperiences) {
      host.servicedExperiences = [];
    }
    host.servicedExperiences.push(experienceId);
    await host.save();

    res.json({ 
      message: 'Experience added to serviced experiences',
      servicedExperiences: host.servicedExperiences
    });
  } catch (error) {
    console.error('Error adding serviced experience:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single experience details for guides
router.get('/guides/experiences/:experienceId', authenticate, requireHost, async (req, res) => {
  try {
    const { experienceId } = req.params;
    const Experience = require('../models/Experience');
    
    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    // Get experience with full details
    const experience = await Experience.findById(experienceId)
      .populate('provider', 'name rating ratingCount email phoneNumber')
      .lean();

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Check if guide has selected this experience
    const isSelected = host.servicedExperiences?.some(id => id.toString() === experienceId) || false;

    // Format availableDates
    const formattedExperience = {
      ...experience,
      availableDates: experience.availableDates ? experience.availableDates.map((d) => {
        if (!d) return null;
        if (d.date) {
          const dateValue = d.date instanceof Date 
            ? d.date.toISOString().split('T')[0]
            : (typeof d.date === 'string' ? d.date.split('T')[0] : d.date);
          return {
            date: dateValue,
            startTime: d.startTime || null,
            endTime: d.endTime || null,
            available: d.available !== false
          };
        }
        return null;
      }).filter((d) => d !== null) : [],
      isSelected
    };

    res.json({ experience: formattedExperience });
  } catch (error) {
    console.error('Error fetching experience details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove experience from guide's serviced experiences
router.delete('/guides/experiences/:experienceId', authenticate, requireHost, async (req, res) => {
  try {
    const { experienceId } = req.params;
    
    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    // Remove from serviced experiences
    if (host.servicedExperiences) {
      host.servicedExperiences = host.servicedExperiences.filter(
        id => id.toString() !== experienceId
      );
      await host.save();
    }

    res.json({ 
      message: 'Experience removed from serviced experiences',
      servicedExperiences: host.servicedExperiences || []
    });
  } catch (error) {
    console.error('Error removing serviced experience:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ==================== GUIDED TOURS ENDPOINTS ====================

// Create a guided tour
router.post('/guides/tours', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      subcategory,
      location,
      availableDates,
      price,
      contentUrl,
      duration,
      maxParticipants,
      culturalMetadata,
      tags
    } = req.body;

    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can create guided tours' });
    }

    if (!title || !description || !category || !subcategory || !location || !availableDates || price === undefined) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Map category ID to category name if needed
    const categoryMap = {
      'living-with-the-land': 'Living with the Land',
      'stories-of-the-past': 'Stories of the Past',
      'the-soul': 'The Soul',
      'the-unseen': 'The Unseen',
      'creative-pulse': 'Creative Pulse',
      'water-flow': 'Water & Flow',
      'gastronomy': 'Gastronomy & Ancestral Flavors',
      'regional-exclusives': 'Regional Exclusives'
    };

    const categoryName = categoryMap[category] || category;

    // Parse location if it's a string
    const locationData = typeof location === 'string' ? JSON.parse(location) : location;

    const normalizedLocation = {
      country: (locationData.country || '').trim(),
      state: (locationData.state || '').trim(),
      district: (locationData.district || '').trim(),
      coordinates: locationData.coordinates || {}
    };

    // Parse availableDates
    const parsedDates = typeof availableDates === 'string' 
      ? JSON.parse(availableDates).map(d => ({
          date: new Date(d.date || d),
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          available: d.available !== false
        }))
      : availableDates.map(d => ({
          date: new Date(d.date || d),
          startTime: d.startTime || null,
          endTime: d.endTime || null,
          available: d.available !== false
        }));

    // Parse culturalMetadata if provided
    let parsedCulturalMetadata = null;
    if (culturalMetadata) {
      parsedCulturalMetadata = typeof culturalMetadata === 'string' 
        ? JSON.parse(culturalMetadata) 
        : culturalMetadata;
    }

    // Parse tags if provided
    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const tour = new Experience({
      title: title.trim(),
      description: description.trim(),
      category: categoryName,
      subcategory: subcategory.trim(),
      provider: req.user._id,
      location: normalizedLocation,
      availableDates: parsedDates,
      price: parseFloat(price),
      contentUrl: contentUrl || null,
      imageUrl: req.file ? (req.file.path || `/uploads/${req.file.filename}`) : null,
      duration: duration || 2,
      maxParticipants: maxParticipants || 10,
      experienceSource: 'GUIDE_TOUR',
      culturalMetadata: parsedCulturalMetadata,
      tags: parsedTags
    });

    await tour.save();

    // Normalize image URL before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedTour = normalizeExperience(tour.toObject ? tour.toObject() : tour, baseUrl);

    res.status(201).json({
      message: 'Guided tour created successfully',
      tour: normalizedTour
    });
  } catch (error) {
    console.error('Error creating guided tour:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all guided tours created by the authenticated guide
router.get('/guides/tours', authenticate, requireHost, async (req, res) => {
  try {
    const host = await Host.findById(req.user._id);
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    const tours = await Experience.find({
      provider: req.user._id,
      experienceSource: 'GUIDE_TOUR'
    })
      .populate('provider', 'name rating')
      .sort({ createdAt: -1 })
      .lean();

    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedTours = normalizeExperiences(tours, baseUrl);

    res.json({ tours: normalizedTours });
  } catch (error) {
    console.error('Error fetching guided tours:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single guided tour by ID
router.get('/guides/tours/:tourId', authenticate, requireHost, async (req, res) => {
  try {
    const { tourId } = req.params;
    const host = await Host.findById(req.user._id);
    
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can access this endpoint' });
    }

    const tour = await Experience.findOne({
      _id: tourId,
      provider: req.user._id,
      experienceSource: 'GUIDE_TOUR'
    })
      .populate('provider', 'name rating ratingCount email phoneNumber')
      .lean();

    if (!tour) {
      return res.status(404).json({ message: 'Guided tour not found' });
    }

    // Format availableDates
    const formattedTour = {
      ...tour,
      availableDates: tour.availableDates ? tour.availableDates.map((d) => {
        if (!d) return null;
        if (d.date) {
          const dateValue = d.date instanceof Date 
            ? d.date.toISOString().split('T')[0]
            : (typeof d.date === 'string' ? d.date.split('T')[0] : d.date);
          return {
            date: dateValue,
            startTime: d.startTime || null,
            endTime: d.endTime || null,
            available: d.available !== false
          };
        }
        return null;
      }).filter((d) => d !== null) : []
    };

    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedTour = normalizeExperience(formattedTour, baseUrl);

    res.json({ tour: normalizedTour });
  } catch (error) {
    console.error('Error fetching guided tour:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a guided tour
router.put('/guides/tours/:tourId', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    const { tourId } = req.params;
    const host = await Host.findById(req.user._id);
    
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can update guided tours' });
    }

    const tour = await Experience.findOne({
      _id: tourId,
      provider: req.user._id,
      experienceSource: 'GUIDE_TOUR'
    });

    if (!tour) {
      return res.status(404).json({ message: 'Guided tour not found' });
    }

    // Update fields
    const {
      title,
      description,
      category,
      subcategory,
      location,
      availableDates,
      price,
      contentUrl,
      duration,
      maxParticipants,
      culturalMetadata,
      tags
    } = req.body;

    if (title) tour.title = title.trim();
    if (description) tour.description = description.trim();
    if (category) {
      const categoryMap = {
        'living-with-the-land': 'Living with the Land',
        'stories-of-the-past': 'Stories of the Past',
        'the-soul': 'The Soul',
        'the-unseen': 'The Unseen',
        'creative-pulse': 'Creative Pulse',
        'water-flow': 'Water & Flow',
        'gastronomy': 'Gastronomy & Ancestral Flavors',
        'regional-exclusives': 'Regional Exclusives'
      };
      tour.category = categoryMap[category] || category;
    }
    if (subcategory) tour.subcategory = subcategory.trim();
    if (location) {
      const locationData = typeof location === 'string' ? JSON.parse(location) : location;
      tour.location = {
        country: (locationData.country || tour.location.country || '').trim(),
        state: (locationData.state || tour.location.state || '').trim(),
        district: (locationData.district || tour.location.district || '').trim(),
        coordinates: locationData.coordinates || tour.location.coordinates || {}
      };
    }
    if (availableDates) {
      const parsedDates = typeof availableDates === 'string' 
        ? JSON.parse(availableDates).map(d => ({
            date: new Date(d.date || d),
            startTime: d.startTime || null,
            endTime: d.endTime || null,
            available: d.available !== false
          }))
        : availableDates.map(d => ({
            date: new Date(d.date || d),
            startTime: d.startTime || null,
            endTime: d.endTime || null,
            available: d.available !== false
          }));
      tour.availableDates = parsedDates;
      tour.markModified('availableDates');
    }
    if (price !== undefined) tour.price = parseFloat(price);
    if (contentUrl !== undefined) tour.contentUrl = contentUrl || null;
    if (duration) tour.duration = duration;
    if (maxParticipants) tour.maxParticipants = maxParticipants;
    if (culturalMetadata) {
      tour.culturalMetadata = typeof culturalMetadata === 'string' 
        ? JSON.parse(culturalMetadata) 
        : culturalMetadata;
      tour.markModified('culturalMetadata');
    }
    if (tags) {
      tour.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      tour.markModified('tags');
    }
    if (req.file) {
      tour.imageUrl = req.file.path || `/uploads/${req.file.filename}`;
    }

    await tour.save();

    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedTour = normalizeExperience(tour.toObject ? tour.toObject() : tour, baseUrl);

    res.json({
      message: 'Guided tour updated successfully',
      tour: normalizedTour
    });
  } catch (error) {
    console.error('Error updating guided tour:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a guided tour
router.delete('/guides/tours/:tourId', authenticate, requireHost, async (req, res) => {
  try {
    const { tourId } = req.params;
    const host = await Host.findById(req.user._id);
    
    if (!host || host.providerType !== 'GUIDE') {
      return res.status(403).json({ message: 'Only guides can delete guided tours' });
    }

    const tour = await Experience.findOne({
      _id: tourId,
      provider: req.user._id,
      experienceSource: 'GUIDE_TOUR'
    });

    if (!tour) {
      return res.status(404).json({ message: 'Guided tour not found' });
    }

    await Experience.findByIdAndDelete(tourId);

    res.json({ message: 'Guided tour deleted successfully' });
  } catch (error) {
    console.error('Error deleting guided tour:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate a host
router.post('/:hostId/rate', authenticate, requireUser, async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const host = await Host.findById(req.params.hostId);
    if (!host) {
      return res.status(404).json({ message: 'Host not found' });
    }

    // Update rating (weighted average)
    const currentTotal = host.rating * host.ratingCount;
    host.ratingCount += 1;
    host.rating = (currentTotal + rating) / host.ratingCount;

    await host.save();

    res.json({
      message: 'Rating updated',
      rating: host.rating,
      ratingCount: host.ratingCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

