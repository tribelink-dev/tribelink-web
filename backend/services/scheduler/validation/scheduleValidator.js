/**
 * Schedule Validator
 * Validates schedule feasibility and quality
 */

const { timeRangesOverlap } = require('../core/utils');
const { isExperienceAvailableOnDate, isHostAvailableAtTime } = require('../availability/availabilityService');

/**
 * Validate schedule constraints
 */
function validateScheduleConstraints(schedule, experiences, hotels, guide) {
  const errors = [];
  const warnings = [];
  
  schedule.forEach((day, dayIndex) => {
    // Check activities don't overlap
    for (let i = 0; i < day.activities.length; i++) {
      for (let j = i + 1; j < day.activities.length; j++) {
        const act1 = day.activities[i];
        const act2 = day.activities[j];
        
        if (timeRangesOverlap(act1.startTime, act1.endTime, act2.startTime, act2.endTime)) {
          errors.push({
            type: 'time_conflict',
            day: dayIndex + 1,
            activities: [act1.title, act2.title],
            message: `Activities "${act1.title}" and "${act2.title}" overlap on day ${dayIndex + 1}`
          });
        }
      }
    }
    
    // Check experience availability
    day.activities.forEach(activity => {
      const experience = experiences.find(exp => exp._id.toString() === activity.experienceId.toString());
      if (experience) {
        if (!isExperienceAvailableOnDate(experience, day.date)) {
          errors.push({
            type: 'availability',
            day: dayIndex + 1,
            activity: activity.title,
            message: `Activity "${activity.title}" is not available on day ${dayIndex + 1}`
          });
        }
        
        // Check host availability
        if (experience.provider) {
          if (!isHostAvailableAtTime(experience.provider, day.date, activity.startTime, activity.endTime)) {
            errors.push({
              type: 'host_unavailable',
              day: dayIndex + 1,
              activity: activity.title,
              message: `Host for "${activity.title}" is not available at scheduled time on day ${dayIndex + 1}`
            });
          }
        }
      }
    });
    
    // Check hotel availability
    if (day.hotel) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (!hotel) {
        warnings.push({
          type: 'hotel_not_found',
          day: dayIndex + 1,
          message: `Hotel not found for day ${dayIndex + 1}`
        });
      } else if (hotel.roomsAvailable <= 0) {
        warnings.push({
          type: 'hotel_no_rooms',
          day: dayIndex + 1,
          hotel: hotel.name,
          message: `Hotel "${hotel.name}" has no available rooms on day ${dayIndex + 1}`
        });
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculate schedule quality score
 */
function calculateQualityScore(schedule, preferences) {
  let score = 100;
  const factors = {
    activitiesPerDay: 0,
    timeUtilization: 0,
    locationGrouping: 0,
    paceMatch: 0
  };
  
  // Check activities per day match pace preference
  const expectedPerDay = preferences.pace === 'fast' ? 3 : 2;
  schedule.forEach(day => {
    const actualPerDay = day.activities.length;
    if (actualPerDay < expectedPerDay) {
      score -= 5; // Penalty for fewer activities
      factors.activitiesPerDay -= 5;
    } else if (actualPerDay > expectedPerDay + 1) {
      score -= 3; // Small penalty for too many activities
      factors.activitiesPerDay -= 3;
    }
  });
  
  // Check time utilization (activities should fill reasonable portion of day)
  schedule.forEach(day => {
    if (day.activities.length === 0) {
      score -= 10; // Penalty for empty days
      factors.timeUtilization -= 10;
    } else {
      // Check if activities are well-distributed throughout the day
      const { timeToMinutes } = require('../core/utils');
      const firstStart = Math.min(...day.activities.map(a => timeToMinutes(a.startTime)));
      const lastEnd = Math.max(...day.activities.map(a => timeToMinutes(a.endTime)));
      const daySpan = lastEnd - firstStart;
      
      if (daySpan < 4 * 60) { // Less than 4 hours
        score -= 3;
        factors.timeUtilization -= 3;
      }
    }
  });
  
  // Check location grouping (activities in same location should be grouped)
  schedule.forEach(day => {
    if (day.activities.length > 1) {
      const locations = new Set(day.activities.map(a => `${a.location?.district}-${a.location?.state}`));
      if (locations.size > 2) {
        score -= 5; // Penalty for too many location switches
        factors.locationGrouping -= 5;
      }
    }
  });
  
  // Normalize score to 0-100 range
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    factors,
    grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
  };
}

/**
 * Validate and score schedule
 */
function validateSchedule(schedule, experiences, hotels, guide, preferences) {
  const constraints = validateScheduleConstraints(schedule, experiences, hotels, guide);
  const quality = calculateQualityScore(schedule, preferences);
  
  return {
    valid: constraints.valid,
    quality,
    errors: constraints.errors,
    warnings: constraints.warnings,
    suggestions: generateSuggestions(schedule, constraints, quality, preferences)
  };
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(schedule, constraints, quality, preferences) {
  const suggestions = [];
  
  if (quality.score < 80) {
    suggestions.push({
      type: 'quality',
      message: 'Schedule quality could be improved. Consider adjusting activity distribution.',
      priority: 'medium'
    });
  }
  
  if (constraints.warnings.length > 0) {
    constraints.warnings.forEach(warning => {
      suggestions.push({
        type: warning.type,
        message: warning.message,
        priority: 'low'
      });
    });
  }
  
  // Check for empty days
  const emptyDays = schedule.filter(day => day.activities.length === 0);
  if (emptyDays.length > 0) {
    suggestions.push({
      type: 'empty_days',
      message: `${emptyDays.length} day(s) have no activities scheduled. Consider adding experiences.`,
      priority: 'high'
    });
  }
  
  return suggestions;
}

module.exports = {
  validateSchedule,
  validateScheduleConstraints,
  calculateQualityScore,
  generateSuggestions
};








