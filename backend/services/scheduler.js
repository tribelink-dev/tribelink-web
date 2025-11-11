const Experience = require('../models/Experience');
const Hotel = require('../models/Hotel');
const Host = require('../models/Host');

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert time string (HH:mm) to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Check if two time ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
}

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
 */
function getExperienceTimeSlots(experience, date) {
  // If experience has no availableDates, return default time slots (backward compatibility)
  if (!experience.availableDates || experience.availableDates.length === 0) {
    return {
      startTime: '09:00', // Default 9 AM
      endTime: addHours('09:00', experience.duration || 2)
    };
  }
  
  const dateStr = date.toISOString().split('T')[0];
  const availability = experience.availableDates.find(avail => {
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
  
  if (!availability) return null;
  
  // Handle old format (just Date)
  if (availability instanceof Date) {
    return {
      startTime: '09:00', // Default 9 AM
      endTime: addHours('09:00', experience.duration || 2)
    };
  }
  
  // Handle new format ({date, startTime, endTime, available})
  return {
    startTime: availability.startTime || '09:00', // Default 9 AM
    endTime: availability.endTime || (availability.startTime ? 
      addHours(availability.startTime, experience.duration || 2) : '17:00')
  };
}

/**
 * Add hours to a time string
 */
function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const newHours = (h + hours) % 24;
  return `${String(newHours).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Check if host is available at a specific time
 */
function isHostAvailableAtTime(host, date, startTime, endTime) {
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
  
  // Check if any time slot overlaps with requested time
  return availability.timeSlots.some(slot => {
    if (!slot.available) return false;
    return timeRangesOverlap(slot.startTime, slot.endTime, startTime, endTime);
  });
}

/**
 * Group experiences by location (district/city)
 */
function groupExperiencesByLocation(experiences) {
  const locationGroups = {};
  
  experiences.forEach(exp => {
    const locationKey = `${exp.location.district}-${exp.location.state}`;
    if (!locationGroups[locationKey]) {
      locationGroups[locationKey] = {
        district: exp.location.district,
        state: exp.location.state,
        coordinates: exp.location.coordinates,
        experiences: []
      };
    }
    locationGroups[locationKey].experiences.push(exp);
  });
  
  return Object.values(locationGroups);
}

/**
 * Calculate travel time between two locations (in hours)
 * Assumes average speed: 60 km/h for inter-city, 30 km/h for intra-city
 */
function calculateTravelTime(loc1, loc2) {
  if (!loc1.coordinates || !loc2.coordinates) {
    // If coordinates not available, estimate based on same district/state
    if (loc1.district === loc2.district) {
      return 0.5; // 30 minutes within same district
    } else if (loc1.state === loc2.state) {
      return 2; // 2 hours within same state
    } else {
      return 4; // 4 hours between states
    }
  }
  
  const distance = calculateDistance(
    loc1.coordinates.lat || 0,
    loc1.coordinates.lng || 0,
    loc2.coordinates.lat || 0,
    loc2.coordinates.lng || 0
  );
  
  // Different speeds based on distance
  let avgSpeed = 60; // km/h
  if (loc1.district === loc2.district) {
    avgSpeed = 30; // Intra-city
  } else if (loc1.state === loc2.state) {
    avgSpeed = 50; // Inter-city, same state
  }
  
  return Math.max(0.5, distance / avgSpeed); // Minimum 30 minutes
}

/**
 * Find optimal order of locations to visit (minimize total travel time)
 * Uses nearest neighbor heuristic
 */
function findOptimalLocationOrder(locationGroups, startLocation = null) {
  if (locationGroups.length <= 1) return locationGroups;
  
  const ordered = [];
  const remaining = [...locationGroups];
  
  // Start with the first location or provided start location
  let current = startLocation || remaining.shift();
  ordered.push(current);
  
  // Greedily select nearest unvisited location
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let minDistance = calculateTravelTime(current, nearest);
    
    for (const loc of remaining.slice(1)) {
      const distance = calculateTravelTime(current, loc);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = loc;
      }
    }
    
    ordered.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    current = nearest;
  }
  
  return ordered;
}

/**
 * Cluster experiences within a location by proximity
 */
function clusterExperiencesInLocation(experiences, maxDistance = 15) {
  const clusters = [];
  const used = new Set();

  experiences.forEach((exp, idx) => {
    if (used.has(idx)) return;

    const cluster = [exp];
    used.add(idx);

    experiences.forEach((otherExp, otherIdx) => {
      if (used.has(otherIdx) || idx === otherIdx) return;

      const distance = calculateDistance(
        exp.location.coordinates?.lat || 0,
        exp.location.coordinates?.lng || 0,
        otherExp.location.coordinates?.lat || 0,
        otherExp.location.coordinates?.lng || 0
      );

      if (distance <= maxDistance) {
        cluster.push(otherExp);
        used.add(otherIdx);
      }
    });

    clusters.push(cluster);
  });

  return clusters;
}

/**
 * Intelligent Trip Scheduler
 * Matches traveler dates with host availability and experience timings
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
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;

  // Normalize locations - use locations array if provided, otherwise fallback to single location
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

  // Build query for experiences across all locations
  const locationQueries = tripLocations.map(loc => ({
    'location.country': country,
    'location.state': loc.state,
    'location.district': loc.district
  }));

  // Validate experience IDs
  const mongoose = require('mongoose');
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

  // Filter experiences available in date range (handle both old and new date formats)
  // Note: We filter by date range but don't require exact date matches - experiences can be scheduled if they have any availability in the range
  const availableExperiences = experiences.filter(exp => {
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

  // If no experiences match the date filter, still include all experiences from bucketlist
  // The scheduler will try to schedule them anyway (some might not have dates set)
  if (availableExperiences.length === 0) {
    console.warn('No experiences match the date filter, but proceeding with all experiences from bucketlist');
    // Use all experiences as fallback - this allows experiences without availableDates to still be scheduled
    availableExperiences = experiences;
  }
  
  console.log(`Found ${availableExperiences.length} available experiences out of ${experiences.length} total`);
  
  // If we have filtered experiences, use them; otherwise use all experiences
  const experiencesToSchedule = availableExperiences.length > 0 ? availableExperiences : experiences;

  // Final check: ensure we have experiences to schedule
  if (experiencesToSchedule.length === 0) {
    throw new Error('No experiences found in bucketlist. Please add experiences first.');
  }

  // Group experiences by location (district/city)
  const locationGroups = groupExperiencesByLocation(experiencesToSchedule);
  
  // Find optimal order to visit locations (minimize travel time)
  const orderedLocations = findOptimalLocationOrder(locationGroups);
  
  // Determine experiences per day based on pace
  const experiencesPerDay = preferences.pace === 'fast' ? 3 : 2;
  
  // Determine max distance for clustering based on pace
  const maxClusterDistance = preferences.pace === 'fast' ? 10 : 15; // Fast pace = tighter clusters
  
  // Cluster experiences within each location
  const locationClusters = orderedLocations.map(loc => ({
    ...loc,
    clusters: clusterExperiencesInLocation(loc.experiences, maxClusterDistance)
  }));

  // Fetch hotels based on mode - from all locations
  let hotels = [];
  if (preferences.travelStyle === 'flexible') {
    hotels = await Hotel.find({
      'location.country': country,
      'location.state': { $in: tripLocations.map(loc => loc.state) },
      'location.district': { $in: tripLocations.map(loc => loc.district) },
      roomsAvailable: { $gt: 0 }
    }).sort({ rating: -1 });
  } else if (preferences.travelStyle === 'fixed') {
    hotels = await Hotel.find({
      'location.country': country,
      'location.state': { $in: tripLocations.map(loc => loc.state) },
      'location.district': { $in: tripLocations.map(loc => loc.district) },
      roomsAvailable: { $gt: 0 }
    }).sort({ pricePerNight: 1 }).limit(5);
  }

  // Check guide availability
  let guide = null;
  if (guideId) {
    guide = await Host.findOne({
      _id: guideId,
      role: 'Guide'
    });
    
    if (guide) {
      // Verify guide availability for the trip dates
      const guideAvailable = guide.availability?.some(avail => {
        const availDate = new Date(avail.date);
        return availDate >= from && availDate <= to && avail.available !== false;
      });
      
      if (!guideAvailable) {
        guide = null; // Guide not available for these dates
      }
    }
  }

  // Build intelligent schedule optimizing for location proximity
  const schedule = [];
  const scheduledExperienceIds = new Set();
  
  // Generate all dates in the range
  const tripDates = [];
  let currentDate = new Date(from);
  while (currentDate <= to) {
    tripDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Track current location index for multi-city trips
  let currentLocationIndex = 0;
  let currentLocation = orderedLocations[currentLocationIndex] || null;
  
  // Schedule experiences day by day, optimizing for location grouping
  tripDates.forEach((date, dayIndex) => {
    const dayActivities = [];
    const dateStr = date.toISOString().split('T')[0];
    console.log(`\n=== Scheduling Day ${dayIndex + 1} (${dateStr}) ===`);
    
    // Determine target location for this day
    // For multi-city trips, try to complete experiences in one location before moving to next
    if (orderedLocations.length > 1 && currentLocation) {
      const currentLocationExp = currentLocation.experiences.filter(exp => {
        if (scheduledExperienceIds.has(exp._id.toString())) return false;
        // Allow experiences without availableDates (backward compatibility)
        if (!exp.availableDates || exp.availableDates.length === 0) return true;
        return isExperienceAvailableOnDate(exp, date);
      });
      
      // If current location is exhausted, move to next location
      if (currentLocationExp.length === 0 && currentLocationIndex < orderedLocations.length - 1) {
        currentLocationIndex++;
        currentLocation = orderedLocations[currentLocationIndex];
        
        // Add travel time buffer if switching locations (add as activity gap)
        if (dayIndex > 0 && schedule[dayIndex - 1]?.activities.length > 0) {
          const prevLocation = orderedLocations[currentLocationIndex - 1];
          const travelTime = calculateTravelTime(prevLocation, currentLocation);
          // This will naturally create a gap in the schedule
        }
      }
    }
    
    // Try to schedule experiences for this day
    let scheduledCount = 0;
    let currentTime = '09:00'; // Start at 9 AM
    
    console.log(`  Current location: ${currentLocation?.district}, ${currentLocation?.state}`);
    console.log(`  Experiences in current location: ${currentLocation?.experiences?.length || 0}`);
    
    // First, try to schedule experiences from current location clusters
    if (currentLocation) {
      const locationClusterData = locationClusters.find(lc => 
        lc.district === currentLocation.district && lc.state === currentLocation.state
      );
      
      console.log(`  Location clusters found: ${locationClusterData?.clusters?.length || 0}`);
      
      if (locationClusterData) {
        // Prioritize clusters (experiences close together)
        for (const cluster of locationClusterData.clusters) {
          if (scheduledCount >= experiencesPerDay) break;
          
          console.log(`    Processing cluster with ${cluster.length} experiences`);
          
          // Sort cluster by availability on this date and time
          // Allow experiences without availableDates (backward compatibility)
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
          
          console.log(`      Available in cluster after filtering: ${availableInCluster.length}`);
          
          for (const { exp, timeSlots } of availableInCluster) {
            if (scheduledCount >= experiencesPerDay) break;
            
            // Check if host is available
            const host = exp.provider;
            if (host && host._id) {
              if (!isHostAvailableAtTime(host, date, timeSlots.startTime, timeSlots.endTime)) {
                continue;
              }
            }
            
            // Check if time slot fits in the day
            const expStartMinutes = timeToMinutes(timeSlots.startTime);
            const currentMinutes = timeToMinutes(currentTime);
            
            // If experience starts before current time, skip or adjust
            if (expStartMinutes < currentMinutes) {
              // Try to fit it later if possible
              const expDuration = exp.duration || 2;
              const expEndMinutes = expStartMinutes + (expDuration * 60);
              if (expEndMinutes > currentMinutes) {
                currentTime = addHours(timeSlots.startTime, expDuration);
                continue;
              }
            }
            
            // Add buffer time between activities (15 minutes for fast pace, 30 for slow)
            const bufferMinutes = preferences.pace === 'fast' ? 15 : 30;
            const bufferTime = addHours(currentTime, bufferMinutes / 60);
            
            // Only schedule if experience starts after buffer time
            if (expStartMinutes >= timeToMinutes(bufferTime)) {
              const activity = {
                experienceId: exp._id,
                title: exp.title,
                price: exp.price,
                startTime: timeSlots.startTime,
                endTime: timeSlots.endTime,
                duration: exp.duration || 2,
                provider: {
                  _id: host?._id || null,
                  name: host?.name || 'Unknown Host'
                },
                location: {
                  district: exp.location.district,
                  state: exp.location.state,
                  coordinates: exp.location.coordinates || null
                }
              };
              dayActivities.push(activity);
              console.log(`  ✓ Added activity: ${exp.title} at ${timeSlots.startTime}`);
              
              scheduledExperienceIds.add(exp._id.toString());
              scheduledCount++;
              
              // Update current time for next activity
              const expDuration = exp.duration || 2;
              currentTime = addHours(timeSlots.startTime, expDuration + (bufferMinutes / 60));
            } else {
              console.log(`  ✗ Skipped ${exp.title}: starts at ${timeSlots.startTime}, but current time is ${currentTime}, buffer is ${bufferTime}`);
            }
          }
        }
      }
    }
    
    // If we haven't filled the day and there are other locations, try them
    if (scheduledCount < experiencesPerDay && orderedLocations.length > 1) {
      for (const loc of orderedLocations) {
        if (scheduledCount >= experiencesPerDay) break;
        if (loc.district === currentLocation?.district && loc.state === currentLocation?.state) {
          continue; // Already tried current location
        }
        
        const locExp = loc.experiences.filter(exp => {
          if (scheduledExperienceIds.has(exp._id.toString())) return false;
          // Allow experiences without availableDates (backward compatibility)
          if (!exp.availableDates || exp.availableDates.length === 0) return true;
          return isExperienceAvailableOnDate(exp, date);
        });
        
        for (const exp of locExp.slice(0, experiencesPerDay - scheduledCount)) {
          const timeSlots = getExperienceTimeSlots(exp, date);
          if (!timeSlots) continue;
          
          const host = exp.provider;
          if (host && host._id) {
            if (!isHostAvailableAtTime(host, date, timeSlots.startTime, timeSlots.endTime)) {
              continue;
            }
          }
          
          dayActivities.push({
            experienceId: exp._id,
            title: exp.title,
            price: exp.price,
            startTime: timeSlots.startTime,
            endTime: timeSlots.endTime,
            duration: exp.duration || 2,
            provider: {
              _id: host?._id || null,
              name: host?.name || 'Unknown Host'
            },
            location: {
              district: exp.location.district,
              state: exp.location.state,
              coordinates: exp.location.coordinates || null
            }
          });
          
          scheduledExperienceIds.add(exp._id.toString());
          scheduledCount++;
        }
      }
    }
    
    // Select hotel for this night based on activities location
    let hotel = null;
    if (hotels.length > 0 && dayActivities.length > 0) {
      // Find hotel in the same district as the day's activities
      const activityDistrict = dayActivities[0].location?.district;
      const districtHotels = hotels.filter(h => 
        h.location && h.location.district === activityDistrict
      );
      
      if (preferences.travelStyle === 'flexible') {
        // Use hotel from activity's district, or fallback to any hotel
        const availableHotels = districtHotels.length > 0 ? districtHotels : hotels;
        hotel = availableHotels[dayIndex % availableHotels.length]._id;
      } else if (preferences.travelStyle === 'fixed') {
        // Try to use same hotel if in same district, otherwise use first hotel
        if (districtHotels.length > 0) {
          hotel = districtHotels[0]._id;
        } else {
          hotel = hotels[0]._id;
        }
      }
    } else if (hotels.length > 0) {
      // No activities today, use hotel from previous day or first hotel
      hotel = schedule.length > 0 && schedule[schedule.length - 1].hotel 
        ? schedule[schedule.length - 1].hotel
        : hotels[0]._id;
    }
    
    console.log(`Day ${dayIndex + 1} summary: ${dayActivities.length} activities scheduled`);
    
    // Always add the day to schedule, even if no activities (for consistency)
    schedule.push({
      date: new Date(date),
      activities: dayActivities,
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
  let totalPrice = 0;

  // Add experience prices
  schedule.forEach(day => {
    day.activities.forEach(activity => {
      totalPrice += activity.price || 0;
    });
  });

  // Add hotel prices (for each night stay)
  schedule.forEach((day, idx) => {
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

  // Build map data for interactive visualization
  const mapData = {
    route: [],
    waypoints: [],
    bounds: null
  };
  
  // Extract all waypoints (activities and hotels) with coordinates
  const waypoints = [];
  schedule.forEach((day, dayIdx) => {
    day.activities.forEach((activity, actIdx) => {
      if (activity.location?.coordinates) {
        waypoints.push({
          type: 'activity',
          day: dayIdx + 1,
          index: actIdx,
          title: activity.title,
          coordinates: activity.location.coordinates,
          location: `${activity.location.district}, ${activity.location.state}`,
          time: activity.startTime
        });
      }
    });
    
    // Add hotel waypoint if available
    if (day.hotel) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (hotel && hotel.location?.coordinates) {
        waypoints.push({
          type: 'hotel',
          day: dayIdx + 1,
          name: hotel.name,
          coordinates: hotel.location.coordinates,
          location: `${hotel.location.district}, ${hotel.location.state}`
        });
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

  return {
    schedule,
    totalPrice: Math.round(totalPrice * 100) / 100,
    selectedExperiencesCount: scheduledExperienceIds.size,
    availableHotels: hotels.map(h => ({
      _id: h._id,
      name: h.name,
      pricePerNight: h.pricePerNight,
      rating: h.rating,
      roomsAvailable: h.roomsAvailable,
      location: h.location
    })),
    mapData // Include map data for interactive visualization
  };
}

module.exports = { scheduleTrip };
