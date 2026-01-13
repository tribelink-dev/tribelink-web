/**
 * Driver Location Matching Service
 * Handles location-based driver finding and AI-powered matching
 */

const DriverProvider = require('../models/DriverProvider');
const Provider = require('../models/Provider');
const { filterDriversAI } = require('./aiAgent');

/**
 * Find available drivers in a specific location
 * @param {string} state - State name
 * @param {string} district - District name
 * @param {Date} fromDate - Trip start date
 * @param {Date} toDate - Trip end date
 * @returns {Promise<Array>} Array of available drivers
 */
async function findDriversByLocation(state, district, fromDate, toDate) {
  try {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Find drivers who service this location
    // Note: For now, include both verified and unverified drivers (can be filtered later)
    // Drivers with complete profiles (licenseNumber not 'PENDING_UPLOAD') are considered ready
    const driverProfiles = await DriverProvider.find({
      $or: [
        { 'serviceLocations.state': state, 'serviceLocations.district': district },
        // If no serviceLocations set, include all drivers (backward compatibility)
        { serviceLocations: { $exists: false } },
        { serviceLocations: { $size: 0 } }
      ],
      // Include drivers who have completed basic setup (not just pending)
      licenseNumber: { $ne: 'PENDING_UPLOAD' }
    }).populate('providerId', 'name email phoneNumber rating');
    
    console.log(`[Driver Matching] Found ${driverProfiles.length} drivers for ${district}, ${state}`, {
      state,
      district,
      fromDate: from.toISOString().split('T')[0],
      toDate: to.toISOString().split('T')[0]
    });

    const availableDrivers = [];

    // Check availability for each driver
    for (const profile of driverProfiles) {
      const tripDates = [];
      let currentDate = new Date(from);
      while (currentDate <= to) {
        tripDates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Debug logging
      const driverName = profile.providerId?.name || 'Unknown';
      const driverId = profile.providerId?._id || 'unknown';
      console.log(`[Driver Matching] Checking driver ${driverName} (${driverId}):`, {
        hasAvailability: !!profile.availability,
        availabilityCount: profile.availability?.length || 0,
        tripDates: tripDates.map(d => d.toISOString().split('T')[0]),
        availabilityEntries: profile.availability?.map(av => ({
          date: av.date instanceof Date ? av.date.toISOString().split('T')[0] : av.date,
          available: av.available
        })) || []
      });

      // Check if driver is available for all dates
      const isAvailable = tripDates.every(date => {
        // Normalize date to YYYY-MM-DD format for comparison (ignore time/timezone)
        const dateStr = date.toISOString().split('T')[0];
        
        const availability = profile.availability.find(avail => {
          if (!avail || !avail.date) return false;
          
          // Handle both Date objects and date strings
          let availDate;
          if (avail.date instanceof Date) {
            availDate = avail.date;
          } else if (typeof avail.date === 'string') {
            // If it's a string, parse it
            availDate = new Date(avail.date);
          } else {
            return false;
          }
          
          // Normalize to YYYY-MM-DD for comparison
          const availDateStr = availDate.toISOString().split('T')[0];
          return availDateStr === dateStr;
        });
        
        // If no availability entry, assume available (flexible)
        // If entry exists, check if available is true
        const result = !availability || availability.available !== false;
        
        if (!result) {
          console.log(`[Driver Matching] Driver ${driverName} not available on ${dateStr}`);
        }
        
        return result;
      });

      if (isAvailable && profile.providerId) {
        console.log(`[Driver Matching] Driver ${driverName} is available for all dates`);
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
          isVerified: profile.isVerified,
          serviceLocations: profile.serviceLocations || []
        });
      }
    }

    // Sort by rating (highest first)
    availableDrivers.sort((a, b) => b.rating - a.rating);

    console.log(`[Driver Matching] Returning ${availableDrivers.length} available drivers for ${district}, ${state}`);
    
    return availableDrivers;
  } catch (error) {
    console.error('Error finding drivers by location:', error);
    throw error;
  }
}

/**
 * Match best driver for a day based on activities
 * @param {Array} dayActivities - Activities scheduled for the day
 * @param {Date} date - Date of the day
 * @param {Array} availableDrivers - List of available drivers
 * @param {string} userId - User ID for AI matching
 * @returns {Promise<Object|null>} Best matching driver or null
 */
