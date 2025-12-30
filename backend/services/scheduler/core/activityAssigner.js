/**
 * Activity Assigner
 * Handles assignment of activities to days
 */

const { timeToMinutes, getCoordinates } = require('./utils');
const { isExperienceAvailableOnDate, getExperienceTimeSlots, isHostAvailableAtTime } = require('../availability/availabilityService');
const { findNextAvailableSlot, validateActivityScheduling } = require('../optimization/timeOptimizer');

/**
 * Assign activities from a cluster to a day
 */
function assignActivitiesFromCluster(cluster, date, currentTime, preferences, scheduledExperienceIds, scheduledCount, experiencesPerDay) {
  const dayActivities = [];
  let updatedCurrentTime = currentTime;
  let updatedScheduledCount = scheduledCount;
  
  // Filter available experiences in cluster
  const availableInCluster = cluster
    .filter(exp => !scheduledExperienceIds.has(exp._id.toString()))
    .filter(exp => {
      // If experience has no availableDates, allow it (backward compatibility)
      if (!exp.availableDates || exp.availableDates.length === 0) {
        return true;
      }
      // Otherwise check if it's available on this date
      return isExperienceAvailableOnDate(exp, date);
    })
    .map(exp => ({
      exp,
      timeSlots: getExperienceTimeSlots(exp, date)
    }))
    .filter(item => item.timeSlots !== null)
    .sort((a, b) => {
      // Sort by start time
      const timeA = timeToMinutes(a.timeSlots.startTime);
      const timeB = timeToMinutes(b.timeSlots.startTime);
      return timeA - timeB;
    });
  
  for (const { exp, timeSlots } of availableInCluster) {
    if (updatedScheduledCount >= experiencesPerDay) break;
    
    // Check if host is available
    const host = exp.provider;
    if (host && host._id) {
      if (!isHostAvailableAtTime(host, date, timeSlots.startTime, timeSlots.endTime)) {
        continue;
      }
    }
    
    // Find next available slot
    const slot = findNextAvailableSlot(exp, date, updatedCurrentTime, preferences, dayActivities[dayActivities.length - 1] || null);
    if (!slot) continue;
    
    // Validate scheduling
    const validation = validateActivityScheduling(exp, date, slot, dayActivities);
    if (!validation.valid) {
      continue;
    }
    
    // Create activity
    const activity = {
      experienceId: exp._id,
      title: exp.title,
      price: exp.price,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: exp.duration || 2,
      imageUrl: exp.imageUrl || null,
      contentUrl: exp.contentUrl || null,
      provider: {
        _id: host?._id || null,
        name: host?.name || 'Unknown Host'
      },
      location: {
        district: exp.location.district,
        state: exp.location.state,
        coordinates: getCoordinates(exp.location)
      }
    };
    
    dayActivities.push(activity);
    scheduledExperienceIds.add(exp._id.toString());
    updatedScheduledCount++;
    
    // Update current time for next activity
    const expDuration = exp.duration || 2;
    updatedCurrentTime = slot.endTime;
  }
  
  return {
    activities: dayActivities,
    currentTime: updatedCurrentTime,
    scheduledCount: updatedScheduledCount
  };
}

/**
 * Assign activities from location to a day
 */
function assignActivitiesFromLocation(location, date, currentTime, preferences, scheduledExperienceIds, scheduledCount, experiencesPerDay) {
  const dayActivities = [];
  let updatedCurrentTime = currentTime;
  let updatedScheduledCount = scheduledCount;
  
  const locExp = location.experiences.filter(exp => {
    if (scheduledExperienceIds.has(exp._id.toString())) return false;
    // Allow experiences without availableDates (backward compatibility)
    if (!exp.availableDates || exp.availableDates.length === 0) return true;
    return isExperienceAvailableOnDate(exp, date);
  });
  
  for (const exp of locExp.slice(0, experiencesPerDay - updatedScheduledCount)) {
    const timeSlots = getExperienceTimeSlots(exp, date);
    if (!timeSlots) continue;
    
    const host = exp.provider;
    if (host && host._id) {
      if (!isHostAvailableAtTime(host, date, timeSlots.startTime, timeSlots.endTime)) {
        continue;
      }
    }
    
    const slot = findNextAvailableSlot(exp, date, updatedCurrentTime, preferences);
    if (!slot) continue;
    
    const validation = validateActivityScheduling(exp, date, slot, dayActivities);
    if (!validation.valid) continue;
    
    dayActivities.push({
      experienceId: exp._id,
      title: exp.title,
      price: exp.price,
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: exp.duration || 2,
      imageUrl: exp.imageUrl || null,
      contentUrl: exp.contentUrl || null,
      provider: {
        _id: host?._id || null,
        name: host?.name || 'Unknown Host'
      },
      location: {
        district: exp.location.district,
        state: exp.location.state,
        coordinates: getCoordinates(exp.location)
      }
    });
    
    scheduledExperienceIds.add(exp._id.toString());
    updatedScheduledCount++;
    updatedCurrentTime = slot.endTime;
  }
  
  return {
    activities: dayActivities,
    currentTime: updatedCurrentTime,
    scheduledCount: updatedScheduledCount
  };
}

module.exports = {
  assignActivitiesFromCluster,
  assignActivitiesFromLocation
};

