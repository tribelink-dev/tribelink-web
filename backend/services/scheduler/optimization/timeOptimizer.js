/**
 * Time Optimizer
 * Handles time slot scheduling and conflict resolution
 */

const { timeToMinutes, addHours } = require('../core/utils');
const { getExperienceTimeSlots, isHostAvailableAtTime } = require('../availability/availabilityService');

/**
 * Calculate dynamic buffer time based on travel distance and pace
 */
function calculateBufferTime(preferences, distance = 0) {
  const baseBuffer = preferences.pace === 'fast' ? 15 : 30; // minutes
  
  // Add extra buffer for longer distances
  if (distance > 10) {
    return baseBuffer + 15; // Add 15 min for distances > 10km
  } else if (distance > 5) {
    return baseBuffer + 10; // Add 10 min for distances > 5km
  }
  
  return baseBuffer;
}

/**
 * Check if a time slot fits in the schedule
 */
function canFitTimeSlot(startTime, endTime, currentTime, bufferMinutes) {
  const startMinutes = timeToMinutes(startTime);
  const currentMinutes = timeToMinutes(currentTime);
  const bufferTime = addHours(currentTime, bufferMinutes / 60);
  const bufferMinutesValue = timeToMinutes(bufferTime);
  
  return startMinutes >= bufferMinutesValue;
}

/**
 * Find next available time slot for an experience with flexible time windows
 */
function findNextAvailableSlot(experience, date, currentTime, preferences, previousActivity = null, scheduledActivities = []) {
  const timeSlots = getExperienceTimeSlots(experience, date);
  if (!timeSlots) return null;
  
  // Calculate buffer based on distance from previous activity
  let distance = 0;
  if (previousActivity && previousActivity.location && experience.location) {
    const { calculateDistance, getCoordinates } = require('../core/utils');
    const prevCoords = getCoordinates(previousActivity.location);
    const expCoords = getCoordinates(experience.location);
    if (prevCoords && expCoords) {
      distance = calculateDistance(
        prevCoords.lat,
        prevCoords.lng,
        expCoords.lat,
        expCoords.lng
      );
    }
  }
  
  const bufferMinutes = calculateBufferTime(preferences, distance);
  const startMinutes = timeToMinutes(timeSlots.startTime);
  const currentMinutes = timeToMinutes(currentTime);
  const expDuration = experience.duration || 2;
  
  // Try preferred time slot first
  if (startMinutes >= currentMinutes && canFitTimeSlot(timeSlots.startTime, timeSlots.endTime, currentTime, bufferMinutes)) {
    // Check for conflicts with scheduled activities
    const hasConflict = scheduledActivities.some(activity => {
      const { timeRangesOverlap } = require('../core/utils');
      return timeRangesOverlap(
        activity.startTime,
        activity.endTime,
        timeSlots.startTime,
        timeSlots.endTime
      );
    });
    
    if (!hasConflict) {
      return {
        startTime: timeSlots.startTime,
        endTime: timeSlots.endTime,
        bufferMinutes
      };
    }
  }
  
  // If preferred time doesn't work, try flexible scheduling
  // Allow scheduling within a flexible window (up to 2 hours later)
  const flexibleWindow = preferences.pace === 'fast' ? 1 : 2; // hours
  const preferredEndMinutes = startMinutes + (expDuration * 60);
  const maxEndMinutes = preferredEndMinutes + (flexibleWindow * 60);
  
  // Try to find a slot that fits after current time + buffer
  const minStartMinutes = currentMinutes + bufferMinutes;
  
  if (minStartMinutes < maxEndMinutes) {
    // Calculate optimal start time
    let optimalStartMinutes = Math.max(minStartMinutes, startMinutes);
    
    // Ensure it doesn't conflict with scheduled activities
    for (const activity of scheduledActivities) {
      const actStart = timeToMinutes(activity.startTime);
      const actEnd = timeToMinutes(activity.endTime);
      
      // If there's a conflict, try after this activity
      if (optimalStartMinutes < actEnd && optimalStartMinutes + (expDuration * 60) > actStart) {
        optimalStartMinutes = actEnd + bufferMinutes;
      }
    }
    
    // Check if optimal time is still within flexible window
    if (optimalStartMinutes <= maxEndMinutes) {
      const { minutesToTime } = require('../core/utils');
      const optimalStartTime = minutesToTime(optimalStartMinutes);
      return {
        startTime: optimalStartTime,
        endTime: addHours(optimalStartTime, expDuration),
        bufferMinutes,
        flexible: optimalStartMinutes !== startMinutes // Mark if time was adjusted
      };
    }
  }
  
  // Last resort: schedule after current time + buffer
  const newStartTime = addHours(currentTime, bufferMinutes / 60);
  return {
    startTime: newStartTime,
    endTime: addHours(newStartTime, expDuration),
    bufferMinutes,
    flexible: true
  };
}

/**
 * Resolve time conflicts by adjusting schedules
 */
