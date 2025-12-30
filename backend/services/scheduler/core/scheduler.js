/**
 * Core Scheduler
 * Main orchestrator for trip scheduling
 */

const Experience = require('../../../models/Experience');
const Hotel = require('../../../models/Hotel');
const Host = require('../../../models/Host');
const { getCoordinates, getDistrictCoordinates } = require('./utils');
const { filterExperiencesByDateRange } = require('../availability/availabilityService');
const { groupExperiencesByLocation, findOptimalLocationOrder, createLocationClusters } = require('../optimization/locationOptimizer');
const { planDay, selectHotelForDay } = require('./dayPlanner');
const { validateSchedule } = require('../validation/scheduleValidator');

/**
 * Generate trip dates array
 */
function generateTripDates(fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const dates = [];
  let currentDate = new Date(from);
  
  while (currentDate <= to) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Fetch and validate experiences
 */
async function fetchExperiences(experienceIds, tripLocations, country) {
  const mongoose = require('mongoose');
  
  // Build query for experiences across all locations
  const locationQueries = tripLocations.map(loc => ({
    'location.country': country,
    'location.state': loc.state,
    'location.district': loc.district
  }));

  // Validate experience IDs
  const validExperienceIds = experienceIds.filter(id => {
    try {
      return mongoose.Types.ObjectId.isValid(id);
    } catch (e) {
      return false;
    }
  });

  if (validExperienceIds.length === 0) {
    throw new Error('No valid experience IDs found in bucketlist');
  }

  // Fetch experiences with their providers from all locations
  const experiences = await Experience.find({
    _id: { $in: validExperienceIds },
    $or: locationQueries
  }).populate('provider');

  if (experiences.length === 0) {
    throw new Error('No experiences available for selected location');
  }

  return experiences;
}

/**
 * Fetch hotels based on preferences
 */
async function fetchHotels(tripLocations, country, preferences) {
  if (preferences.travelStyle === 'flexible') {
    return await Hotel.find({
      'location.country': country,
      'location.state': { $in: tripLocations.map(loc => loc.state) },
      'location.district': { $in: tripLocations.map(loc => loc.district) },
      roomsAvailable: { $gt: 0 }
    }).sort({ rating: -1 });
  } else if (preferences.travelStyle === 'fixed') {
    return await Hotel.find({
      'location.country': country,
      'location.state': { $in: tripLocations.map(loc => loc.state) },
      'location.district': { $in: tripLocations.map(loc => loc.district) },
      roomsAvailable: { $gt: 0 }
    }).sort({ pricePerNight: 1 }).limit(5);
  }
  
  return [];
}

/**
 * Check guide availability
 */
async function checkGuideAvailability(guideId, fromDate, toDate) {
  if (!guideId) return null;
  
  const guide = await Host.findOne({
    _id: guideId,
    role: 'Guide'
  });
  
  if (!guide) return null;
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  // Verify guide availability for the trip dates
  const guideAvailable = guide.availability?.some(avail => {
    const availDate = new Date(avail.date);
    return availDate >= from && availDate <= to && avail.available !== false;
  });
  
  if (!guideAvailable) {
    return null; // Guide not available for these dates
  }
  
  return guide;
}

/**
 * Build map data for schedule
 */
function buildMapData(schedule, hotels, orderedLocations) {
  const mapData = {
    route: [],
    waypoints: [],
    bounds: null
  };
  
  // Extract all waypoints (activities and hotels) with coordinates
  const waypoints = [];
  schedule.forEach((day, dayIdx) => {
    day.activities.forEach((activity, actIdx) => {
      const coordinates = getCoordinates(activity.location);
      if (coordinates) {
        waypoints.push({
          type: 'activity',
          day: dayIdx + 1,
          index: actIdx,
          title: activity.title,
          coordinates: coordinates,
          location: `${activity.location?.district || 'Unknown'}, ${activity.location?.state || 'Unknown'}`,
          time: activity.startTime
        });
      }
    });
    
    // Add hotel waypoint if available
    if (day.hotel) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (hotel) {
        const coordinates = getCoordinates(hotel.location);
        if (coordinates) {
          waypoints.push({
            type: 'hotel',
            day: dayIdx + 1,
            name: hotel.name,
            coordinates: coordinates,
            location: `${hotel.location?.district || 'Unknown'}, ${hotel.location?.state || 'Unknown'}`
          });
        }
      }
    }
  });
  
  // Calculate map bounds
  if (waypoints.length > 0) {
    const lats = waypoints.map(w => w.coordinates.lat).filter(lat => lat !== null && lat !== undefined);
    const lngs = waypoints.map(w => w.coordinates.lng).filter(lng => lng !== null && lng !== undefined);
    
    if (lats.length > 0 && lngs.length > 0) {
      mapData.bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
    }
  }
  
  mapData.waypoints = waypoints;
  mapData.route = orderedLocations.map(loc => ({
    district: loc.district,
    state: loc.state,
    coordinates: loc.coordinates || null
  }));
  
  return mapData;
}

