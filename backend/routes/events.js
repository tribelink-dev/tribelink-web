/**
 * Events/Concerts Routes
 * API endpoints for live events, concerts, and cultural performances
 */

const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const { authenticate, requireUser } = require('../middleware/auth');
const upload = require('../middleware/uploadCloudinary');
const { getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// List all events with filters
router.get('/', async (req, res) => {
  try {
    const {
      country,
      state,
      district,
      type,
      category,
      dateFrom,
      dateTo,
      minPrice,
      maxPrice,
      status,
      isLive,
      page = 1,
      limit = 20,
      sort = 'date' // date, price, rating, newest
    } = req.query;

    // Build query
    const query = {};
    
    if (country) query['location.country'] = country;
    if (state) query['location.state'] = { $regex: new RegExp(state, 'i') };
    if (district) query['location.district'] = { $regex: new RegExp(district, 'i') };
    if (type) query.type = type;
    if (category) query.category = category;
    if (status) query.status = status;
    if (isLive !== undefined) query.isLive = isLive === 'true';
    
    // Date range filter
    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }
    
    // Price filter
    if (minPrice || maxPrice) {
      query.ticketPrice = {};
      if (minPrice) query.ticketPrice.$gte = Number(minPrice);
      if (maxPrice) query.ticketPrice.$lte = Number(maxPrice);
    }

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'price':
        sortOption = { ticketPrice: 1 };
        break;
      case 'rating':
        sortOption = { rating: -1, ratingCount: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'date':
      default:
        sortOption = { date: 1, startTime: 1 };
    }

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const events = await Event.find(query)
      .populate('organizer', 'name email phoneNumber')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Event.countDocuments(query);

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedEvents = events.map(event => {
      const eventObj = event.toObject();
      if (eventObj.imageUrl) {
        eventObj.imageUrl = eventObj.imageUrl.startsWith('http') 
          ? eventObj.imageUrl 
          : `${baseUrl}${eventObj.imageUrl}`;
      }
      if (eventObj.images && eventObj.images.length > 0) {
        eventObj.images = eventObj.images.map(img => ({
          ...img,
          url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
        }));
      }
      return eventObj;
    });

    res.json({
      success: true,
      events: normalizedEvents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recently updated live events
router.get('/live', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const events = await Event.find({
      isLive: true,
      status: { $in: ['Upcoming', 'Live'] }
    })
      .populate('organizer', 'name')
      .sort({ lastUpdated: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching live events:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event details by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email phoneNumber profilePicture');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Normalize image URLs
    const baseUrl = getBaseUrlFromRequest(req);
    const eventObj = event.toObject();
    if (eventObj.imageUrl) {
      eventObj.imageUrl = eventObj.imageUrl.startsWith('http') 
        ? eventObj.imageUrl 
        : `${baseUrl}${eventObj.imageUrl}`;
    }
    if (eventObj.images && eventObj.images.length > 0) {
      eventObj.images = eventObj.images.map(img => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `${baseUrl}${img.url}`
      }));
    }

    res.json({
      success: true,
      event: eventObj
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new event (for organizers)
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      organizerName,
      organizerContact,
      date,
      startTime,
      endTime,
      duration,
      location,
      ticketPrice,
      currency,
      capacity,
      availableTickets,
      ticketTiers,
      category,
      tags,
      ageRestriction,
      dressCode,
      facilities,
      isLive
    } = req.body;

    // Check if user is a provider (organizer)
    const organizer = req.user.providerType ? req.user._id : null;

    const event = new Event({
      title,
      description,
      type,
      organizer: organizer || null,
      organizerName: organizer ? null : organizerName,
      organizerContact: organizer ? null : organizerContact,
      date: new Date(date),
      startTime,
      endTime,
      duration: duration || 2,
      location: {
        venue: location?.venue || '',
        address: location?.address || '',
        country: location?.country || 'India',
        state: location?.state || '',
        district: location?.district || '',
        coordinates: location?.coordinates || { lat: 0, lng: 0 }
      },
      ticketPrice: Number(ticketPrice),
      currency: currency || 'USD',
      capacity: Number(capacity),
      availableTickets: Number(availableTickets || capacity),
      ticketTiers: ticketTiers || [],
      imageUrl: req.file ? (req.file.path || req.file.url) : null,
      category: category || 'Cultural',
      tags: tags || [],
      ageRestriction: ageRestriction || 'All Ages',
      dressCode,
      facilities: facilities || [],
      isLive: isLive === true || isLive === 'true',
      status: 'Upcoming',
      bookingOpen: true
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event (for organizers)
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Verify ownership (if organizer is a provider)
    if (event.organizer && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = req.body;
    
    // Handle image update
    if (req.file) {
      updateData.imageUrl = req.file.path || req.file.url;
    }

    // Update with tracking if isLive
    if (event.isLive && updateData) {
      Object.keys(updateData).forEach(key => {
        if (key !== 'updateHistory' && updateData[key] !== undefined) {
          event.updateWithTracking(key, updateData[key], 'Organizer update');
        }
      });
    } else {
      Object.assign(event, updateData);
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

