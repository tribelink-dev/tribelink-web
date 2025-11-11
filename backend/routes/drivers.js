const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const DriverProvider = require('../models/DriverProvider');
const Trip = require('../models/Trip');
const { authenticate, requireHost } = require('../middleware/auth');

// Get driver profile by provider ID
router.get('/profile/:providerId', authenticate, async (req, res) => {
  try {
    const { providerId } = req.params;
    
    // Verify provider exists and is a driver
    const provider = await Provider.findById(providerId);
    if (!provider || provider.providerType !== 'DRIVER_PARTNER') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get or create driver profile
    let driverProfile = await DriverProvider.findOne({ providerId });
    
    if (!driverProfile) {
      // Create empty driver profile
      driverProfile = new DriverProvider({
        providerId,
        vehicleType: 'Sedan', // Default
        licenseNumber: '',
        pricing: {
          perDay: 50,
          currency: 'USD'
        }
      });
      await driverProfile.save();
    }

    res.json({
      driverProfile,
      provider: {
        _id: provider._id,
        name: provider.name,
        email: provider.email,
        phoneNumber: provider.phoneNumber
      }
    });
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update driver profile
router.put('/profile/:providerId', authenticate, requireHost, async (req, res) => {
  try {
    const { providerId } = req.params;
    const updateData = req.body;

    // Verify provider exists and user owns it
    const provider = await Provider.findById(providerId);
    if (!provider || provider.providerType !== 'DRIVER_PARTNER') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (provider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get or create driver profile
    let driverProfile = await DriverProvider.findOne({ providerId });
    
    if (!driverProfile) {
      driverProfile = new DriverProvider({ providerId });
    }

    // Update fields
    if (updateData.vehicleType) driverProfile.vehicleType = updateData.vehicleType;
    if (updateData.licenseNumber) driverProfile.licenseNumber = updateData.licenseNumber;
    if (updateData.licenseDocument) driverProfile.licenseDocument = updateData.licenseDocument;
    if (updateData.documents) driverProfile.documents = updateData.documents;
    if (updateData.availability) driverProfile.availability = updateData.availability;
    if (updateData.pricing) driverProfile.pricing = { ...driverProfile.pricing, ...updateData.pricing };
    if (updateData.yearsOfExperience !== undefined) driverProfile.yearsOfExperience = updateData.yearsOfExperience;
    if (updateData.languages) driverProfile.languages = updateData.languages;
    if (updateData.vehicleDetails) driverProfile.vehicleDetails = { ...driverProfile.vehicleDetails, ...updateData.vehicleDetails };

    await driverProfile.save();

    res.json({
      message: 'Driver profile updated successfully',
      driverProfile
    });
  } catch (error) {
    console.error('Error updating driver profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assigned trips for a driver
router.get('/trips/:driverId', authenticate, async (req, res) => {
  try {
    const { driverId } = req.params;

    // Verify driver exists
    const provider = await Provider.findById(driverId);
    if (!provider || provider.providerType !== 'DRIVER_PARTNER') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get trips assigned to this driver
    const trips = await Trip.find({
      assignedDriver: driverId,
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
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign driver to a trip (called when traveler selects chauffeur)
router.post('/assign/:tripId', authenticate, requireHost, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { driverId } = req.body;

    // Verify trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify driver exists
    const driver = await Provider.findById(driverId);
    if (!driver || driver.providerType !== 'DRIVER_PARTNER') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Get driver profile
    const driverProfile = await DriverProvider.findOne({ providerId: driverId });
    if (!driverProfile) {
      return res.status(400).json({ message: 'Driver profile not complete' });
    }

    // Check driver availability
    const tripDates = [];
    let currentDate = new Date(trip.fromDate);
    while (currentDate <= new Date(trip.toDate)) {
      tripDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Verify driver is available for all trip dates
    const unavailableDates = tripDates.filter(date => {
      const dateStr = date.toISOString().split('T')[0];
      const availability = driverProfile.availability.find(avail => {
        const availDateStr = new Date(avail.date).toISOString().split('T')[0];
        return availDateStr === dateStr;
      });
      return !availability || !availability.available;
    });

    if (unavailableDates.length > 0) {
      return res.status(400).json({ 
        message: 'Driver not available for all trip dates',
        unavailableDates: unavailableDates.map(d => d.toISOString().split('T')[0])
      });
    }

    // Assign driver to trip
    trip.assignedDriver = driverId;
    trip.assignedDriverProfile = driverProfile._id;
    await trip.save();

    res.json({
      message: 'Driver assigned successfully',
      trip: {
        _id: trip._id,
        assignedDriver: trip.assignedDriver,
        assignedDriverProfile: trip.assignedDriverProfile
      }
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

