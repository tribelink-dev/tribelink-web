const express = require('express');
const Host = require('../models/Host');
const Experience = require('../models/Experience');
const { authenticate, requireHost, requireUser } = require('../middleware/auth');
const upload = require('../middleware/upload');

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

// Get host's experiences
router.get('/experiences', authenticate, requireHost, async (req, res) => {
  try {
    const host = await Host.findById(req.user._id).populate('experiences');
    
    res.json({
      experiences: host.experiences || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create experience with image upload
router.post('/experience', authenticate, requireHost, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      availableDates,
      price,
      contentUrl,
      duration,
      maxParticipants
    } = req.body;

    if (!title || !description || !location || !availableDates || !price) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Parse location if it's a string
    const locationData = typeof location === 'string' ? JSON.parse(location) : location;

    // Normalize location fields (trim and ensure consistency)
    const normalizedLocation = {
      country: (locationData.country || '').trim(),
      state: (locationData.state || '').trim(),
      district: (locationData.district || '').trim(),
      coordinates: locationData.coordinates || {}
    };

    const experience = new Experience({
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
      price,
      contentUrl: contentUrl || null,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      duration: duration || 2,
      maxParticipants: maxParticipants || 10
    });

    await experience.save();

    // Add to host's experiences
    const host = await Host.findById(req.user._id);
    host.experiences.push(experience._id);
    await host.save();

    res.status(201).json({
      message: 'Experience created',
      experience
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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

    res.json({ experience: formattedExperience });
  } catch (error) {
    console.error('Error fetching experience:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    const experience = await Experience.findOne({
      _id: req.params.experienceId,
      provider: req.user._id
    });

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const {
      title,
      description,
      location,
      availableDates,
      price,
      contentUrl,
      duration,
      maxParticipants
    } = req.body;

    // Update fields
    if (title) experience.title = title.trim();
    if (description) experience.description = description.trim();
    if (location) {
      const locationData = typeof location === 'string' ? JSON.parse(location) : location;
      experience.location = {
        country: (locationData.country || experience.location.country || '').trim(),
        state: (locationData.state || experience.location.state || '').trim(),
        district: (locationData.district || experience.location.district || '').trim(),
        coordinates: locationData.coordinates || experience.location.coordinates || {}
      };
    }
    if (availableDates) {
      experience.availableDates = typeof availableDates === 'string' 
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
          });
    }
    if (price) experience.price = price;
    if (contentUrl !== undefined) experience.contentUrl = contentUrl || null;
    if (duration) experience.duration = duration;
    if (maxParticipants) experience.maxParticipants = maxParticipants;
    
    // Update image if new one is uploaded
    if (req.file) {
      experience.imageUrl = `/uploads/${req.file.filename}`;
    }

    // Mark location as modified to ensure nested object is saved
    experience.markModified('location');
    await experience.save();

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

    res.json({
      message: 'Experience updated',
      experience
    });
  } catch (error) {
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

