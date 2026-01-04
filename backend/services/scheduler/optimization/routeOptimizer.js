/**
 * Route Optimizer
 * Integrates with Maps API for accurate travel times and implements TSP solver
 */

const { calculateDistance } = require('../core/utils');

/**
 * Calculate travel time using Maps API (if available) or fallback to estimation
 */
async function calculateTravelTimeWithMaps(loc1, loc2, departureTime = null) {
  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  // If Maps API key is available, use it
  if (GOOGLE_MAPS_API_KEY && loc1.coordinates && loc2.coordinates) {
    try {
      const axios = require('axios');
      const origin = `${loc1.coordinates.lat},${loc1.coordinates.lng}`;
      const destination = `${loc2.coordinates.lat},${loc2.coordinates.lng}`;
      
      const params = {
        origins: origin,
        destinations: destination,
        key: GOOGLE_MAPS_API_KEY,
        mode: 'driving'
      };
      
      // Add departure time if provided (for traffic-aware routing)
      if (departureTime) {
        params.departure_time = departureTime;
      }
      
      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', { params });
      
      if (response.data.status === 'OK' && response.data.rows[0]?.elements[0]?.duration) {
        const durationSeconds = response.data.rows[0].elements[0].duration.value;
        return durationSeconds / 3600; // Convert to hours
      }
    } catch (error) {
      console.warn('Maps API error, using fallback:', error.message);
    }
  }
  
  // Fallback to distance-based estimation
  return calculateTravelTimeFallback(loc1, loc2);
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
 * Traveling Salesman Problem (TSP) solver using nearest neighbor heuristic
 * Optimizes route to minimize total travel time
 */
async function solveTSP(locations, startLocation = null, departureTime = null) {
  if (locations.length <= 1) return locations;
  
  const ordered = [];
  const remaining = [...locations];
  
  // Start with the first location or provided start location
  let current = startLocation || remaining.shift();
  ordered.push(current);
  
  // Greedily select nearest unvisited location
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let minTime = await calculateTravelTimeWithMaps(current, nearest, departureTime);
    
    for (const loc of remaining.slice(1)) {
      const travelTime = await calculateTravelTimeWithMaps(current, loc, departureTime);
      if (travelTime < minTime) {
        minTime = travelTime;
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
 * Optimize route with 2-opt improvement (local search)
 */
async function optimizeRoute2Opt(locations, startLocation = null, departureTime = null) {
  if (locations.length <= 3) return locations; // 2-opt doesn't help for small sets
  
  let route = startLocation 
    ? [startLocation, ...locations.filter(l => l !== startLocation)]
    : [...locations];
  
  let improved = true;
  let iterations = 0;
  const maxIterations = 10; // Limit iterations for performance
  
  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;
    
    for (let i = 1; i < route.length - 2; i++) {
      for (let j = i + 1; j < route.length; j++) {
        if (j - i === 1) continue; // Skip adjacent edges
        
        // Calculate current route cost
        let currentCost = 0;
        for (let k = 0; k < route.length - 1; k++) {
          currentCost += await calculateTravelTimeWithMaps(route[k], route[k + 1], departureTime);
        }
        
        // Try 2-opt swap
        const newRoute = [...route];
        // Reverse segment between i and j
        for (let k = i; k <= j; k++) {
          newRoute[k] = route[j - (k - i)];
        }
        
        // Calculate new route cost
        let newCost = 0;
        for (let k = 0; k < newRoute.length - 1; k++) {
          newCost += await calculateTravelTimeWithMaps(newRoute[k], newRoute[k + 1], departureTime);
        }
        
        // If improvement, accept it
        if (newCost < currentCost) {
          route = newRoute;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  
  return route;
}

/**
 * Calculate total travel time for a route
 */
async function calculateRouteTravelTime(route, departureTime = null) {
  if (route.length <= 1) return 0;
  
  let totalTime = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalTime += await calculateTravelTimeWithMaps(route[i], route[i + 1], departureTime);
  }
  
  return totalTime;
}

/**
 * Optimize location order for multi-city trips
 */
async function optimizeLocationOrder(locationGroups, startLocation = null, departureTime = null) {
  if (locationGroups.length <= 1) return locationGroups;
  
  // Use TSP solver
  const tspRoute = await solveTSP(locationGroups, startLocation, departureTime);
  
  // Apply 2-opt improvement
  const optimizedRoute = await optimizeRoute2Opt(tspRoute, startLocation, departureTime);
  
  return optimizedRoute;
}

module.exports = {
  calculateTravelTimeWithMaps,
  calculateTravelTimeFallback,
  solveTSP,
  optimizeRoute2Opt,
  calculateRouteTravelTime,
  optimizeLocationOrder
};