function resolveTimeConflict(conflictingActivity, newActivity, preferences) {
  const { timeToMinutes, addHours, minutesToTime } = require('../core/utils');
  
  const conflictStart = timeToMinutes(conflictingActivity.startTime);
  const conflictEnd = timeToMinutes(conflictingActivity.endTime);
  const newStart = timeToMinutes(newActivity.startTime);
  const newEnd = timeToMinutes(newActivity.endTime);
  
  const bufferMinutes = calculateBufferTime(preferences, 0);
  
  // Try to move new activity after conflicting one
  if (newStart < conflictEnd) {
    const adjustedStart = conflictEnd + bufferMinutes;
    return {
      startTime: minutesToTime(adjustedStart),
      endTime: addHours(minutesToTime(adjustedStart), newActivity.duration || 2),
      adjusted: true,
      reason: 'Moved after conflicting activity'
    };
  }
  
  // Try to move conflicting activity earlier (if possible)
  const newDuration = newActivity.duration || 2;
  if (conflictStart > newStart + (newDuration * 60) + bufferMinutes) {
    // Can move conflicting activity earlier
    return {
      startTime: newActivity.startTime,
      endTime: newActivity.endTime,
      adjusted: false,
      conflictingActivityAdjusted: true,
      reason: 'Conflicting activity can be moved earlier'
    };
  }
  
  return null; // Cannot resolve conflict
}

/**
 * Validate activity can be scheduled (check host availability, time conflicts)
 * Returns validation result with conflict resolution suggestions
 */
function validateActivityScheduling(experience, date, timeSlot, scheduledActivities = []) {
  // Check host availability
  const host = experience.provider;
  if (host && host._id) {
    if (!isHostAvailableAtTime(host, date, timeSlot.startTime, timeSlot.endTime)) {
      return { 
        valid: false, 
        reason: 'Host not available at this time',
        canResolve: false
      };
    }
  }
  
  // Check for time conflicts with already scheduled activities
  const conflicts = [];
  for (const activity of scheduledActivities) {
    const { timeRangesOverlap } = require('../core/utils');
    if (timeRangesOverlap(
      activity.startTime,
      activity.endTime,
      timeSlot.startTime,
      timeSlot.endTime
    )) {
      conflicts.push(activity);
    }
  }
  
  if (conflicts.length > 0) {
    // Try to resolve conflicts
    const resolution = resolveTimeConflict(
      conflicts[0],
      { ...timeSlot, duration: experience.duration || 2 },
      { pace: 'moderate' } // Default preferences for conflict resolution
    );
    
    if (resolution && resolution.adjusted) {
      return {
        valid: true,
        adjusted: true,
        adjustedTimeSlot: {
          startTime: resolution.startTime,
          endTime: resolution.endTime
        },
        reason: resolution.reason
      };
    }
    
    return {
      valid: false,
      reason: `Time conflict with ${conflicts.length} existing activity/activities`,
      conflicts,
      canResolve: false
    };
  }
  
  return { valid: true };
}

/**
 * Optimize activity order within a day based on location and time
 */
function optimizeActivityOrder(activities) {
  if (activities.length <= 1) return activities;
  
  // Sort by start time, then by location proximity
  return activities.sort((a, b) => {
    const timeA = timeToMinutes(a.startTime);
    const timeB = timeToMinutes(b.startTime);
    
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    
    // If same time, prefer activities closer together
    if (a.location?.coordinates && b.location?.coordinates) {
      const { calculateDistance } = require('../core/utils');
      // This is a simplified check - in practice, you'd want to consider
      // the previous activity's location
      return 0; // Keep original order if same time
    }
    
    return 0;
  });
}

/**
 * Get flexible time windows for an experience
 * Returns array of possible time slots within a flexible window
 */
function getFlexibleTimeWindows(experience, date, preferences, maxWindowHours = 3) {
  const timeSlots = getExperienceTimeSlots(experience, date);
  if (!timeSlots) return [];
  
  const windows = [];
  const { timeToMinutes, addHours, minutesToTime } = require('../core/utils');
  const baseStart = timeToMinutes(timeSlots.startTime);
  const duration = experience.duration || 2;
  const bufferMinutes = calculateBufferTime(preferences, 0);
  
  // Generate time windows starting from preferred time, then every 30 minutes
  for (let offset = 0; offset <= maxWindowHours * 60; offset += 30) {
    const startMinutes = baseStart + offset;
    const endMinutes = startMinutes + (duration * 60);
    
    // Don't schedule too late (after 8 PM)
    if (endMinutes <= 20 * 60) {
      windows.push({
        startTime: minutesToTime(startMinutes),
        endTime: minutesToTime(endMinutes),
        priority: offset === 0 ? 'high' : offset <= 60 ? 'medium' : 'low',
        offsetMinutes: offset
      });
    }
  }
  
  return windows;
}

module.exports = {
  calculateBufferTime,
  canFitTimeSlot,
  findNextAvailableSlot,
  validateActivityScheduling,
  optimizeActivityOrder,
  resolveTimeConflict,
  getFlexibleTimeWindows
};

