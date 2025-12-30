const express = require('express');
const Experience = require('../models/Experience');
const Review = require('../models/Review');
const Trip = require('../models/Trip');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Ticket = require('../models/Ticket');
const Provider = require('../models/Provider');
const { scheduleTrip } = require('../services/scheduler');
const { scheduleTripWithAI, getAIRecommendations } = require('../services/aiScheduler');
const { convertCurrency } = require('../services/currency');
const { authenticate, requireUser } = require('../middleware/auth');
const { filterExperiencesAI } = require('../services/aiAgent');
const { matchUserToCulturalExperiences, getSeasonalCulturalRecommendations } = require('../services/culturalMatchingEngine');
const { canExperienceBeScheduledForTrip } = require('../services/scheduler/availability/availabilityService');

const router = express.Router();

// Search experiences by location and date
router.get('/search', async (req, res) => {
  try {
    const { country, state, district, from, to } = req.query;

    if (!country || !state || !district || !from || !to) {
      return res.status(400).json({ message: 'All search parameters are required' });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const experiences = await Experience.find({
      'location.country': country,
      'location.state': state,
      'location.district': district,
      availableDates: {
        $elemMatch: {
          $gte: fromDate,
          $lte: toDate
        }
      }
    })
      .populate('provider', 'name rating');

    // Filter out experiences with null/invalid providers and convert to plain objects
    const validExperiences = experiences
      .filter(exp => {
        return exp.provider && 
               (typeof exp.provider === 'object') && 
               exp.provider.name;
      })
      .map(exp => {
        const expObj = exp.toObject ? exp.toObject() : exp;
        return expObj;
      })
      .sort((a, b) => {
        const aProviderRating = (a.provider && a.provider.rating) || 0;
        const bProviderRating = (b.provider && b.provider.rating) || 0;
        return bProviderRating - aProviderRating;
      })
      .map(exp => ({
        ...exp,
        provider: exp.provider ? {
          name: exp.provider.name || 'Unknown',
          rating: exp.provider.rating || 0
        } : {
          name: 'Unknown',
          rating: 0
        }
      }));

    res.json({ experiences: validExperiences });
  } catch (error) {
    console.error('Error searching experiences:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Get experiences by district (with content)
router.get('/experiences/:district', async (req, res) => {
  try {
    const { district } = req.params;
    const { country, state, from, to } = req.query;

    // Decode district parameter (in case it's URL encoded)
    const decodedDistrict = decodeURIComponent(district).trim();

    if (!decodedDistrict || decodedDistrict === '') {
      return res.status(400).json({ message: 'District parameter is required' });
    }

    // Normalize search terms (trim and lowercase for comparison)
    const normalizedDistrict = decodedDistrict.toLowerCase().trim();
    const normalizedCountry = country ? country.toLowerCase().trim() : null;
    const normalizedState = state ? state.toLowerCase().trim() : null;

    // Build query - try exact match first, then case-insensitive regex
    // This is more efficient and handles most cases
    const query = {};
    
    // Use case-insensitive regex for district (always required)
    query['location.district'] = { 
      $regex: new RegExp(`^${normalizedDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
    };
    
    // Country is optional but if provided, use it
    if (normalizedCountry) {
      query['location.country'] = { 
        $regex: new RegExp(`^${normalizedCountry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      };
    }
    
    // State is optional - if provided, use it; otherwise search all states
    // This makes the search more flexible
    if (normalizedState && normalizedState.trim() !== '') {
      query['location.state'] = { 
        $regex: new RegExp(`^${normalizedState.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      };
    }

    // Find experiences and populate provider
    let experiences;
    try {
      console.log('Searching experiences with query:', {
        district: decodedDistrict,
        normalizedDistrict: normalizedDistrict,
        state: state,
        normalizedState: normalizedState,
        country: country,
        normalizedCountry: normalizedCountry,
        query: JSON.stringify(query)
      });
      
      experiences = await Experience.find(query)
        .populate({
          path: 'provider',
          select: 'name rating',
          model: 'Host'
        });
      
      console.log(`Found ${experiences.length} experiences`);
      
      // Debug: Log provider info for first experience
      if (experiences.length > 0) {
        console.log('First experience provider:', {
          hasProvider: !!experiences[0].provider,
          providerType: typeof experiences[0].provider,
          providerValue: experiences[0].provider
        });
      }
      
      // If no results and state was provided, try without state filter
      if (experiences.length === 0 && normalizedState && normalizedState.trim() !== '') {
        console.log('No results with state filter, trying without state...');
        const queryWithoutState = { ...query };
        delete queryWithoutState['location.state'];
        const experiencesWithoutState = await Experience.find(queryWithoutState)
          .populate('provider', 'name rating');
        console.log(`Found ${experiencesWithoutState.length} experiences without state filter`);
        if (experiencesWithoutState.length > 0) {
          experiences = experiencesWithoutState;
        }
      }
      
      // Debug: Log first few experience locations if found
      if (experiences.length > 0) {
        console.log('Sample experience locations:', experiences.slice(0, 3).map(exp => ({
          id: exp._id,
          title: exp.title,
          district: exp.location?.district,
          state: exp.location?.state,
          country: exp.location?.country
        })));
      } else {
        // If no experiences found, check what's in the database for this district
        // Try a broader search to see what districts exist
        const allExperiences = await Experience.find({ 
          'location.district': { $exists: true }
        }).select('title location').limit(10).lean();
        console.log('Sample experiences in database (any district):', allExperiences.map(exp => ({
          title: exp.title,
          district: exp.location?.district,
          state: exp.location?.state,
          country: exp.location?.country
        })));
        
        // Also try a case-insensitive search without regex escaping to see if that helps
        const altQuery = {
          'location.district': new RegExp(decodedDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        };
        if (state) altQuery['location.state'] = new RegExp(state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const altResults = await Experience.find(altQuery).select('title location').limit(5).lean();
        console.log('Alternative query results:', altResults.length, altResults.map(exp => ({
          title: exp.title,
          district: exp.location?.district
        })));
      }
    } catch (dbError) {
      console.error('Database error fetching experiences:', dbError);
      throw dbError;
    }

    // Handle case where no experiences found
    if (!experiences || experiences.length === 0) {
      return res.json({ experiences: [] });
    }

    // Don't filter out experiences - show all experiences with availability status
    // Convert to plain objects
    const validExperiences = experiences
      .filter(exp => {
        // Only filter out if there's an actual error accessing the experience
        try {
          return exp && exp._id; // Just check if experience exists
        } catch (err) {
          console.error('Error checking experience:', err);
          return false;
        }
      })
      .map(exp => {
        // Convert to plain object if needed
        const expObj = exp.toObject ? exp.toObject() : (exp.toJSON ? exp.toJSON() : exp);
        return expObj;
      })
      .sort((a, b) => {
        // Sort by averageRating first, then by provider rating
        if (b.averageRating !== a.averageRating) {
          return b.averageRating - a.averageRating;
        }
        const aProviderRating = (a.provider && a.provider.rating) || 0;
        const bProviderRating = (b.provider && b.provider.rating) || 0;
        return bProviderRating - aProviderRating;
      });

    // Get reviews for each experience
    const experiencesWithReviews = await Promise.all(
      validExperiences.map(async (exp) => {
        try {
          const reviews = await Review.find({ experience: exp._id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(3)
            .lean();
          
              // Ensure provider structure is consistent
              // Handle null providers gracefully
              let providerInfo = {
                name: 'Unknown',
                rating: 0
              };
              
              if (exp.provider) {
                if (typeof exp.provider === 'object' && exp.provider.name) {
                  providerInfo = {
                    name: exp.provider.name || 'Unknown',
                    rating: exp.provider.rating || 0
                  };
                } else if (typeof exp.provider === 'string') {
                  // Provider is just an ID, fetch it
                  try {
                    const Host = require('../models/Host');
                    const provider = await Host.findById(exp.provider).select('name rating').lean();
                    if (provider) {
                      providerInfo = {
                        name: provider.name || 'Unknown',
                        rating: provider.rating || 0
                      };
                    }
                  } catch (err) {
                    console.error('Error fetching provider:', err);
                  }
                }
              }
              
              // Check availability for selected dates if provided
              let availabilityStatus = {
                available: true,
                reason: null
              };
              
              if (from && to) {
                const isSchedulable = canExperienceBeScheduledForTrip(exp, from, to, 1);
                availabilityStatus = {
                  available: isSchedulable,
                  reason: isSchedulable ? null : 'Not available for selected dates'
                };
              }
              
              const experienceObj = {
                ...exp,
                provider: providerInfo,
                recentReviews: reviews || [],
                availabilityStatus
              };
          
          return experienceObj;
        } catch (err) {
          console.error(`Error fetching reviews for experience ${exp._id}:`, err);
          // If review fetch fails, return experience without reviews
          // Check availability for selected dates if provided
          let availabilityStatus = {
            available: true,
            reason: null
          };
          
          if (from && to) {
            const isSchedulable = canExperienceBeScheduledForTrip(exp, from, to, 1);
            availabilityStatus = {
              available: isSchedulable,
              reason: isSchedulable ? null : 'Not available for selected dates'
            };
          }
          
          return {
            ...exp,
            provider: exp.provider ? {
              name: exp.provider.name || 'Unknown',
              rating: exp.provider.rating || 0
            } : {
              name: 'Unknown',
              rating: 0
            },
            recentReviews: [],
            availabilityStatus
          };
        }
      })
    );

    res.json({ 
      experiences: experiencesWithReviews,
      totalAvailable: experiencesWithReviews.length,
      aiFiltered: false
    });
  } catch (error) {
    console.error('Error fetching experiences:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Revolutionary AI-Powered Experience Filtering
// Filters hundreds of experiences to top 2-3 based on comprehensive user profile
router.get('/experiences/:district/ai-filtered', authenticate, requireUser, async (req, res) => {
  try {
    const { district } = req.params;
    const { country, state, from, to } = req.query;
    const userId = req.user._id;

    const decodedDistrict = decodeURIComponent(district).trim();
    if (!decodedDistrict) {
      return res.status(400).json({ message: 'District parameter is required' });
    }

    // Build query similar to regular endpoint
    const query = {
      'location.district': { 
        $regex: new RegExp(`^${decodedDistrict.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      }
    };
    
    if (country) {
      query['location.country'] = { 
        $regex: new RegExp(`^${country.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      };
    }
    
    if (state) {
      query['location.state'] = { 
        $regex: new RegExp(`^${state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')
      };
    }

    // Add date filtering if provided
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      query.availableDates = {
        $elemMatch: {
          date: { $gte: fromDate, $lte: toDate },
          available: true
        }
      };
    }

    // Fetch all experiences
    let allExperiences = await Experience.find(query)
      .populate('provider', 'name rating')
      .sort({ _id: 1 }) // Consistent sorting for deterministic AI results
      .lean();

    if (allExperiences.length === 0) {
      return res.json({ 
        experiences: [],
        aiFiltered: true,
        message: 'No experiences found for this location'
      });
    }

    // Use AI agent to filter to top 2-3
    const filteredExperiences = await filterExperiencesAI(userId, allExperiences, {
      location: { district: decodedDistrict, state, country },
      dateRange: from && to ? { from, to } : null
    });

    // Get reviews for filtered experiences
    const experiencesWithReviews = await Promise.all(
      filteredExperiences.map(async (exp) => {
        const reviews = await Review.find({ experience: exp._id })
          .populate('user', 'name email')
          .sort({ createdAt: -1 })
          .limit(3)
          .lean();
        
        // Check availability for selected dates if provided
        let availabilityStatus = {
          available: true,
          reason: null
        };
        
        if (from && to) {
          const isSchedulable = canExperienceBeScheduledForTrip(exp, from, to, 1);
          availabilityStatus = {
            available: isSchedulable,
            reason: isSchedulable ? null : 'Not available for selected dates'
          };
        }
        
        return {
          ...exp,
          recentReviews: reviews,
          provider: exp.provider ? {
            name: exp.provider.name || 'Unknown',
            rating: exp.provider.rating || 0
          } : {
            name: 'Unknown',
            rating: 0
          },
          availabilityStatus
        };
      })
    );

    res.json({
      experiences: experiencesWithReviews,
      aiFiltered: true,
      totalAvailable: allExperiences.length,
      filteredTo: experiencesWithReviews.length,
      insights: filteredExperiences[0]?.aiInsights || 'AI-selected experiences based on your travel profile'
    });
  } catch (error) {
    console.error('Error in AI filtering:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Create trip schedule
router.post('/schedule', authenticate, requireUser, async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      country,
      state,
      district,
      locations, // Array of {state, district} for multi-city trips
      guideId
    } = req.body;

    if (!fromDate || !toDate || !country) {
      return res.status(400).json({ message: 'Travel dates and country are required' });
    }

    // Handle multiple locations or single location
    const tripLocations = locations && Array.isArray(locations) && locations.length > 0
      ? locations
      : [{ state, district }].filter(loc => loc.state && loc.district);

    if (tripLocations.length === 0) {
      return res.status(400).json({ message: 'At least one location (state and district) is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user.preferences || !user.preferences.travelStyle) {
      return res.status(400).json({ message: 'Please complete KYT questionnaire first' });
    }

    // Check if user has tokens
    if (!user.tokens || user.tokens < 1) {
      return res.status(400).json({ 
        message: 'Insufficient tokens. You need at least 1 token to schedule a trip. Complete a trip to earn more tokens!' 
      });
    }

    // Get experiences from user's bucketlist
    const experienceIds = user.bucketlist.map(id => id.toString());

    if (experienceIds.length === 0) {
      return res.status(400).json({ message: 'Bucketlist is empty. Add experiences first.' });
    }

    // Schedule trip using AI-powered scheduler (Gumo.ai-like)
    let scheduleResult;
    try {
      scheduleResult = await scheduleTripWithAI({
        experienceIds,
        fromDate,
        toDate,
        preferences: user.preferences,
        country,
        state: tripLocations[0]?.state || state,
        district: tripLocations[0]?.district || district,
        locations: tripLocations, // Pass locations array
        guideId
      });
    } catch (scheduleError) {
      console.error('Scheduler error:', scheduleError);
      return res.status(400).json({ 
        message: scheduleError.message || 'Failed to create schedule',
        error: scheduleError.message 
      });
    }
    
    const { schedule, totalPrice, selectedExperiencesCount, availableHotels, mapData } = scheduleResult;

    // Create trip
    const trip = new Trip({
      user: user._id,
      fromDate,
      toDate,
      country,
      state: tripLocations[0]?.state || state, // Keep first state for backward compatibility
      district: tripLocations[0]?.district || district, // Keep first district for backward compatibility
      locations: tripLocations, // Store all locations
      preferences: user.preferences,
      schedule,
      totalPrice
    });

    await trip.save();

    // Add trip to user bookings, clear bucketlist, and deduct 1 token using atomic update
    // This prevents VersionError when concurrent requests modify the user document
    // Ensure tokens never go below 0
    const currentTokens = user.tokens || 0;
    const newTokenCount = Math.max(currentTokens - 1, 0); // Ensure never goes below 0
    
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $push: { bookings: trip._id },
        $set: { 
          bucketlist: [],
          tokens: newTokenCount // Set to new count (never below 0)
        }
      },
      { new: true, runValidators: true }
    );

    // Log schedule for debugging
    console.log('Schedule being returned:', JSON.stringify(schedule, null, 2));
    console.log('First day activities:', schedule[0]?.activities);
    
    res.json({
      message: 'Trip scheduled successfully',
      tripId: trip._id,
      schedule,
      totalPrice,
      selectedExperiencesCount,
      availableHotels: availableHotels || [],
      mapData: mapData || null,
      aiInsights: scheduleResult.aiInsights || [],
      optimizationScore: scheduleResult.optimizationScore || null,
      // Include trip basic information
      fromDate,
      toDate,
      country,
      state: tripLocations[0]?.state || state,
      district: tripLocations[0]?.district || district,
      locations: tripLocations,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Schedule creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update trip hotels and chauffeur options
router.put('/:tripId/hotels', authenticate, requireUser, async (req, res) => {
  try {
    const { hotels, chauffeur, assignedDriverId } = req.body;
    const trip = await Trip.findById(req.params.tripId);
    const DriverProvider = require('../models/DriverProvider');
    const Provider = require('../models/Provider');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify trip belongs to user
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update hotels for each day
    trip.schedule.forEach((day, idx) => {
      if (hotels[idx]) {
        day.hotel = hotels[idx];
        day.hotelSelected = true;
      }
      if (chauffeur && chauffeur[idx]) {
        day.chauffeur = true;
      }
    });

    // Assign driver if provided and chauffeur is selected
    if (assignedDriverId && chauffeur && Object.values(chauffeur).some(v => v === true)) {
      const driver = await Provider.findById(assignedDriverId);
      if (driver && driver.providerType === 'DRIVER_PARTNER') {
        const driverProfile = await DriverProvider.findOne({ providerId: assignedDriverId });
        if (driverProfile) {
          trip.assignedDriver = assignedDriverId;
          trip.assignedDriverProfile = driverProfile._id;
        }
      }
    }

    // Recalculate total price
    let totalPrice = 0;
    for (const day of trip.schedule) {
      // Add activity prices
      day.activities.forEach(activity => {
        totalPrice += activity.price || 0;
      });
      
      // Add hotel price
      if (day.hotel && day.hotelSelected) {
        const hotel = await Hotel.findById(day.hotel);
        if (hotel) {
          totalPrice += hotel.pricePerNight;
        }
      }
      
      // Add chauffeur cost
      if (day.chauffeur) {
        totalPrice += 50; // $50 per day for chauffeur
      }
    }
    
    trip.totalPrice = totalPrice;
    await trip.save();

    // Get trip without populating activities.experienceId (to preserve activity data)
    const tripData = await Trip.findById(trip._id)
      .populate('schedule.hotel')
      .populate('schedule.guide');
    
    // Convert to JSON and ensure activities have the correct structure
    const tripObj = tripData.toObject();
    
    res.json({ 
      trip: tripObj,
      totalPrice: trip.totalPrice
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fund wallet (must be before /:tripId routes to avoid route conflicts)
router.post('/wallet/fund', authenticate, requireUser, async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);

    // Convert to user's wallet currency
    const convertedAmount = await convertCurrency(
      amount,
      currency || 'USD',
      user.tripWallet.currency
    );

    user.tripWallet.balance += convertedAmount;
    if (currency) {
      user.tripWallet.currency = currency;
    }
    await user.save();

    res.json({
      message: 'Wallet funded',
      balance: user.tripWallet.balance,
      currency: user.tripWallet.currency
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pay for trip
router.post('/:tripId/pay', authenticate, requireUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('user');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    if (trip.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (trip.paymentStatus === 'Completed') {
      return res.status(400).json({ message: 'Trip already paid' });
    }

    const user = await User.findById(req.user._id);

    // Convert trip price to user's wallet currency
    const priceInWalletCurrency = await convertCurrency(
      trip.totalPrice,
      'USD', // Assuming trips are stored in USD
      user.tripWallet.currency
    );

    if (user.tripWallet.balance < priceInWalletCurrency) {
      return res.status(400).json({
        message: 'Insufficient balance',
        required: priceInWalletCurrency,
        available: user.tripWallet.balance
      });
    }

    // Process payment
    user.tripWallet.balance -= priceInWalletCurrency;
    trip.paymentStatus = 'Completed';
    
    // Add 2 tokens when payment is completed (trip completed)
    user.tokens = (user.tokens || 0) + 2;
    
    await user.save();
    
    // Validate trip schedule before generating tickets
    if (!trip.schedule || !Array.isArray(trip.schedule) || trip.schedule.length === 0) {
      console.error(`❌ Trip ${trip._id} has no schedule`);
      return res.status(400).json({ 
        message: 'Cannot generate tickets: Trip has no schedule',
        ticketsGenerated: 0,
        errors: ['Trip schedule is empty']
      });
    }
    
    // Count total activities for logging
    let totalActivities = 0;
    let activitiesWithExperienceId = 0;
    for (const day of trip.schedule) {
      if (day.activities && Array.isArray(day.activities)) {
        totalActivities += day.activities.length;
        activitiesWithExperienceId += day.activities.filter(a => a.experienceId).length;
      }
    }
    
    console.log(`📋 Processing payment for trip ${trip._id}:`);
    console.log(`   - Schedule days: ${trip.schedule.length}`);
    console.log(`   - Total activities: ${totalActivities}`);
    console.log(`   - Activities with experienceId: ${activitiesWithExperienceId}`);
    
    if (totalActivities === 0) {
      console.error(`❌ Trip ${trip._id} has no activities in schedule`);
      return res.status(400).json({ 
        message: 'Cannot generate tickets: Trip schedule has no activities',
        ticketsGenerated: 0,
        errors: ['Trip schedule contains no activities']
      });
    }
    
    if (activitiesWithExperienceId === 0) {
      console.error(`❌ Trip ${trip._id} has activities but none have experienceId`);
      return res.status(400).json({ 
        message: 'Cannot generate tickets: Activities missing experience IDs',
        ticketsGenerated: 0,
        errors: ['Activities in schedule are missing experience IDs']
      });
    }
    
    // Generate tickets for all experiences in the schedule
    const tickets = [];
    const ticketErrors = [];
    let processedActivities = 0;
    let skippedActivities = 0;
    
    for (const day of trip.schedule) {
      if (!day.activities || !Array.isArray(day.activities)) {
        console.log(`⚠️ Skipping day ${day.date}: no activities array`);
        continue;
      }
      
      console.log(`📅 Processing day ${day.date}: ${day.activities.length} activities`);
      
      for (const activity of day.activities) {
        processedActivities++;
        
        if (!activity.experienceId) {
          skippedActivities++;
          console.warn(`⚠️ Skipping activity "${activity.title || 'Untitled'}": no experienceId`);
          ticketErrors.push(`Activity "${activity.title || 'Untitled'}" skipped: missing experienceId`);
          continue;
        }
        
        console.log(`   Processing activity: ${activity.title || activity.experienceId} (experienceId: ${activity.experienceId})`);
        
        try {
          // Fetch experience details for snapshot
          const experience = await Experience.findById(activity.experienceId)
            .populate('provider', 'name _id');
          
          if (!experience) {
            skippedActivities++;
            console.error(`❌ Experience ${activity.experienceId} not found in database`);
            ticketErrors.push(`Experience "${activity.title || activity.experienceId}" (ID: ${activity.experienceId}) not found in database`);
            continue;
          }
          
          // Get provider ID (handle both populated and non-populated cases)
          // Priority: experience.provider > experience document > activity.provider
          let providerId = null;
          
          // Helper function to extract valid provider ID
          const extractProviderId = (provider) => {
            if (!provider) return null;
            
            // If it's a string, assume it's an ID
            if (typeof provider === 'string') {
              return provider;
            }
            
            // If it's an object, extract _id
            if (typeof provider === 'object') {
              // Check if _id exists and is not null
              if (provider._id && provider._id !== null) {
                // If _id is an object (ObjectId), convert to string
                return typeof provider._id === 'object' ? provider._id.toString() : provider._id;
              }
              // If _id is null or missing, this provider is invalid
              return null;
            }
            
            return null;
          };
          
          // First, try from experience (most reliable source)
          if (experience.provider) {
            providerId = extractProviderId(experience.provider);
          }
          
          // If not found, try from experience document directly
          if (!providerId) {
            const experienceDoc = await Experience.findById(activity.experienceId).select('provider').lean();
            if (experienceDoc && experienceDoc.provider) {
              providerId = extractProviderId(experienceDoc.provider);
            }
          }
          
          // Last resort: try from activity (but only if it has a valid _id)
          if (!providerId && activity.provider) {
            const activityProviderId = extractProviderId(activity.provider);
            // Only use if it's valid (not null)
            if (activityProviderId) {
              providerId = activityProviderId;
            }
          }
          
          if (!providerId) {
            skippedActivities++;
            console.error(`❌ No valid provider found for experience ${activity.experienceId} (${experience.title || 'Untitled'})`);
            console.error(`   Activity provider:`, activity.provider);
            console.error(`   Experience provider:`, experience.provider);
            ticketErrors.push(`No valid provider found for experience: "${activity.title || experience.title || activity.experienceId}"`);
            continue;
          }
          
          // Ensure providerId is a valid ObjectId string
          const providerIdStr = providerId.toString();
          
          // Validate it's a valid MongoDB ObjectId format
          if (!/^[0-9a-fA-F]{24}$/.test(providerIdStr)) {
            skippedActivities++;
            console.error(`❌ Invalid provider ID format: ${providerIdStr} for experience ${activity.experienceId}`);
            ticketErrors.push(`Invalid provider ID format for experience: "${activity.title || experience.title || activity.experienceId}"`);
            continue;
          }
          
          // Verify provider exists
          const providerExists = await Provider.findById(providerIdStr);
          if (!providerExists) {
            skippedActivities++;
            console.error(`❌ Provider ${providerIdStr} does not exist in database`);
            ticketErrors.push(`Provider ${providerIdStr} does not exist for experience: "${activity.title || experience.title || activity.experienceId}"`);
            continue;
          }
          
          // Create ticket
          const ticket = new Ticket({
            user: user._id,
            trip: trip._id,
            experience: activity.experienceId,
            provider: providerIdStr,
            experienceDetails: {
              title: activity.title || experience.title || 'Untitled Experience',
              price: activity.price || experience.price || 0,
              duration: activity.duration || experience.duration || 2,
              location: {
                district: experience.location?.district || trip.district || 'Unknown',
                state: experience.location?.state || trip.state || 'Unknown',
                country: experience.location?.country || trip.country || 'Unknown'
              }
            },
            scheduledDate: day.date,
            startTime: activity.startTime || '09:00',
            endTime: activity.endTime || '17:00',
            status: 'active'
          });
          
          // Generate QR code
          ticket.qrCode = ticket.generateQRCode();
          
          // Save ticket and ensure it's persisted
          await ticket.save();
          
          // Verify ticket was saved
          const savedTicket = await Ticket.findById(ticket._id);
          if (!savedTicket) {
            throw new Error(`Failed to save ticket ${ticket.ticketId}`);
          }
          
          tickets.push(ticket);
          
          console.log(`✅ Ticket created and saved: ${ticket.ticketId} for experience: ${ticket.experienceDetails.title} (User: ${user._id}, Provider: ${providerIdStr})`);
        } catch (ticketError) {
          console.error(`❌ Error creating ticket for experience ${activity.experienceId}:`, ticketError);
          console.error('Error details:', {
            message: ticketError.message,
            stack: ticketError.stack,
            activity: activity
          });
          ticketErrors.push(`Failed to create ticket: ${ticketError.message}`);
        }
      }
    }
    
    // Log ticket creation summary
    console.log(`\n📝 Ticket creation summary for trip ${trip._id}:`);
    console.log(`   ✅ Tickets created: ${tickets.length}`);
    console.log(`   ⚠️  Activities processed: ${processedActivities}`);
    console.log(`   ⏭️  Activities skipped: ${skippedActivities}`);
    console.log(`   ❌ Errors: ${ticketErrors.length}`);
    
    if (ticketErrors.length > 0) {
      console.warn('   Error details:');
      ticketErrors.forEach((error, idx) => {
        console.warn(`   ${idx + 1}. ${error}`);
      });
    }
    
    if (tickets.length === 0) {
      console.error(`\n❌ WARNING: No tickets were created for trip ${trip._id}`);
      console.error(`   This may indicate a problem with the trip schedule or experience data.`);
    }
    
    await trip.save();

    // Build response message
    let responseMessage = 'Payment successful';
    if (tickets.length > 0) {
      responseMessage += `. ${tickets.length} ticket(s) generated.`;
    } else {
      responseMessage += ', but no tickets were generated.';
    }

    res.json({
      message: responseMessage,
      remainingBalance: user.tripWallet.balance,
      tokens: user.tokens,
      ticketsGenerated: tickets.length,
      ticketIds: tickets.map(t => t.ticketId),
      errors: ticketErrors.length > 0 ? ticketErrors : undefined,
      warnings: tickets.length === 0 ? ['No tickets were generated. Please check trip schedule and experience data.'] : undefined
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear all activities from trip schedule
router.put('/:tripId/clear-activities', authenticate, requireUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user owns this trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Clear all activities from all days
    trip.schedule.forEach((day) => {
      day.activities = [];
    });

    // Recalculate total price (only hotels and chauffeur costs remain)
    let totalPrice = 0;
    for (const day of trip.schedule) {
      // Add hotel price
      if (day.hotel && day.hotelSelected) {
        const hotel = await Hotel.findById(day.hotel);
        if (hotel) {
          totalPrice += hotel.pricePerNight;
        }
      }
      
      // Add chauffeur cost
      if (day.chauffeur) {
        totalPrice += 50; // $50 per day for chauffeur
      }
    }
    
    trip.totalPrice = totalPrice;
    await trip.save();

    // Get updated trip
    const tripData = await Trip.findById(trip._id)
      .populate('schedule.hotel')
      .populate('schedule.guide');
    
    const tripObj = tripData.toObject();
    
    res.json({ 
      trip: tripObj,
      totalPrice: trip.totalPrice,
      message: 'All activities cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing activities:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete all trips for the authenticated user
router.delete('/all', authenticate, requireUser, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get all trip IDs for this user
    const tripIds = user.bookings || [];
    
    if (tripIds.length === 0) {
      return res.json({ 
        message: 'No trips to delete',
        deletedCount: 0
      });
    }

    // Delete all trips
    await Trip.deleteMany({ _id: { $in: tripIds } });

    // Clear bookings array from user
    user.bookings = [];
    await user.save();

    res.json({
      message: `Successfully deleted ${tripIds.length} trip${tripIds.length === 1 ? '' : 's'}`,
      deletedCount: tripIds.length
    });
  } catch (error) {
    console.error('Error deleting all trips:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete trip (must come before GET /:tripId to avoid route conflicts)
router.delete('/:tripId', authenticate, requireUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user owns this trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove trip from user's bookings array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { bookings: trip._id } },
      { new: true }
    );

    // Delete the trip
    await Trip.findByIdAndDelete(req.params.tripId);

    res.json({
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single trip
router.get('/:tripId', authenticate, requireUser, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId)
      .populate('schedule.hotel')
      .populate('schedule.guide')
      .populate({
        path: 'schedule.activities.experienceId',
        select: 'title description price imageUrl contentUrl duration location provider culturalMetadata tags averageRating reviewCount',
        populate: {
          path: 'provider',
          select: 'name rating'
        }
      });

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if user owns this trip
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ trip });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get intelligent recommendations for free days
router.post('/recommendations', authenticate, requireUser, async (req, res) => {
  try {
    const { tripId, dayIndex, date, location, preferences, scheduledExperienceIds } = req.body;

    if (!tripId || dayIndex === undefined || !date) {
      return res.status(400).json({ message: 'Trip ID, day index, and date are required' });
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Verify trip belongs to user
    if (trip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get location for recommendations
    const targetLocation = location || {
      country: trip.country,
      state: trip.locations?.[0]?.state || trip.state,
      district: trip.locations?.[0]?.district || trip.district
    };

    const userPreferences = preferences || trip.preferences || {};

    // Build intelligent recommendation query
    const query = {
      'location.country': targetLocation.country,
      'location.state': targetLocation.state,
      'location.district': targetLocation.district
    };

    // Exclude already scheduled experiences
    if (scheduledExperienceIds && scheduledExperienceIds.length > 0) {
      const mongoose = require('mongoose');
      query._id = { $nin: scheduledExperienceIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    // Try AI-powered recommendations first
    const aiRecommendations = await getAIRecommendations({
      tripId,
      dayIndex,
      date,
      location: targetLocation,
      preferences: userPreferences,
      scheduledExperienceIds,
      existingSchedule: trip.schedule
    });

    if (aiRecommendations && aiRecommendations.length > 0) {
      return res.json({
        recommendations: aiRecommendations,
        dayIndex,
        date,
        source: 'ai'
      });
    }

    // Fallback to rule-based recommendations
    let recommendedExperiences = await Experience.find(query)
      .populate('provider', 'name rating')
      .limit(30);

    // Get reviews for popularity scoring
    const Review = require('../models/Review');
    const experienceIds = recommendedExperiences.map(exp => exp._id);
    const reviews = await Review.find({ experience: { $in: experienceIds } });
    
    // Calculate average ratings and review counts
    const experienceStats = {};
    reviews.forEach((review) => {
      const expId = review.experience.toString();
      if (!experienceStats[expId]) {
        experienceStats[expId] = { rating: 0, count: 0 };
      }
      experienceStats[expId].rating += review.rating;
      experienceStats[expId].count += 1;
    });
    
    Object.keys(experienceStats).forEach(expId => {
      experienceStats[expId].rating /= experienceStats[expId].count;
    });

    // Intelligent scoring and ranking
    const scoredExperiences = recommendedExperiences.map(exp => {
      let score = 0;
      const reasons = [];
      const expId = exp._id.toString();
      const stats = experienceStats[expId] || { rating: 0, count: 0 };

      // 1. Location match (already filtered, but boost same district)
      if (exp.location.district === targetLocation.district) {
        score += 10;
        reasons.push('Same location');
      }

      // 2. Availability on the date
      const dateStr = new Date(date).toISOString().split('T')[0];
      const isAvailable = !exp.availableDates || exp.availableDates.length === 0 || 
        exp.availableDates.some((avail) => {
          let availDate;
          if (avail instanceof Date) {
            availDate = avail;
          } else if (avail && typeof avail === 'object' && avail.date) {
            availDate = new Date(avail.date);
          } else {
            return false;
          }
          return availDate.toISOString().split('T')[0] === dateStr;
        });
      
      if (isAvailable) {
        score += 15;
        reasons.push('Available on this date');
      }

      // 3. Provider rating (higher rating = higher score)
      if (exp.provider && exp.provider.rating) {
        score += exp.provider.rating * 3;
        reasons.push(`Highly rated host (${exp.provider.rating.toFixed(1)})`);
      }

      // 4. Review-based popularity
      if (stats.count > 0) {
        score += stats.rating * 2;
        score += Math.min(stats.count, 10); // Cap review count boost at 10
        if (stats.rating >= 4.5) {
          reasons.push(`Highly reviewed (${stats.rating.toFixed(1)}⭐)`);
        }
      }

      // 5. Price compatibility with preferences
      if (userPreferences.travelStyle === 'luxury' && exp.price > 100) {
        score += 5;
        reasons.push('Premium experience');
      } else if (userPreferences.travelStyle !== 'luxury' && exp.price < 50) {
        score += 5;
        reasons.push('Budget-friendly');
      }

      // 6. Duration compatibility with pace
      if (userPreferences.pace === 'fast' && exp.duration <= 3) {
        score += 5;
        reasons.push('Quick activity');
      } else if (userPreferences.pace === 'slow' && exp.duration >= 4) {
        score += 5;
        reasons.push('Extended experience');
      }

      // 7. Complement existing activities (different type/theme)
      // This would require experience categories/tags - for now, use price diversity
      const avgPrice = trip.totalPrice / (trip.schedule?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 1);
      if (Math.abs(exp.price - avgPrice) < 20) {
        score += 3;
        reasons.push('Fits your budget');
      }

      return {
        experience: exp,
        score,
        reasons
      };
    });

    // Sort by score and take top recommendations
    const topRecommendations = scoredExperiences
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => ({
        _id: item.experience._id,
        title: item.experience.title,
        description: item.experience.description,
        price: item.experience.price,
        duration: item.experience.duration,
        imageUrl: item.experience.imageUrl,
        location: item.experience.location,
        provider: item.experience.provider ? {
          _id: item.experience.provider._id,
          name: item.experience.provider.name,
          rating: item.experience.provider.rating || 0
        } : null,
        availableDates: item.experience.availableDates,
        score: item.score,
        reasons: item.reasons.slice(0, 2) // Top 2 reasons
      }));

    res.json({
      recommendations: topRecommendations,
      dayIndex,
      date,
      source: 'rule-based'
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Revolutionary Cultural Matching Engine Endpoint
// Discovers authentic regional experiences based on cultural patterns
router.get('/cultural-discovery/:state', authenticate, requireUser, async (req, res) => {
  try {
    const { state } = req.params;
    const { district, region } = req.query;
    const userId = req.user._id;

    if (!state) {
      return res.status(400).json({ message: 'State parameter is required' });
    }

    // Match user to cultural experiences
    const culturalMatch = await matchUserToCulturalExperiences(
      userId,
      region || state,
      state,
      district || null
    );

    res.json({
      success: true,
      ...culturalMatch,
      seasonalRecommendations: getSeasonalCulturalRecommendations(state)
    });
  } catch (error) {
    console.error('Error in cultural discovery:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

