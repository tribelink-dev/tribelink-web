const express = require('express');
const Hotel = require('../models/Hotel');
const { authenticate, requireUser, requireHost } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all hotels (with optional filters)
router.get('/', async (req, res) => {
  try {
    const {
      country,
      state,
      district,
      minPrice,
      maxPrice,
      minRating,
      amenities,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    // Location filters
    if (country) query['location.country'] = country;
    if (state) query['location.state'] = state;
    if (district) query['location.district'] = district;

    // Price filter
    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    // Amenities filter
    if (amenities) {
      const amenityList = Array.isArray(amenities) ? amenities : [amenities];
      query.amenities = { $in: amenityList };
    }

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hotels = await Hotel.find(query)
      .sort({ rating: -1, pricePerNight: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-reviews') // Exclude reviews from list view
      .lean();

    const total = await Hotel.countDocuments(query);

    res.json({
      hotels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('reviews.user', 'name email')
      .populate('createdBy', 'name');

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ hotel });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create hotel (host/admin only)
router.post('/', authenticate, requireHost, upload.array('images', 10), async (req, res) => {
  try {
    const {
      name,
      description,
      country,
      state,
      district,
      address,
      lat,
      lng,
      totalRooms,
      roomsAvailable,
      pricePerNight,
      amenities,
      contactPhone,
      contactEmail,
      checkIn,
      checkOut,
      cancellationPolicy
    } = req.body;

    if (!name || !country || !state || !district || !totalRooms || !pricePerNight) {
      return res.status(400).json({ message: 'Name, location, total rooms, and price are required' });
    }

    // Handle uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        images.push({
          url: `/uploads/${file.filename}`,
          isMain: index === 0
        });
      });
    }

    // Parse amenities if it's a string
    let amenitiesList = [];
    if (amenities) {
      amenitiesList = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
    }

    const hotel = new Hotel({
      name,
      description,
      images,
      amenities: amenitiesList,
      location: {
        country,
        state,
        district,
        address,
        coordinates: (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null
      },
      totalRooms: parseInt(totalRooms),
      roomsAvailable: parseInt(roomsAvailable || totalRooms),
      pricePerNight: parseFloat(pricePerNight),
      contact: {
        phone: contactPhone,
        email: contactEmail
      },
      policies: {
        checkIn: checkIn || '14:00',
        checkOut: checkOut || '11:00',
        cancellationPolicy
      },
      createdBy: req.user._id
    });

    await hotel.save();

    res.status(201).json({
      message: 'Hotel created successfully',
      hotel
    });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update hotel (host/admin only)
router.put('/:id', authenticate, requireHost, upload.array('images', 10), async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Verify ownership (unless admin)
    if (hotel.createdBy && hotel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      name,
      description,
      country,
      state,
      district,
      address,
      lat,
      lng,
      totalRooms,
      roomsAvailable,
      pricePerNight,
      amenities,
      contactPhone,
      contactEmail,
      checkIn,
      checkOut,
      cancellationPolicy
    } = req.body;

    // Update fields
    if (name) hotel.name = name;
    if (description !== undefined) hotel.description = description;
    if (totalRooms) hotel.totalRooms = parseInt(totalRooms);
    if (roomsAvailable !== undefined) hotel.roomsAvailable = parseInt(roomsAvailable);
    if (pricePerNight) hotel.pricePerNight = parseFloat(pricePerNight);

    // Update location
    if (country || state || district || address || lat || lng) {
      if (country) hotel.location.country = country;
      if (state) hotel.location.state = state;
      if (district) hotel.location.district = district;
      if (address !== undefined) hotel.location.address = address;
      if (lat && lng) {
        hotel.location.coordinates = {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        };
      }
    }

    // Update amenities
    if (amenities !== undefined) {
      hotel.amenities = Array.isArray(amenities) ? amenities : JSON.parse(amenities);
    }

    // Update contact
    if (contactPhone !== undefined || contactEmail !== undefined) {
      if (contactPhone !== undefined) hotel.contact.phone = contactPhone;
      if (contactEmail !== undefined) hotel.contact.email = contactEmail;
    }

    // Update policies
    if (checkIn || checkOut || cancellationPolicy !== undefined) {
      if (checkIn) hotel.policies.checkIn = checkIn;
      if (checkOut) hotel.policies.checkOut = checkOut;
      if (cancellationPolicy !== undefined) hotel.policies.cancellationPolicy = cancellationPolicy;
    }

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        hotel.images.push({
          url: `/uploads/${file.filename}`,
          isMain: false
        });
      });
    }

    await hotel.save();

    res.json({
      message: 'Hotel updated successfully',
      hotel
    });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete hotel image
router.delete('/:id/images/:imageId', authenticate, requireHost, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    if (hotel.createdBy && hotel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    hotel.images = hotel.images.filter(img => img._id.toString() !== req.params.imageId);

    await hotel.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete hotel (host/admin only)
router.delete('/:id', authenticate, requireHost, async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Verify ownership
    if (hotel.createdBy && hotel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Hotel.findByIdAndDelete(req.params.id);

    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check hotel availability for dates
router.get('/:id/availability', async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'From date and to date are required' });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const dates = [];
    let currentDate = new Date(from);

    while (currentDate <= to) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const availability = hotel.availability.find(a => 
        a.date.toISOString().split('T')[0] === dateStr
      );

      dates.push({
        date: dateStr,
        roomsAvailable: availability ? availability.roomsAvailable : hotel.roomsAvailable,
        isAvailable: availability ? availability.roomsAvailable > 0 : hotel.roomsAvailable > 0
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({ availability: dates });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add hotel review (authenticated users)
router.post('/:id/reviews', authenticate, requireUser, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating (1-5) is required' });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check if user already reviewed
    const existingReview = hotel.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this hotel' });
    }

    // Add review
    hotel.reviews.push({
      user: req.user._id,
      rating: parseInt(rating),
      comment: comment || ''
    });

    // Update rating average
    const totalRating = hotel.reviews.reduce((sum, r) => sum + r.rating, 0);
    hotel.rating = totalRating / hotel.reviews.length;
    hotel.ratingCount = hotel.reviews.length;

    await hotel.save();

    const populatedHotel = await Hotel.findById(hotel._id)
      .populate('reviews.user', 'name email');

    res.json({
      message: 'Review added successfully',
      hotel: populatedHotel
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