/**
 * Calculate total price for schedule
 */
function calculateTotalPrice(schedule, hotels, guide, preferences) {
  let totalPrice = 0;

  // Add experience prices
  schedule.forEach(day => {
    day.activities.forEach(activity => {
      totalPrice += activity.price || 0;
    });
  });

  // Add hotel prices (for each night stay)
  schedule.forEach((day) => {
    if (day.hotel && hotels.length > 0) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (hotel) {
        totalPrice += hotel.pricePerNight;
      }
    }
  });

  // Add guide price (if selected)
  if (guide) {
    totalPrice += 50 * schedule.length; // $50 per day for guide
  }

  // Add cab cost (if luxury transport)
  if (preferences.transport === 'luxury') {
    totalPrice += 30 * schedule.length; // $30 per day for cabs
  }

  return Math.round(totalPrice * 100) / 100;
}

/**
 * Main scheduling function
 */
async function scheduleTrip({
  experienceIds,
  fromDate,
  toDate,
  preferences,
  country,
  state,
  district,
  locations,
  guideId = null
}) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // Normalize locations
  const tripLocations = locations && Array.isArray(locations) && locations.length > 0
    ? locations
    : [{ state, district }].filter(loc => loc.state && loc.district);

  if (tripLocations.length === 0) {
    throw new Error('No valid locations provided');
  }
  
  console.log('Scheduler inputs:', {
    experienceIds: experienceIds.length,
    fromDate,
    toDate,
    days,
    locations: tripLocations.length
  });

  // Fetch experiences
  const experiences = await fetchExperiences(experienceIds, tripLocations, country);

  // Filter experiences available in date range
  let availableExperiences = filterExperiencesByDateRange(experiences, fromDate, toDate);

  // If no experiences match the date filter, still include all experiences from bucketlist
  if (availableExperiences.length === 0) {
    console.warn('No experiences match the date filter, but proceeding with all experiences from bucketlist');
    availableExperiences = experiences;
  }
  
  console.log(`Found ${availableExperiences.length} available experiences out of ${experiences.length} total`);
  
  const experiencesToSchedule = availableExperiences.length > 0 ? availableExperiences : experiences;

  if (experiencesToSchedule.length === 0) {
    throw new Error('No experiences found in bucketlist. Please add experiences first.');
  }

  // Group experiences by location
  const locationGroups = groupExperiencesByLocation(experiencesToSchedule);
  
  // Find optimal order to visit locations (async with Maps API if available)
  const orderedLocations = await findOptimalLocationOrder(locationGroups);
  
  // Determine experiences per day based on pace
  const experiencesPerDay = preferences.pace === 'fast' ? 3 : 2;
  
  // Determine max distance for clustering based on pace
  const maxClusterDistance = preferences.pace === 'fast' ? 10 : 15;
  
  // Cluster experiences within each location
  const locationClusters = createLocationClusters(orderedLocations, maxClusterDistance);

  // Fetch hotels
  const hotels = await fetchHotels(tripLocations, country, preferences);

  // Check guide availability
  const guide = await checkGuideAvailability(guideId, fromDate, toDate);

  // Build schedule day by day
  const schedule = [];
  const scheduledExperienceIds = new Set();
  const tripDates = generateTripDates(fromDate, toDate);
  
  // Check if we have insufficient experiences for the trip duration
  const { calculateDistributionStrategy, distributeExperiencesEvenly } = require('../features/experienceDistribution');
  const distributionStrategy = calculateDistributionStrategy(experiencesToSchedule.length, tripDates.length, preferences);
  
  let currentLocationIndex = 0;
  let currentLocation = orderedLocations[currentLocationIndex] || null;
  
  // If we have fewer experiences than days, use optimal distribution
  let useOptimalDistribution = false;
  if (distributionStrategy.hasInsufficientExperiences && distributionStrategy.recommendedStrategy !== 'normal') {
    useOptimalDistribution = true;
    console.log(`⚠️ Insufficient experiences: ${experiencesToSchedule.length} experiences for ${tripDates.length} days. Using optimal distribution.`);
  }
  
  tripDates.forEach((date, dayIndex) => {
    const dateStr = date.toISOString().split('T')[0];
    console.log(`\n=== Scheduling Day ${dayIndex + 1} (${dateStr}) ===`);
    
    // Plan day activities
    let dayPlan;
    
    // If using optimal distribution and we have fewer experiences, adjust experiencesPerDay
    if (useOptimalDistribution) {
      const remainingDays = tripDates.length - dayIndex;
      const remainingExperiences = experiencesToSchedule.length - scheduledExperienceIds.size;
      const adjustedPerDay = remainingDays > 0 
        ? Math.max(1, Math.ceil(remainingExperiences / remainingDays))
        : experiencesPerDay;
      
      dayPlan = planDay({
        date,
        dayIndex,
        currentLocation,
        currentLocationIndex,
        orderedLocations,
        locationClusters,
        experiencesPerDay: adjustedPerDay,
        preferences,
        scheduledExperienceIds,
        schedule
      });
    } else {
      dayPlan = planDay({
        date,
        dayIndex,
        currentLocation,
        currentLocationIndex,
        orderedLocations,
        locationClusters,
        experiencesPerDay,
        preferences,
        scheduledExperienceIds,
        schedule
      });
    }
    
    // Update location tracking
    currentLocationIndex = dayPlan.locationIndex;
    currentLocation = dayPlan.location;
    
    // Select hotel for this day
    const previousHotel = schedule.length > 0 ? schedule[schedule.length - 1].hotel : null;
    const hotel = selectHotelForDay(dayPlan.activities, dayIndex, hotels, preferences, previousHotel);
    
    console.log(`Day ${dayIndex + 1} summary: ${dayPlan.activities.length} activities scheduled`);
    
    // Add day to schedule
    schedule.push({
      date: new Date(date),
      activities: dayPlan.activities,
      hotel: hotel,
      guide: guide ? guide._id : null,
      cab: preferences.transport === 'luxury',
      foodOrders: []
    });
  });
  
  console.log(`\n=== Schedule Complete: ${schedule.length} days, ${schedule.reduce((sum, day) => sum + day.activities.length, 0)} total activities ===`);

  if (schedule.length === 0) {
    throw new Error('Could not create a schedule with available experiences and dates');
  }

  // Calculate total price
  const totalPrice = calculateTotalPrice(schedule, hotels, guide, preferences);

  // Build map data
  const mapData = buildMapData(schedule, hotels, orderedLocations);

  // Validate schedule
  const validation = validateSchedule(schedule, experiencesToSchedule, hotels, guide, preferences);
  
  // Add distribution warnings if applicable
  const { generateDistributionWarnings } = require('../features/experienceDistribution');
  const distributionWarnings = generateDistributionWarnings(
    distributionStrategy,
    experiencesToSchedule.length,
    tripDates.length
  );
  
  // Combine validation warnings with distribution warnings
  const allWarnings = [
    ...(validation.warnings || []),
    ...(distributionWarnings.warnings || [])
  ];
  
  const allSuggestions = [
    ...(validation.suggestions || []),
    ...(distributionWarnings.suggestions || [])
  ];
  
  // Identify empty days for recommendations
  const emptyDays = schedule
    .map((day, idx) => ({ day, dayIndex: idx }))
    .filter(({ day }) => !day.activities || day.activities.length === 0);

  return {
    schedule,
    totalPrice,
    selectedExperiencesCount: scheduledExperienceIds.size,
    availableHotels: hotels.map(h => ({
      _id: h._id,
      name: h.name,
      pricePerNight: h.pricePerNight,
      rating: h.rating,
      roomsAvailable: h.roomsAvailable,
      location: h.location,
      images: h.images || [], // Include images for hotel display
      description: h.description,
      amenities: h.amenities || [],
      policies: h.policies || {}
    })),
    mapData,
    validation: {
      valid: validation.valid,
      quality: validation.quality,
      warnings: allWarnings,
      suggestions: allSuggestions
    },
    distributionStrategy: {
      hasInsufficientExperiences: distributionStrategy.hasInsufficientExperiences,
      emptyDaysCount: emptyDays.length,
      emptyDays: emptyDays.map(({ day, dayIndex }) => ({
        dayIndex,
        date: day.date
      }))
    }
  };
}

module.exports = {
  scheduleTrip,
  generateTripDates,
  fetchExperiences,
  fetchHotels,
  checkGuideAvailability,
  buildMapData,
  calculateTotalPrice
};