async function matchBestDriverForDay(dayActivities, date, availableDrivers, userId) {
  if (!dayActivities || dayActivities.length === 0 || availableDrivers.length === 0) {
    return null;
  }

  try {
    // Extract primary location from activities (activities have location stored directly)
    const primaryLocation = extractDayLocation(dayActivities);
    
    if (!primaryLocation) {
      // If no location in activity, return first available driver
      return availableDrivers[0] || null;
    }

    // Filter drivers by location if they have serviceLocations set
    let locationFilteredDrivers = availableDrivers;
    
    if (primaryLocation.state && primaryLocation.district) {
      // Prefer drivers who explicitly service this location
      const locationDrivers = availableDrivers.filter(driver => {
        if (!driver.serviceLocations || driver.serviceLocations.length === 0) {
          // If no serviceLocations set, include (backward compatibility)
          return true;
        }
        return driver.serviceLocations.some(loc => 
          loc.state === primaryLocation.state && 
          loc.district === primaryLocation.district
        );
      });

      // If we have location-specific drivers, use them; otherwise use all
      if (locationDrivers.length > 0) {
        locationFilteredDrivers = locationDrivers;
      }
    }

    // Use AI matching if userId provided
    if (userId && locationFilteredDrivers.length > 0) {
      try {
        const aiMatched = await filterDriversAI(userId, locationFilteredDrivers, {
          dateRange: { from: date, to: date },
          location: primaryLocation
        });
        
        if (aiMatched && aiMatched.length > 0) {
          return aiMatched[0];
        }
      } catch (error) {
        console.error('AI matching error, falling back to rule-based:', error);
      }
    }

    // Fallback: return highest rated driver
    return locationFilteredDrivers[0] || null;
  } catch (error) {
    console.error('Error matching driver for day:', error);
    return availableDrivers[0] || null;
  }
}

/**
 * Optimize multi-day assignment - prefer same driver for consecutive days
 * @param {Array} schedule - Trip schedule with daily activities
 * @param {Object} driverMap - Map of date -> available drivers
 * @param {string} userId - User ID for AI matching
 * @returns {Array} Schedule with optimized driver assignments
 */
async function optimizeMultiDayAssignment(schedule, driverMap, userId) {
  const assignments = [];
  let previousDriverId = null;

  for (let i = 0; i < schedule.length; i++) {
    const day = schedule[i];
    const date = new Date(day.date);
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip days without activities
    if (!day.activities || day.activities.length === 0) {
      assignments.push(null);
      continue;
    }

    const availableDrivers = driverMap[dateStr] || [];
    
    if (availableDrivers.length === 0) {
      assignments.push(null);
      continue;
    }

    // If previous driver is available for this day, prefer them
    if (previousDriverId) {
      const previousDriver = availableDrivers.find(d => d._id.toString() === previousDriverId.toString());
      if (previousDriver) {
        assignments.push(previousDriver);
        continue;
      }
    }

    // Otherwise, find best match for this day
    const bestDriver = await matchBestDriverForDay(day.activities, date, availableDrivers, userId);
    assignments.push(bestDriver);
    
    if (bestDriver) {
      previousDriverId = bestDriver._id;
    }
  }

  return assignments;
}

/**
 * Extract locations from day activities
 * @param {Array} dayActivities - Activities for the day
 * @returns {Object} Primary location {state, district}
 */
function extractDayLocation(dayActivities) {
  if (!dayActivities || dayActivities.length === 0) {
    return null;
  }

  // Use first activity's location (activities have location stored directly)
  const firstActivity = dayActivities[0];
  if (firstActivity.location) {
    return {
      state: firstActivity.location.state,
      district: firstActivity.location.district
    };
  }

  // Fallback: try to get from experienceId if populated
  if (firstActivity.experienceId && firstActivity.experienceId.location) {
    return {
      state: firstActivity.experienceId.location.state,
      district: firstActivity.experienceId.location.district
    };
  }

  return null;
}

module.exports = {
  findDriversByLocation,
  matchBestDriverForDay,
  optimizeMultiDayAssignment,
  extractDayLocation
};

