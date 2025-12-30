const express = require('express');
const router = express.Router();
const Provider = require('../models/Provider');
const DriverProvider = require('../models/DriverProvider');
const Trip = require('../models/Trip');
const { authenticate, requireHost, requireUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const multer = require('multer');
const { filterDriversAI } = require('../services/aiAgent');

// Wrapper to handle multer errors
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
              message: 'File too large. Maximum size is 10MB',
              error: err.message 
            });
          }
          return res.status(400).json({ 
            message: 'File upload error',
            error: err.message 
          });
        }
        // Handle file filter errors
        return res.status(400).json({ 
          message: err.message || 'File upload failed',
          error: err.message 
        });
      }
      next();
    });
  };
};

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

// Revolutionary AI-Powered Driver/Chauffeur Filtering
// Filters drivers to top 2-3 based on comprehensive user profile
router.get('/available/ai-filtered', authenticate, requireUser, async (req, res) => {
  try {
    const { fromDate, toDate, location } = req.query;
    const userId = req.user._id;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Date range required' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Get all driver providers (same logic as regular endpoint)
    const driverProfiles = await DriverProvider.find({
      isVerified: true
    }).populate('providerId', 'name email phoneNumber rating');

    // Filter drivers available for the date range
    const availableDrivers = [];
    
    for (const profile of driverProfiles) {
      const tripDates = [];
      let currentDate = new Date(from);
      while (currentDate <= to) {
        tripDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const isAvailable = tripDates.every(date => {
        const dateStr = date.toISOString().split('T')[0];
        const availability = profile.availability.find(avail => {
          const availDateStr = new Date(avail.date).toISOString().split('T')[0];
          return availDateStr === dateStr;
        });
        return !availability || availability.available !== false;
      });

      if (isAvailable && profile.providerId) {
        availableDrivers.push({
          _id: profile.providerId._id,
          driverProfileId: profile._id,
          name: profile.providerId.name,
          email: profile.providerId.email,
          phoneNumber: profile.providerId.phoneNumber,
          rating: profile.rating || profile.providerId.rating || 0,
          ratingCount: profile.ratingCount || 0,
          vehicleType: profile.vehicleType,
          vehicleDetails: profile.vehicleDetails,
          pricing: profile.pricing,
          yearsOfExperience: profile.yearsOfExperience,
          languages: profile.languages || [],
          isVerified: profile.isVerified
        });
      }
    }

    if (availableDrivers.length === 0) {
      return res.json({
        drivers: [],
        aiFiltered: true,
        message: 'No drivers available for this date range'
      });
    }

    // Use AI agent to filter to top 2-3
    const filteredDrivers = await filterDriversAI(userId, availableDrivers, {
      dateRange: { from: fromDate, to: toDate },
      location: location || null
    });

    res.json({
      drivers: filteredDrivers,
      aiFiltered: true,
      totalAvailable: availableDrivers.length,
      filteredTo: filteredDrivers.length
    });
  } catch (error) {
    console.error('Error in AI driver filtering:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Get available drivers for a date range
router.get('/available', async (req, res) => {
  try {
    const { fromDate, toDate, location } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Date range required' });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Get all driver providers
    const driverProfiles = await DriverProvider.find({
      isVerified: true // Only show verified drivers
    }).populate('providerId', 'name email phoneNumber rating');

    // Filter drivers available for the date range
    const availableDrivers = [];
    
    for (const profile of driverProfiles) {
      // Check if driver has availability for all dates in range
      const tripDates = [];
      let currentDate = new Date(from);
      while (currentDate <= to) {
        tripDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Check availability for each date
      const isAvailable = tripDates.every(date => {
        const dateStr = date.toISOString().split('T')[0];
        const availability = profile.availability.find(avail => {
          const availDateStr = new Date(avail.date).toISOString().split('T')[0];
          return availDateStr === dateStr;
        });
        // If no availability entry, assume available (flexible)
        // If entry exists, check if available is true
        return !availability || availability.available !== false;
      });

      if (isAvailable && profile.providerId) {
        availableDrivers.push({
          _id: profile.providerId._id,
          driverProfileId: profile._id,
          name: profile.providerId.name,
          email: profile.providerId.email,
          phoneNumber: profile.providerId.phoneNumber,
          rating: profile.rating || profile.providerId.rating || 0,
          ratingCount: profile.ratingCount || 0,
          vehicleType: profile.vehicleType,
          vehicleDetails: profile.vehicleDetails,
          pricing: profile.pricing,
          yearsOfExperience: profile.yearsOfExperience,
          languages: profile.languages || [],
          isVerified: profile.isVerified
        });
      }
    }

    // Sort by rating (highest first)
    availableDrivers.sort((a, b) => b.rating - a.rating);

    res.json({ drivers: availableDrivers });
  } catch (error) {
    console.error('Error fetching available drivers:', error);
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

// Upload driver document
router.post('/documents/:providerId', authenticate, requireHost, handleUpload(upload.single('document')), async (req, res) => {
  try {
    const { providerId } = req.params;
    const { documentType, documentName, licenseNumber, registrationNumber } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!documentType || !['License', 'Insurance', 'Registration', 'Other'].includes(documentType)) {
      return res.status(400).json({ message: 'Valid document type is required (License, Insurance, Registration, Other)' });
    }

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
      // Create new driver profile with required fields
      // For licenseNumber: use provided value if it's a License document, otherwise use placeholder
      const defaultLicenseNumber = (documentType === 'License' && licenseNumber) 
        ? licenseNumber 
        : 'PENDING_UPLOAD';
      
      driverProfile = new DriverProvider({
        providerId,
        vehicleType: 'Sedan', // Default value
        licenseNumber: defaultLicenseNumber,
        pricing: {
          perDay: 50,
          currency: 'USD'
        }
      });
    }

    // Create document entry
    const documentUrl = `/uploads/${req.file.filename}`;
    const documentEntry = {
      name: documentName || req.file.originalname,
      url: documentUrl,
      type: documentType,
      uploadedAt: new Date()
    };

    // Ensure documents array exists
    if (!driverProfile.documents) {
      driverProfile.documents = [];
    }

    // Update profile fields based on document type
    if (documentType === 'License') {
      // For license, also update licenseDocument field and licenseNumber
      driverProfile.licenseDocument = documentUrl;
      if (licenseNumber) {
        driverProfile.licenseNumber = licenseNumber;
      }
      // Remove existing license documents and add new one
      driverProfile.documents = driverProfile.documents.filter(doc => doc.type !== 'License');
    } else if (documentType === 'Registration') {
      // Update registration number if provided
      if (registrationNumber) {
        if (!driverProfile.vehicleDetails) {
          driverProfile.vehicleDetails = {};
        }
        driverProfile.vehicleDetails.registrationNumber = registrationNumber;
      }
      // Remove existing registration documents and add new one
      driverProfile.documents = driverProfile.documents.filter(doc => doc.type !== 'Registration');
    } else {
      // Remove existing document of same type if exists
      driverProfile.documents = driverProfile.documents.filter(doc => doc.type !== documentType);
    }

    driverProfile.documents.push(documentEntry);
    await driverProfile.save();

    res.json({
      message: 'Document uploaded successfully',
      document: documentEntry,
      driverProfile
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    console.error('Error stack:', error.stack);
    // If it's a validation error, provide more details
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        error: error.message,
        details: error.errors 
      });
    }
    // If it's a multer error
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File too large. Maximum size is 10MB',
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Upload profile picture
router.post('/profile-picture/:providerId', authenticate, requireHost, handleUpload(upload.single('profilePicture')), async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Verify provider exists and user owns it
    const provider = await Provider.findById(providerId);
    if (!provider || provider.providerType !== 'DRIVER_PARTNER') {
      return res.status(404).json({ message: 'Driver not found' });
    }

    if (provider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update provider profile picture
    provider.profilePicture = `/uploads/${req.file.filename}`;
    await provider.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePicture: provider.profilePicture
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Assign driver to a trip (called when traveler selects chauffeur)
router.post('/assign/:tripId', authenticate, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { driverId } = req.body;

    // Verify trip exists and belongs to user
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify trip belongs to user (travelers can assign drivers to their trips)
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only assign drivers to your own trips.' });
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

