/**
 * Cart Routes
 * API endpoints for shopping cart management
 */

const express = require('express');
const Cart = require('../models/Cart');
const LocalHost = require('../models/LocalHost');
const Experience = require('../models/Experience');
const Booking = require('../models/Booking');
const { authenticate, requireUser } = require('../middleware/auth');

const router = express.Router();

// Get user's cart
router.get('/', authenticate, requireUser, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.abodeStay.localHostId', 'abodeDetails pricing images location providerId')
      .populate('items.experiences.experienceId', 'title price duration imageUrl')
      .populate('items.experience.experienceId', 'title price duration imageUrl');

    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = new Cart({ user: req.user._id });
      await cart.save();
    }

    // Recalculate total
    await cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add abode stay to cart
router.post('/abode', authenticate, requireUser, async (req, res) => {
  try {
    const {
      localHostId,
      variantId,
      checkIn,
      checkOut,
      guests,
      specialRequests
    } = req.body;

    if (!localHostId || !checkIn || !checkOut) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

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
      
      // Check capacity
      if (guests > variant.capacity) {
        return res.status(400).json({ message: `Maximum capacity for this variant is ${variant.capacity} guests` });
      }
    } else {
      // Use default variant or base pricing
      if (guests > localHost.abodeDetails.capacity) {
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

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    // Add abode stay item
    const item = {
      type: 'ABODE_STAY',
      abodeStay: {
        localHostId,
        variantId: variantId || localHost.defaultVariantId || null,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: guests || 1,
        specialRequests: specialRequests || ''
      },
      experiences: []
    };

    cart.items.push(item);
    await cart.calculateTotal();
    await cart.save();

    // Populate for response
    await cart.populate('items.abodeStay.localHostId', 'abodeDetails pricing images location providerId');

    res.json({
      success: true,
      message: 'Abode stay added to cart',
      cart
    });
  } catch (error) {
    console.error('Error adding abode to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add experience to cart item (abode stay)
router.post('/experience', authenticate, requireUser, async (req, res) => {
  try {
    const {
      itemId,
      experienceId,
      date,
      startTime,
      participants,
      specialRequests
    } = req.body;

    if (!itemId || !experienceId || !date || !startTime) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: 'Experience not found' });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (item.type !== 'ABODE_STAY') {
      return res.status(400).json({ message: 'Can only add experiences to abode stay items' });
    }

    // Check if experience is already added
    const existingExp = item.experiences.find(
      exp => exp.experienceId.toString() === experienceId
    );
    if (existingExp) {
      return res.status(400).json({ message: 'Experience already added to this booking' });
    }

    // Validate and normalize participants (ensure it's a number between 1 and 50)
    const normalizedParticipants = Math.max(1, Math.min(50, Number(participants) || 1));
    
    // Add experience
    item.experiences.push({
      experienceId,
      date: new Date(date),
      startTime,
      participants: normalizedParticipants,
      specialRequests: specialRequests || ''
    });

    await cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      message: 'Experience added to booking',
      cart
    });
  } catch (error) {
    console.error('Error adding experience to cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item (dates, variant, guests)
router.put('/item/:itemId', authenticate, requireUser, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { variantId, checkIn, checkOut, guests, specialRequests } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (item.type !== 'ABODE_STAY') {
      return res.status(400).json({ message: 'Can only update abode stay items' });
    }

    const localHost = await LocalHost.findById(item.abodeStay.localHostId);
    if (!localHost) {
      return res.status(404).json({ message: 'Local host not found' });
    }

    // Update variant if provided
    if (variantId !== undefined) {
      if (variantId) {
        const variant = localHost.roomVariants?.find(v => v.variantId === variantId);
        if (!variant) {
          return res.status(400).json({ message: 'Invalid room variant' });
        }
        item.abodeStay.variantId = variantId;
        
        // Validate capacity
        const newGuests = guests || item.abodeStay.guests;
        if (newGuests > variant.capacity) {
          return res.status(400).json({ message: `Maximum capacity for this variant is ${variant.capacity} guests` });
        }
      } else {
        item.abodeStay.variantId = null;
      }
    }

    // Update dates if provided
    if (checkIn) {
      item.abodeStay.checkIn = new Date(checkIn);
    }
    if (checkOut) {
      item.abodeStay.checkOut = new Date(checkOut);
    }

    // Validate date range
    const checkInDate = item.abodeStay.checkIn;
    const checkOutDate = item.abodeStay.checkOut;
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Update guests if provided
    if (guests !== undefined) {
      const variant = item.abodeStay.variantId
        ? localHost.roomVariants?.find(v => v.variantId === item.abodeStay.variantId)
        : null;
      const maxCapacity = variant ? variant.capacity : localHost.abodeDetails.capacity;
      
      if (guests > maxCapacity) {
        return res.status(400).json({ message: `Maximum capacity is ${maxCapacity} guests` });
      }
      item.abodeStay.guests = guests;
    }

    if (specialRequests !== undefined) {
      item.abodeStay.specialRequests = specialRequests;
    }

    await cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      message: 'Cart item updated',
      cart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove item from cart
router.delete('/item/:itemId', authenticate, requireUser, async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items.id(itemId).remove();
    await cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      cart
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove experience from cart item
router.delete('/experience/:itemId/:experienceId', authenticate, requireUser, async (req, res) => {
  try {
    const { itemId, experienceId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const expIndex = item.experiences.findIndex(
      exp => exp.experienceId.toString() === experienceId
    );
    if (expIndex === -1) {
      return res.status(404).json({ message: 'Experience not found in cart item' });
    }

    item.experiences.splice(expIndex, 1);
    await cart.calculateTotal();
    await cart.save();

    res.json({
      success: true,
      message: 'Experience removed from booking',
      cart
    });
  } catch (error) {
    console.error('Error removing experience from cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Checkout - convert cart to booking(s)
router.post('/checkout', authenticate, requireUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.abodeStay.localHostId')
      .populate('items.experiences.experienceId');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const bookings = [];

    // Process each cart item
    for (const item of cart.items) {
      if (item.type === 'ABODE_STAY') {
        const localHost = await LocalHost.findById(item.abodeStay.localHostId);
        if (!localHost) {
          continue;
        }

        // Check availability
        const checkInDate = new Date(item.abodeStay.checkIn);
        const checkOutDate = new Date(item.abodeStay.checkOut);
        let currentDate = new Date(checkInDate);
        
        while (currentDate < checkOutDate) {
          if (!localHost.isAvailableOnDate(currentDate)) {
            return res.status(400).json({ 
              message: `Not available on ${currentDate.toISOString().split('T')[0]}` 
            });
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Calculate price
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        let basePrice = 0;
        
        if (item.abodeStay.variantId) {
          const variant = localHost.roomVariants?.find(v => v.variantId === item.abodeStay.variantId);
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

        // Add experience prices
        let experienceTotal = 0;
        const linkedExperiences = [];
        
        for (const exp of item.experiences || []) {
          const experience = await Experience.findById(exp.experienceId);
          if (!experience) continue;

          let expPrice = experience.price;
          if (experience.isAddOn && experience.addOnPricing?.price) {
            expPrice = experience.addOnPricing.price;
            if (experience.addOnPricing.discount > 0) {
              expPrice *= (1 - experience.addOnPricing.discount / 100);
            }
          }

          experienceTotal += expPrice * exp.participants;
          
          linkedExperiences.push({
            experienceId: exp.experienceId,
            date: exp.date,
            startTime: exp.startTime,
            numberOfParticipants: exp.participants,
            price: expPrice * exp.participants,
            specialRequests: exp.specialRequests
          });
        }

        const totalPrice = basePrice + experienceTotal;

        // Create booking
        const booking = new Booking({
          user: req.user._id,
          bookingType: 'ABODE_STAY',
          abodeStay: {
            localHost: item.abodeStay.localHostId,
            variantId: item.abodeStay.variantId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            numberOfGuests: item.abodeStay.guests,
            specialRequests: item.abodeStay.specialRequests,
            linkedExperiences
          },
          totalPrice,
          currency: localHost.pricing.currency || 'USD',
          status: 'Pending',
          paymentStatus: 'Pending'
        });

        await booking.save();
        bookings.push(booking);

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

          availability.bookedSlots += item.abodeStay.guests;
          currentDate.setDate(currentDate.getDate() + 1);
        }

        await localHost.save();
      }
    }

    // Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Checkout successful',
      bookings: bookings.map(b => b._id),
      bookingCount: bookings.length
    });
  } catch (error) {
    console.error('Error during checkout:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear entire cart
router.delete('/', authenticate, requireUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared',
      cart
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

