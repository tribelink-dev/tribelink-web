/**
 * Legacy Scheduler - Maintained for backward compatibility
 * Now delegates to the new modular scheduler
 */

const { scheduleTrip: scheduleTripModular } = require('./scheduler');

/**
 * Intelligent Trip Scheduler
 * Matches traveler dates with host availability and experience timings
 * 
 * This function now delegates to the new modular scheduler while maintaining
 * the same interface for backward compatibility.
 */
async function scheduleTrip({
  experienceIds,
  fromDate,
  toDate,
  preferences,
  country,
  state, // Deprecated, use locations instead
  district, // Deprecated, use locations instead
  locations, // Array of {state, district} for multi-city trips
  guideId = null
}) {
  // Delegate to modular scheduler
  return await scheduleTripModular({
    experienceIds,
    fromDate,
    toDate,
    preferences,
    country,
    state,
    district,
    locations,
    guideId
  });
}

module.exports = { scheduleTrip };
