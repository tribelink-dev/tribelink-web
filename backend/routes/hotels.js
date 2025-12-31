const express = require('express');
const Hotel = require('../models/Hotel');
const { authenticate, requireUser, requireHost } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { filterHotelsAI } = require('../services/aiAgent');
const { normalizeHotels, normalizeHotel, getBaseUrlFromRequest } = require('../utils/imageUtils');

const router = express.Router();

// Revolutionary AI-Powered Hotel Filtering
// Filters hotels to top 2-3 based on comprehensive user profile
router.get('/ai-filtered', authenticate, requireUser, async (req, res) => {
  try {
    const {
      country,
      state,
      district,
      fromDate,
      toDate
    } = req.query;
    const userId = req.user._id;

    if (!country || !state || !district) {
      return res.status(400).json({ message: 'Country, state, and district are required' });
    }

    // Build query
    const query = {
      'location.country': country,
      'location.state': state,
      'location.district': district,
      roomsAvailable: { $gt: 0 }
    };

    // Add date availability filtering if provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      query.availability = {
        $elemMatch: {
          date: { $gte: from, $lte: to },
          roomsAvailable: { $gt: 0 }
        }
      };
    }

    // Fetch all hotels
    const allHotels = await Hotel.find(query)
      .sort({ rating: -1, pricePerNight: 1 })
      .lean();

    if (allHotels.length === 0) {
      return res.json({
        hotels: [],
        aiFiltered: true,
        message: 'No hotels found for this location'
      });
    }

    // Use AI agent to filter to top 2-3
    const filteredHotels = await filterHotelsAI(userId, allHotels, {
      location: { country, state, district },
      dateRange: fromDate && toDate ? { from: fromDate, to: toDate } : null
    });

    // Normalize image URLs before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedHotels = normalizeHotels(filteredHotels, baseUrl);

    res.json({
      hotels: normalizedHotels,
      aiFiltered: true,
      totalAvailable: allHotels.length,
      filteredTo: normalizedHotels.length
    });
  } catch (error) {
    console.error('Error in AI hotel filtering:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

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

    // Normalize image URLs before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedHotels = normalizeHotels(hotels, baseUrl);

    res.json({
      hotels: normalizedHotels,
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

    // Normalize image URLs before sending response
    const baseUrl = getBaseUrlFromRequest(req);
    const normalizedHotel = normalizeHotel(hotel.toObject ? hotel.toObject() : hotel, baseUrl);

    res.json({ hotel: normalizedHotel });
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

// Get hotels by owner (for hotel owner dashboard)
router.get('/owner/my-hotels', authenticate, requireHost, async (req, res) => {
  try {
    const hotels = await Hotel.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ hotels });
  } catch (error) {
    console.error('Error fetching owner hotels:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bookings for owner's hotels
router.get('/owner/bookings', authenticate, requireHost, async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    
    // Get all hotels owned by this provider
    const hotels = await Hotel.find({ createdBy: req.user._id }).select('_id name location pricePerNight');
    const hotelIds = hotels.map(h => h._id);

    // Get all trips that have bookings for these hotels
    const trips = await Trip.find({
      'schedule.hotel': { $in: hotelIds },
      paymentStatus: 'Completed'
    })
      .populate('user', 'name email phoneNumber')
      .populate('schedule.hotel')
      .sort({ createdAt: -1 })
      .lean();

    // Extract bookings from trips
    const bookings = [];
    trips.forEach(trip => {
      trip.schedule.forEach((day, index) => {
        if (day.hotel) {
          const hotelIdStr = (day.hotel._id || day.hotel).toString();
          if (hotelIds.some(id => id.toString() === hotelIdStr)) {
            const hotelData = hotels.find(h => 
              h._id.toString() === hotelIdStr
            );
            if (hotelData) {
              bookings.push({
                _id: `${trip._id}-${index}`,
                tripId: trip._id,
                hotel: {
                  _id: hotelData._id,
                  name: hotelData.name,
                  location: hotelData.location || {}
                },
                checkIn: day.date,
                checkOut: trip.toDate,
                guestName: trip.user?.name || 'Guest',
                guestEmail: trip.user?.email || '',
                guestPhone: trip.user?.phoneNumber || '',
                status: trip.paymentStatus === 'Completed' ? 'confirmed' : 'pending',
                totalPrice: hotelData.pricePerNight || 0,
                rooms: 1,
                paymentStatus: trip.paymentStatus
              });
            }
          }
        }
      });
    });

    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update hotel availability for specific dates
router.put('/:id/availability', authenticate, requireHost, async (req, res) => {
  try {
    const { date, roomsAvailable } = req.body;

    if (!date || roomsAvailable === undefined) {
      return res.status(400).json({ message: 'Date and roomsAvailable are required' });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Verify ownership
    if (hotel.createdBy && hotel.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate roomsAvailable
    if (roomsAvailable < 0 || roomsAvailable > hotel.totalRooms) {
      return res.status(400).json({ 
        message: `Rooms available must be between 0 and ${hotel.totalRooms}` 
      });
    }

    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];

    // Find existing availability entry
    const existingIndex = hotel.availability.findIndex(a => 
      a.date.toISOString().split('T')[0] === dateStr
    );

    if (existingIndex >= 0) {
      hotel.availability[existingIndex].roomsAvailable = roomsAvailable;
    } else {
      hotel.availability.push({
        date: dateObj,
        roomsAvailable: roomsAvailable
      });
    }

    await hotel.save();

    res.json({
      message: 'Availability updated successfully',
      hotel
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get revenue analytics for owner
router.get('/owner/revenue', authenticate, requireHost, async (req, res) => {
  try {
    const Trip = require('../models/Trip');
    
    // Get all hotels owned by this provider
    const hotels = await Hotel.find({ createdBy: req.user._id }).select('_id name pricePerNight');
    const hotelIds = hotels.map(h => h._id);

    // Get all completed trips with bookings for these hotels
    const trips = await Trip.find({
      'schedule.hotel': { $in: hotelIds },
      paymentStatus: 'Completed'
    })
      .select('schedule paymentStatus createdAt')
      .lean();

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate revenue metrics
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let yearlyRevenue = 0;
    const bookings = [];

    trips.forEach(trip => {
      trip.schedule.forEach(day => {
        if (day.hotel && hotelIds.includes(day.hotel.toString())) {
          const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
          if (hotel) {
            const bookingDate = new Date(day.date);
            const revenue = hotel.pricePerNight;
            
            totalRevenue += revenue;
            
            if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
              monthlyRevenue += revenue;
            }
            
            if (bookingDate.getFullYear() === currentYear) {
              yearlyRevenue += revenue;
            }

            bookings.push({
              hotelId: hotel._id.toString(),
              hotelName: hotel.name,
              revenue,
              date: bookingDate
            });
          }
        }
      });
    });

    // Revenue by hotel
    const revenueByHotelMap = new Map();
    bookings.forEach(b => {
      const existing = revenueByHotelMap.get(b.hotelId) || { revenue: 0, bookings: 0 };
      revenueByHotelMap.set(b.hotelId, {
        revenue: existing.revenue + b.revenue,
        bookings: existing.bookings + 1
      });
    });

    const revenueByHotel = Array.from(revenueByHotelMap.entries()).map(([hotelId, data]) => {
      const hotel = hotels.find(h => h._id.toString() === hotelId);
      return {
        hotelId,
        hotelName: hotel?.name || 'Unknown',
        revenue: data.revenue,
        bookings: data.bookings
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Revenue by month (last 12 months)
    const revenueByMonthMap = new Map();
    bookings.forEach(b => {
      const monthKey = `${b.date.getFullYear()}-${String(b.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = revenueByMonthMap.get(monthKey) || { revenue: 0, bookings: 0 };
      revenueByMonthMap.set(monthKey, {
        revenue: existing.revenue + b.revenue,
        bookings: existing.bookings + 1
      });
    });

    const revenueByMonth = Array.from(revenueByMonthMap.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        return {
          month: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: data.revenue,
          bookings: data.bookings
        };
      })
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    res.json({
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      bookingsCount: bookings.length,
      averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
      revenueByHotel,
      revenueByMonth
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

