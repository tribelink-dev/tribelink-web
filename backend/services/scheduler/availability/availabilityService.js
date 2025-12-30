/**
 * Availability Service
 * Handles experience and host availability checking
 */

const { timeRangesOverlap } = require('../core/utils');

/**
 * Check if an experience is available on a specific date
 */
function isExperienceAvailableOnDate(experience, date) {
  // If experience has no availableDates, consider it available (backward compatibility)
  if (!experience.availableDates || experience.availableDates.length === 0) {
    return true;
  }
  
  const dateStr = date.toISOString().split('T')[0];
  return experience.availableDates.some(avail => {
    let availDate;
    let isAvailable = true;
    
    // Handle both old format (Date) and new format ({date, startTime, endTime, available})
    if (avail instanceof Date) {
      availDate = avail;
    } else if (avail && typeof avail === 'object') {
      if (avail.date) {
        availDate = new Date(avail.date);
        isAvailable = avail.available !== false;
      } else if (avail.toDate) {
        // MongoDB date object
        availDate = new Date(avail.toDate());
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    const availDateStr = availDate.toISOString().split('T')[0];
    return availDateStr === dateStr && isAvailable;
  });
}

/**
 * Get available time slots for an experience on a specific date
 * Supports 15-minute granularity and capacity checking
 */
function getExperienceTimeSlots(experience, date, requestedCapacity = 1) {
  const { addHours, timeToMinutes, minutesToTime } = require('../core/utils');
  
  // If experience has no availableDates, return default time slots (backward compatibility)
  if (!experience.availableDates || experience.availableDates.length === 0) {
    return {
      startTime: '09:00', // Default 9 AM
      endTime: addHours('09:00', experience.duration || 2),
      capacity: experience.maxCapacity || null,
      availableCapacity: experience.maxCapacity || null
    };
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const availability = experience.availableDates.find(avail => {
    let availDate;
    let isAvailable = true;
    
    // Handle both old format (Date) and new format ({date, startTime, endTime, available, capacity})
    if (avail instanceof Date) {
      availDate = avail;
    } else if (avail && typeof avail === 'object') {
      if (avail.date) {
        availDate = new Date(avail.date);
        isAvailable = avail.available !== false;
      } else if (avail.toDate) {
        // MongoDB date object
        availDate = new Date(avail.toDate());
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    const availDateStr = availDate.toISOString().split('T')[0];
    return availDateStr === dateStr && isAvailable;
  });
  
  if (!availability) return null;
  
  // Handle old format (just Date)
  if (availability instanceof Date) {
    return {
      startTime: '09:00', // Default 9 AM
      endTime: addHours('09:00', experience.duration || 2),
      capacity: experience.maxCapacity || null,
      availableCapacity: experience.maxCapacity || null
    };
  }
  
  // Handle new format ({date, startTime, endTime, available, capacity, bookedCapacity})
  const maxCapacity = availability.capacity || experience.maxCapacity || null;
  const bookedCapacity = availability.bookedCapacity || 0;
  const availableCapacity = maxCapacity ? maxCapacity - bookedCapacity : null;
  
  // Check if there's enough capacity
  if (availableCapacity !== null && availableCapacity < requestedCapacity) {
    return null; // Not enough capacity
  }
  
  // Generate 15-minute granular time slots if time range is provided
  let timeSlots = {
    startTime: availability.startTime || '09:00',
    endTime: availability.endTime || (availability.startTime ? 
      addHours(availability.startTime, experience.duration || 2) : '17:00'),
    capacity: maxCapacity,
    availableCapacity: availableCapacity
  };
  
  // If a time range is provided instead of specific start/end, generate slots
  if (availability.timeRange && !availability.startTime) {
    const range = availability.timeRange; // e.g., "09:00-17:00"
    const [rangeStart, rangeEnd] = range.split('-');
    if (rangeStart && rangeEnd) {
      const startMinutes = timeToMinutes(rangeStart);
      const endMinutes = timeToMinutes(rangeEnd);
      const duration = experience.duration || 2;
      const durationMinutes = duration * 60;
      
      // Generate slots every 15 minutes
      const slots = [];
      for (let slotStart = startMinutes; slotStart + durationMinutes <= endMinutes; slotStart += 15) {
        slots.push({
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotStart + durationMinutes),
          capacity: maxCapacity,
          availableCapacity: availableCapacity
        });
      }
      
      if (slots.length > 0) {
        // Return the first available slot, but store all options
        timeSlots = {
          ...slots[0],
          allSlots: slots,
          capacity: maxCapacity,
          availableCapacity: availableCapacity
        };
      }
    }
  }
  
  return timeSlots;
}

/**
 * Check if host is available at a specific time with capacity support
 */
function isHostAvailableAtTime(host, date, startTime, endTime, requestedCapacity = 1) {
  if (!host || !host.availability || host.availability.length === 0) {
    // If no availability data, assume available (backward compatibility)
    return true;
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const availability = host.availability.find(avail => {
    let availDate;
    let isAvailable = true;
    
    // Handle both old format (Date) and new format ({date, timeSlots, available})
    if (avail instanceof Date) {
      availDate = avail;
    } else if (avail && typeof avail === 'object') {
      if (avail.date) {
        availDate = new Date(avail.date);
        isAvailable = avail.available !== false;
      } else if (avail.toDate) {
        // MongoDB date object
        availDate = new Date(avail.toDate());
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    const availDateStr = availDate.toISOString().split('T')[0];
    return availDateStr === dateStr && isAvailable;
  });
  
  if (!availability) return false;
  
  // If no specific time slots, assume available all day
  if (!availability.timeSlots || availability.timeSlots.length === 0) {
    return true;
  }
  
  // Check if any time slot overlaps with requested time and has capacity
  return availability.timeSlots.some(slot => {
    if (!slot.available) return false;
    
    // Check time overlap
    if (!timeRangesOverlap(slot.startTime, slot.endTime, startTime, endTime)) {
      return false;
    }
    
    // Check capacity if specified
    if (slot.capacity !== undefined && slot.capacity !== null) {
      const availableCapacity = slot.capacity - (slot.bookedCapacity || 0);
      return availableCapacity >= requestedCapacity;
    }
    
    return true;
  });
}

/**
 * Get all available time slots for a host on a specific date (15-minute granularity)
 */
function getHostAvailableTimeSlots(host, date, durationHours = 2) {
  if (!host || !host.availability || host.availability.length === 0) {
    // Return default slots if no availability data
    return generateDefaultTimeSlots(durationHours);
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const availability = host.availability.find(avail => {
    let availDate;
    if (avail instanceof Date) {
      availDate = avail;
    } else if (avail && typeof avail === 'object') {
      if (avail.date) {
        availDate = new Date(avail.date);
      } else if (avail.toDate) {
        availDate = new Date(avail.toDate());
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    const availDateStr = availDate.toISOString().split('T')[0];
    return availDateStr === dateStr && avail.available !== false;
  });
  
  if (!availability) return [];
  
  // If no specific time slots, return default slots
  if (!availability.timeSlots || availability.timeSlots.length === 0) {
    return generateDefaultTimeSlots(durationHours);
  }
  
  // Extract available time slots
  const { timeToMinutes, minutesToTime, addHours } = require('../core/utils');
  const slots = [];
  
  availability.timeSlots.forEach(slot => {
    if (slot.available) {
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      const durationMinutes = durationHours * 60;
      
      // Generate 15-minute granular slots within this range
      for (let slotStart = startMinutes; slotStart + durationMinutes <= endMinutes; slotStart += 15) {
        slots.push({
          startTime: minutesToTime(slotStart),
          endTime: minutesToTime(slotStart + durationMinutes),
          capacity: slot.capacity,
          availableCapacity: slot.capacity ? slot.capacity - (slot.bookedCapacity || 0) : null
        });
      }
    }
  });
  
  return slots;
}

/**
 * Generate default time slots (9 AM to 5 PM, 15-minute intervals)
 */
function generateDefaultTimeSlots(durationHours = 2) {
  const { timeToMinutes, minutesToTime } = require('../core/utils');
  const slots = [];
  const startMinutes = 9 * 60; // 9 AM
  const endMinutes = 17 * 60; // 5 PM
  const durationMinutes = durationHours * 60;
  
  for (let slotStart = startMinutes; slotStart + durationMinutes <= endMinutes; slotStart += 15) {
    slots.push({
      startTime: minutesToTime(slotStart),
      endTime: minutesToTime(slotStart + durationMinutes)
    });
  }
  
  return slots;
}

/**
 * Filter experiences available in date range
 */
function filterExperiencesByDateRange(experiences, fromDate, toDate) {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  return experiences.filter(exp => {
    if (!exp.availableDates || exp.availableDates.length === 0) {
      // If no availableDates set, include it (backward compatibility)
      return true;
    }
    
    // Check if experience has any availability in the date range
    return exp.availableDates.some(avail => {
      let availDate;
      let isAvailable = true;
      
      // Handle both old format (Date) and new format ({date, startTime, endTime, available})
      if (avail instanceof Date) {
        availDate = avail;
      } else if (avail && typeof avail === 'object') {
        if (avail.date) {
          availDate = new Date(avail.date);
          isAvailable = avail.available !== false;
        } else if (avail.toDate) {
          // MongoDB date object
          availDate = new Date(avail.toDate());
        } else {
          return false;
        }
      } else {
        return false;
      }
      
      // Check if availability date falls within trip date range
      // Use date-only comparison (ignore time)
      const availDateOnly = new Date(availDate.getFullYear(), availDate.getMonth(), availDate.getDate());
      const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
      const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());
      
      return availDateOnly >= fromDateOnly && availDateOnly <= toDateOnly && isAvailable;
    });
  });
}

/**
 * Generate trip dates array from fromDate to toDate
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
 * Intelligently check if an experience can be scheduled for the trip dates
 * Checks each day of the trip to see if the experience can be scheduled
 * Returns true if the experience can be scheduled on at least one day
 */
function canExperienceBeScheduledForTrip(experience, fromDate, toDate, requestedCapacity = 1) {
  // If no dates provided, consider it schedulable (backward compatibility)
  if (!fromDate || !toDate) {
    return true;
  }

  // If experience has no availableDates, consider it schedulable (backward compatibility)
  if (!experience.availableDates || experience.availableDates.length === 0) {
    return true;
  }

  // Generate all trip dates
  const tripDates = generateTripDates(fromDate, toDate);
  
  // Check if experience can be scheduled on at least one day
  for (const tripDate of tripDates) {
    // Check if experience is available on this date
    if (!isExperienceAvailableOnDate(experience, tripDate)) {
      continue;
    }
    
    // Check if there are valid time slots for this date
    const timeSlots = getExperienceTimeSlots(experience, tripDate, requestedCapacity);
    if (!timeSlots) {
      continue;
    }
    
    // Check capacity if applicable
    const capacityCheck = checkExperienceCapacity(experience, tripDate, requestedCapacity);
    if (!capacityCheck.available) {
      continue;
    }
    
    // If we get here, the experience can be scheduled on this day
    return true;
  }
  
  // Experience cannot be scheduled on any day of the trip
  return false;
}

/**
 * Filter experiences that can be scheduled for the trip dates
 * Intelligently checks each day of the trip schedule
 */
function filterSchedulableExperiences(experiences, fromDate, toDate, requestedCapacity = 1) {
  if (!fromDate || !toDate) {
    // If no dates provided, return all experiences (backward compatibility)
    return experiences;
  }

  return experiences.filter(exp => {
    return canExperienceBeScheduledForTrip(exp, fromDate, toDate, requestedCapacity);
  });
}

/**
 * Check experience capacity availability
 */
function checkExperienceCapacity(experience, date, requestedCapacity = 1) {
  if (!experience.maxCapacity) {
    return { available: true, reason: 'No capacity limit' };
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const availability = experience.availableDates?.find(avail => {
    let availDate;
    if (avail instanceof Date) {
      availDate = avail;
    } else if (avail && typeof avail === 'object') {
      if (avail.date) {
        availDate = new Date(avail.date);
      } else if (avail.toDate) {
        availDate = new Date(avail.toDate());
      } else {
        return false;
      }
    } else {
      return false;
    }
    
    const availDateStr = availDate.toISOString().split('T')[0];
    return availDateStr === dateStr;
  });
  
  if (!availability) {
    return { available: false, reason: 'No availability data for this date' };
  }
  
  const bookedCapacity = availability.bookedCapacity || 0;
  const availableCapacity = experience.maxCapacity - bookedCapacity;
  
  if (availableCapacity < requestedCapacity) {
    return {
      available: false,
      reason: `Insufficient capacity. Available: ${availableCapacity}, Requested: ${requestedCapacity}`,
      availableCapacity,
      requestedCapacity
    };
  }
  
  return {
    available: true,
    availableCapacity,
    requestedCapacity
  };
}

module.exports = {
  isExperienceAvailableOnDate,
  getExperienceTimeSlots,
  isHostAvailableAtTime,
  filterExperiencesByDateRange,
  filterSchedulableExperiences,
  canExperienceBeScheduledForTrip,
  getHostAvailableTimeSlots,
  checkExperienceCapacity,
  generateDefaultTimeSlots,
  generateTripDates
};

