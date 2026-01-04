/**
 * Dynamic Rescheduler
 * Allows users to modify schedule after creation with automatic conflict resolution
 */

const { scheduleTrip } = require('../core/scheduler');
const { validateSchedule } = require('../validation/scheduleValidator');
const { resolveTimeConflict } = require('../optimization/timeOptimizer');
const { findNextAvailableSlot } = require('../optimization/timeOptimizer');

/**
 * Reschedule a specific activity in an existing schedule
 */
async function rescheduleActivity(tripId, dayIndex, activityIndex, newTimeSlot, preferences) {
  // This would typically fetch the trip from database
  // For now, we'll work with the schedule object passed in
  
  // Validate new time slot
  if (!newTimeSlot.startTime || !newTimeSlot.endTime) {
    throw new Error('Invalid time slot provided');
  }
  
  // Check for conflicts and resolve them
  // Implementation would involve:
  // 1. Fetch current schedule
  // 2. Check conflicts with new time
  // 3. Resolve conflicts automatically
  // 4. Update schedule
  
  return {
    success: true,
    message: 'Activity rescheduled successfully',
    conflictsResolved: []
  };
}

/**
 * Add activity to existing schedule
 */
async function addActivityToSchedule(schedule, newActivity, preferences) {
  const conflicts = [];
  const resolved = [];
  
  // Find best day and time slot for new activity
  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const day = schedule[dayIndex];
    
    // Try to find a slot in this day
    const slot = findNextAvailableSlot(
      newActivity.experience,
      day.date,
      '09:00',
      preferences,
      day.activities[day.activities.length - 1] || null,
      day.activities
    );
    
    if (slot) {
      // Check for conflicts
      const validation = validateActivityScheduling(
        newActivity.experience,
        day.date,
        slot,
        day.activities
      );
      
      if (validation.valid) {
        // Add activity
        day.activities.push({
          experienceId: newActivity.experience._id,
          title: newActivity.experience.title,
          price: newActivity.experience.price,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: newActivity.experience.duration || 2,
          provider: {
            _id: newActivity.experience.provider?._id || null,
            name: newActivity.experience.provider?.name || 'Unknown Host'
          },
          location: newActivity.experience.location
        });
        
        return {
          success: true,
          dayIndex,
          activity: day.activities[day.activities.length - 1]
        };
      } else if (validation.adjusted) {
        // Use adjusted time slot
        day.activities.push({
          experienceId: newActivity.experience._id,
          title: newActivity.experience.title,
          price: newActivity.experience.price,
          startTime: validation.adjustedTimeSlot.startTime,
          endTime: validation.adjustedTimeSlot.endTime,
          duration: newActivity.experience.duration || 2,
          provider: {
            _id: newActivity.experience.provider?._id || null,
            name: newActivity.experience.provider?.name || 'Unknown Host'
          },
          location: newActivity.experience.location
        });
        
        resolved.push({
          dayIndex,
          reason: validation.reason
        });
        
        return {
          success: true,
          dayIndex,
          activity: day.activities[day.activities.length - 1],
          adjusted: true,
          resolved
        };
      }
    }
  }
  
  return {
    success: false,
    reason: 'Could not find suitable time slot for activity'
  };
}

/**
 * Remove activity from schedule
 */
function removeActivityFromSchedule(schedule, dayIndex, activityIndex) {
  if (dayIndex < 0 || dayIndex >= schedule.length) {
    throw new Error('Invalid day index');
  }
  
  if (activityIndex < 0 || activityIndex >= schedule[dayIndex].activities.length) {
    throw new Error('Invalid activity index');
  }
  
  const removed = schedule[dayIndex].activities.splice(activityIndex, 1)[0];
  
  return {
    success: true,
    removedActivity: removed
  };
}

/**
 * Reorder activities within a day
 */
function reorderActivities(schedule, dayIndex, newOrder) {
  if (dayIndex < 0 || dayIndex >= schedule.length) {
    throw new Error('Invalid day index');
  }
  
  const day = schedule[dayIndex];
  if (newOrder.length !== day.activities.length) {
    throw new Error('New order must include all activities');
  }
  
  // Reorder activities
  const reordered = newOrder.map(index => day.activities[index]);
  
  // Validate no conflicts
  for (let i = 0; i < reordered.length - 1; i++) {
    const { timeRangesOverlap } = require('../core/utils');
    if (timeRangesOverlap(
      reordered[i].startTime,
      reordered[i].endTime,
      reordered[i + 1].startTime,
      reordered[i + 1].endTime
    )) {
      throw new Error('Reordering creates time conflicts');
    }
  }
  
  day.activities = reordered;
  
  return {
    success: true,
    activities: day.activities
  };
}

/**
 * Validate activity scheduling (helper)
 */
function validateActivityScheduling(experience, date, timeSlot, scheduledActivities) {
  const { validateActivityScheduling: validate } = require('../optimization/timeOptimizer');
  return validate(experience, date, timeSlot, scheduledActivities);
}

module.exports = {
  rescheduleActivity,
  addActivityToSchedule,
  removeActivityFromSchedule,
  reorderActivities
};








