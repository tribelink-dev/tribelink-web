/**
 * Unified Booking Routes
 * Handles bookings for abode stays, experiences, and events
 */

const express = require('express');
const Booking = require('../models/Booking');
const LocalHost = require('../models/LocalHost');
const Experience = require('../models/Experience');
const Event = require('../models/Event');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { authenticate, requireUser } = require('../middleware/auth');
const { convertCurrency } = require('../services/currency');
const paymentService = require('../services/payment');

const router = express.Router();

// Get user's bookings
router.get('/', authenticate, requireUser, async (req, res) => {
  try {
    const { bookingType, status, page = 1, limit = 20 } = req.query;
    
    const query = { user: req.user._id };
    if (bookingType) query.bookingType = bookingType;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const bookings = await Booking.find(query)
      .populate('abodeStay.localHost')
      .populate('experience.experienceId')
      .populate('event.eventId')
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

// Get booking details
router.get('/:id', authenticate, requireUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('abodeStay.localHost')
      .populate('experience.experienceId')
      .populate('event.eventId')
      .populate('trip')
      .populate('user', 'name email phoneNumber');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Book abode stay
router.post('/abode-stay', authenticate, requireUser, async (req, res) => {
  try {
    const {
      localHostId,
      variantId,
      checkIn,
      checkOut,
      numberOfGuests,
      specialRequests,
      linkedExperiences,
      tripId
    } = req.body;

    // Validate input
    if (!localHostId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const Experience = require('../models/Experience');
    const localHost = await LocalHost.findById(localHostId);
    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Validate variant if provided
    if (variantId) {
      const variant = localHost.roomVariants?.find(v => v.variantId === variantId);
      if (!variant) {
        return res.status(400).json({ message: 'Invalid room variant' });
      }
      if (numberOfGuests > variant.capacity) {
        return res.status(400).json({ message: `Maximum capacity for this variant is ${variant.capacity} guests` });
      }
    } else {
      if (numberOfGuests > localHost.abodeDetails.capacity) {
        return res.status(400).json({ message: `Maximum capacity is ${localHost.abodeDetails.capacity} guests` });
      }
    }

    // Check availability
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    if (nights <= 0) {
      return res.status(400).json({ message: 'Invalid date range' });
    }

    // Check availability for each night
    let currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      if (!localHost.isAvailableOnDate(currentDate)) {
        return res.status(400).json({ 
          message: `Not available on ${currentDate.toISOString().split('T')[0]}` 
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate base price (variant or default)
    let basePrice = 0;
    if (variantId) {
      const variant = localHost.roomVariants.find(v => v.variantId === variantId);
      if (variant) {
        basePrice = variant.pricePerNight * nights;
      }
    }
    
    if (basePrice === 0) {
      // Fallback to base pricing
      basePrice = localHost.pricing.pricePerNight * nights;
    }
    
    // Apply discounts
    if (nights >= 30 && localHost.pricing.monthlyDiscount > 0) {
      basePrice *= (1 - localHost.pricing.monthlyDiscount / 100);
    } else if (nights >= 7 && localHost.pricing.weeklyDiscount > 0) {
      basePrice *= (1 - localHost.pricing.weeklyDiscount / 100);
    }

    // Process linked experiences
    let experienceTotal = 0;
    const processedExperiences = [];
    
    if (linkedExperiences && Array.isArray(linkedExperiences)) {
      for (const exp of linkedExperiences) {
        const experience = await Experience.findById(exp.experienceId);
        if (!experience) continue;

        let expPrice = experience.price;
        if (experience.isAddOn && experience.addOnPricing?.price) {
          expPrice = experience.addOnPricing.price;
          if (experience.addOnPricing.discount > 0) {
            expPrice *= (1 - experience.addOnPricing.discount / 100);
          }
        }

        experienceTotal += expPrice * (exp.numberOfParticipants || 1);
        
        processedExperiences.push({
          experienceId: exp.experienceId,
          date: new Date(exp.date),
          startTime: exp.startTime,
          numberOfParticipants: exp.numberOfParticipants || 1,
          price: expPrice * (exp.numberOfParticipants || 1),
          specialRequests: exp.specialRequests
        });
      }
    }

    const totalPrice = basePrice + experienceTotal;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      bookingType: 'ABODE_STAY',
      abodeStay: {
        localHost: localHostId,
        variantId: variantId || null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numberOfGuests: numberOfGuests || 1,
        specialRequests: specialRequests || '',
        linkedExperiences: processedExperiences
      },
      totalPrice: Math.round(totalPrice * 100) / 100,
      currency: localHost.pricing.currency || 'USD',
      trip: tripId || null,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    await booking.save();

    // Update availability
    currentDate = new Date(checkInDate);
    while (currentDate < checkOutDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      let availability = localHost.availability.find(avail => {
        const availDateStr = new Date(avail.date).toISOString().split('T')[0];
        return availDateStr === dateStr;
      });

      if (!availability) {
        availability = {
          date: new Date(currentDate),
          available: true,
          bookedSlots: 0
        };
        localHost.availability.push(availability);
      }

      availability.bookedSlots += (numberOfGuests || 1);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await localHost.save();

    res.status(201).json({
      success: true,
      message: 'Abode stay booked successfully',
      booking
    });
  } catch (error) {
    console.error('Error booking abode stay:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Book experience
router.post('/experience', authenticate, requireUser, async (req, res) => {
  try {
    const {
      experienceId,
      date,
      startTime,
      numberOfParticipants,
      specialRequests,
      tripId
    } = req.body;

    if (!experienceId || !date || !startTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const experience = await Experience.findById(experienceId)
      .populate('provider');

    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    // Check availability (simplified - can be enhanced)
    const experienceDate = new Date(date);
    const isAvailable = experience.availableDates.some(avail => {
      const availDate = new Date(avail.date);
      return availDate.toISOString().split('T')[0] === experienceDate.toISOString().split('T')[0] 
        && avail.available === true;
    });

    if (!isAvailable) {
      return res.status(400).json({ message: 'Experience not available on selected date' });
    }

    // Calculate price
    const totalPrice = experience.price * (numberOfParticipants || 1);

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      bookingType: 'EXPERIENCE',
      experience: {
        experienceId,
        date: experienceDate,
        startTime,
        numberOfParticipants: numberOfParticipants || 1,
        specialRequests
      },
      totalPrice,
      currency: 'USD', // Default, can be enhanced
      trip: tripId || null,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Experience booked successfully',
      booking
    });
  } catch (error) {
    console.error('Error booking experience:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Book event tickets
router.post('/event', authenticate, requireUser, async (req, res) => {
  try {
    const {
      eventId,
      ticketCount,
      ticketTier,
      seatNumbers,
      tripId
    } = req.body;

    if (!eventId || !ticketCount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check ticket availability
    if (!event.hasAvailableTickets(ticketCount, ticketTier)) {
      return res.status(400).json({ message: 'Not enough tickets available' });
    }

    // Calculate price
    let ticketPrice = event.ticketPrice;
    if (ticketTier) {
      const tier = event.ticketTiers.find(t => t.name === ticketTier);
      if (tier) {
        ticketPrice = tier.price;
      }
    }

    const totalPrice = ticketPrice * ticketCount;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      bookingType: 'EVENT',
      event: {
        eventId,
        ticketCount,
        ticketTier: ticketTier || null,
        seatNumbers: seatNumbers || []
      },
      totalPrice,
      currency: event.currency,
      trip: tripId || null,
      status: 'Pending',
      paymentStatus: 'Pending'
    });

    await booking.save();

    // Update event ticket availability
    await event.bookTickets(ticketCount, ticketTier);

    res.status(201).json({
      success: true,
      message: 'Event tickets booked successfully',
      booking
    });
  } catch (error) {
    console.error('Error booking event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create payment session (redirect URL) for booking. Provider from PAYMENT_PROVIDER (razorpay|stripe).
router.post('/:id/create-payment-session', authenticate, requireUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.paymentStatus === 'Completed') {
      return res.status(400).json({ message: 'Booking already paid' });
    }
    const { url } = await paymentService.createPaymentSession(booking, req.user);
    if (!url) {
      return res.status(503).json({ message: 'Payment provider did not return a URL.' });
    }
    res.json({ url });
  } catch (error) {
    console.error('Error creating payment session:', error);
    if (error.message && error.message.includes('not configured')) {
      return res.status(503).json({ message: 'Card payment is not configured. Please pay with wallet.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Alias for backward compatibility (same behavior as create-payment-session)
router.post('/:id/create-checkout-session', authenticate, requireUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (booking.paymentStatus === 'Completed') {
      return res.status(400).json({ message: 'Booking already paid' });
    }
    const { url } = await paymentService.createPaymentSession(booking, req.user);
    if (!url) {
      return res.status(503).json({ message: 'Payment provider did not return a URL.' });
    }
    res.json({ url });
  } catch (error) {
    console.error('Error creating payment session:', error);
    if (error.message && error.message.includes('not configured')) {
      return res.status(503).json({ message: 'Card payment is not configured. Please pay with wallet.' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pay for booking
router.post('/:id/pay', authenticate, requireUser, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('abodeStay.localHost')
      .populate('experience.experienceId')
      .populate('event.eventId');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (booking.paymentStatus === 'Completed') {
      return res.status(400).json({ message: 'Booking already paid' });
    }

    const user = await User.findById(req.user._id);

    // Convert booking price to user's wallet currency
    const priceInWalletCurrency = await convertCurrency(
      booking.totalPrice,
      booking.currency || 'USD',
      user.tripWallet.currency
    );

    if (user.tripWallet.balance < priceInWalletCurrency) {
      return res.status(400).json({
        message: 'Insufficient balance',
        required: priceInWalletCurrency,
        available: user.tripWallet.balance,
        currency: user.tripWallet.currency
      });
    }

    // Process payment
    user.tripWallet.balance -= priceInWalletCurrency;
    booking.paymentStatus = 'Completed';
    booking.status = 'Confirmed';
    booking.paymentDate = new Date();
    booking.paymentMethod = 'Wallet';
    booking.transactionId = `TXN-${Date.now()}-${booking._id.toString().slice(-6)}`;
    
    await user.save();
    await booking.save();

    res.json({
      success: true,
      message: 'Payment successful',
      booking,
      remainingBalance: user.tripWallet.balance,
      currency: user.tripWallet.currency
    });
  } catch (error) {
    console.error('Error processing booking payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', authenticate, requireUser, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Cancel booking
    await booking.cancel(reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


