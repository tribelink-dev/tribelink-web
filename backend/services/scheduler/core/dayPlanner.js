/**
 * Day Planner
 * Handles day-by-day schedule planning
 */

const { isExperienceAvailableOnDate } = require('../availability/availabilityService');
const { calculateTravelTimeFallback } = require('../optimization/locationOptimizer');
const { assignActivitiesFromCluster, assignActivitiesFromLocation } = require('./activityAssigner');
const { optimizeActivityOrder } = require('../optimization/timeOptimizer');

/**
 * Plan activities for a single day
 */
function planDay({
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
}) {
  const dayActivities = [];
  let scheduledCount = 0;
  let currentTime = '09:00'; // Start at 9 AM
  
  // Determine target location for this day
  // For multi-city trips, try to complete experiences in one location before moving to next
  let updatedLocationIndex = currentLocationIndex;
  let updatedLocation = currentLocation;
  
  if (orderedLocations.length > 1 && updatedLocation) {
    const currentLocationExp = updatedLocation.experiences.filter(exp => {
      if (scheduledExperienceIds.has(exp._id.toString())) return false;
      // Allow experiences without availableDates (backward compatibility)
      if (!exp.availableDates || exp.availableDates.length === 0) return true;
      return isExperienceAvailableOnDate(exp, date);
    });
    
    // If current location is exhausted, move to next location
    if (currentLocationExp.length === 0 && updatedLocationIndex < orderedLocations.length - 1) {
      updatedLocationIndex++;
      updatedLocation = orderedLocations[updatedLocationIndex];
      
        // Add travel time buffer if switching locations (add as activity gap)
        if (dayIndex > 0 && schedule[dayIndex - 1]?.activities.length > 0) {
          const prevLocation = orderedLocations[updatedLocationIndex - 1];
          const travelTime = calculateTravelTimeFallback(prevLocation, updatedLocation);
          // This will naturally create a gap in the schedule
        }
    }
  }
  
  // First, try to schedule experiences from current location clusters
  if (updatedLocation) {
    const locationClusterData = locationClusters.find(lc => 
      lc.district === updatedLocation.district && lc.state === updatedLocation.state
    );
    
    if (locationClusterData) {
      // Prioritize clusters (experiences close together)
      for (const cluster of locationClusterData.clusters) {
        if (scheduledCount >= experiencesPerDay) break;
        
        const result = assignActivitiesFromCluster(
          cluster,
          date,
          currentTime,
          preferences,
          scheduledExperienceIds,
          scheduledCount,
          experiencesPerDay
        );
        
        dayActivities.push(...result.activities);
        currentTime = result.currentTime;
        scheduledCount = result.scheduledCount;
      }
    }
  }
  
  // If we haven't filled the day and there are other locations, try them
  if (scheduledCount < experiencesPerDay && orderedLocations.length > 1) {
    for (const loc of orderedLocations) {
      if (scheduledCount >= experiencesPerDay) break;
      if (loc.district === updatedLocation?.district && loc.state === updatedLocation?.state) {
        continue; // Already tried current location
      }
      
      const result = assignActivitiesFromLocation(
        loc,
        date,
        currentTime,
        preferences,
        scheduledExperienceIds,
        scheduledCount,
        experiencesPerDay
      );
      
      dayActivities.push(...result.activities);
      currentTime = result.currentTime;
      scheduledCount = result.scheduledCount;
    }
  }
  
  // Optimize activity order
  const optimizedActivities = optimizeActivityOrder(dayActivities);
  
  return {
    activities: optimizedActivities,
    locationIndex: updatedLocationIndex,
    location: updatedLocation
  };
}

/**
 * Select hotel for a day based on activities location
 */
function selectHotelForDay(dayActivities, dayIndex, hotels, preferences, previousHotel = null) {
  if (hotels.length === 0) return null;
  
  if (dayActivities.length > 0) {
    // Find hotel in the same district as the day's activities
    const activityDistrict = dayActivities[0].location?.district;
    const districtHotels = hotels.filter(h => 
      h.location && h.location.district === activityDistrict
    );
    
    if (preferences.travelStyle === 'flexible') {
      // Use hotel from activity's district, or fallback to any hotel
      const availableHotels = districtHotels.length > 0 ? districtHotels : hotels;
      return availableHotels[dayIndex % availableHotels.length]._id;
    } else if (preferences.travelStyle === 'fixed') {
      // Try to use same hotel if in same district, otherwise use first hotel
      if (districtHotels.length > 0) {
        return districtHotels[0]._id;
      } else {
        return hotels[0]._id;
      }
    }
  } else {
    // No activities today, use hotel from previous day or first hotel
    return previousHotel || hotels[0]._id;
  }
  
  return null;
}

module.exports = {
  planDay,
  selectHotelForDay
};

