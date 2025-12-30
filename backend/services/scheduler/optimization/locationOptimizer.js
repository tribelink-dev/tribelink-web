/**
 * Location Optimizer
 * Handles location grouping, clustering, and route optimization
 */

const { calculateDistance, getDistrictCoordinates } = require('../core/utils');

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
 * Uses route optimizer if available, otherwise falls back to estimation
 */
async function calculateTravelTime(loc1, loc2) {
  // Try to use route optimizer with Maps API
  try {
    const { calculateTravelTimeWithMaps } = require('./routeOptimizer');
    return await calculateTravelTimeWithMaps(loc1, loc2);
  } catch (error) {
    // Fallback to distance-based estimation
    return calculateTravelTimeFallback(loc1, loc2);
  }
}

/**
 * Fallback travel time calculation
 */
function calculateTravelTimeFallback(loc1, loc2) {
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
 * Uses TSP solver with Maps API integration if available
 */
async function findOptimalLocationOrder(locationGroups, startLocation = null) {
  if (locationGroups.length <= 1) return locationGroups;
  
  try {
    // Try to use route optimizer with TSP solver
    const { optimizeLocationOrder } = require('./routeOptimizer');
    return await optimizeLocationOrder(locationGroups, startLocation);
  } catch (error) {
    // Fallback to nearest neighbor heuristic
    console.warn('Route optimizer unavailable, using fallback:', error.message);
    return findOptimalLocationOrderFallback(locationGroups, startLocation);
  }
}

/**
 * Fallback: Nearest neighbor heuristic
 */
function findOptimalLocationOrderFallback(locationGroups, startLocation = null) {
  if (locationGroups.length <= 1) return locationGroups;
  
  const ordered = [];
  const remaining = [...locationGroups];
  
  // Start with the first location or provided start location
  let current = startLocation || remaining.shift();
  ordered.push(current);
  
  // Greedily select nearest unvisited location
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let minDistance = calculateTravelTimeFallback(current, nearest);
    
    for (const loc of remaining.slice(1)) {
      const distance = calculateTravelTimeFallback(current, loc);
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
 * Create location clusters with experiences
 */
function createLocationClusters(locationGroups, maxClusterDistance) {
  return locationGroups.map(loc => ({
    ...loc,
    clusters: clusterExperiencesInLocation(loc.experiences, maxClusterDistance)
  }));
}

module.exports = {
  groupExperiencesByLocation,
  calculateTravelTime,
  calculateTravelTimeFallback,
  findOptimalLocationOrder,
  findOptimalLocationOrderFallback,
  clusterExperiencesInLocation,
  createLocationClusters
};

