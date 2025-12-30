/**
 * Route Optimization Service
 * 
 * Optimizes routes between waypoints for minimum travel time and cost
 * Uses OSRM (Open Source Routing Machine) for real road routing
 */

const axios = require('axios');

// OSRM API endpoint (using public demo server - can be replaced with self-hosted)
const OSRM_BASE_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

/**
 * Get route between two points using OSRM
 * Returns: { distance (km), duration (seconds), geometry (polyline) }
 */
async function getRouteBetweenPoints(start, end) {
  try {
    const url = `${OSRM_BASE_URL}/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data.code === 'Ok' && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distance: route.distance / 1000, // Convert to km
        duration: route.duration, // in seconds
        geometry: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert [lng, lat] to [lat, lng]
        legs: route.legs || []
      };
    }
    
    return null;
  } catch (error) {
    console.error('OSRM routing error:', error.message);
    // Fallback to straight-line distance
    return getStraightLineRoute(start, end);
  }
}

/**
 * Fallback: Calculate straight-line route when OSRM is unavailable
 */
function getStraightLineRoute(start, end) {
  const distance = calculateHaversineDistance(start.lat, start.lng, end.lat, end.lng);
  const avgSpeed = 40; // km/h average
  const duration = (distance / avgSpeed) * 3600; // seconds
  
  return {
    distance,
    duration,
    geometry: [[start.lat, start.lng], [end.lat, end.lng]],
    legs: []
  };
}

/**
 * Calculate Haversine distance between two points
 */
function calculateHaversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Optimize waypoint order using Nearest Neighbor + 2-opt improvement
 * Minimizes total travel time
 */
function optimizeWaypointOrder(waypoints) {
  if (waypoints.length <= 2) return waypoints;
  
  // Start with hotel if available, otherwise first waypoint
  const startIndex = waypoints.findIndex(wp => wp.type === 'hotel') >= 0
    ? waypoints.findIndex(wp => wp.type === 'hotel')
    : 0;
  
  const ordered = [waypoints[startIndex]];
  const remaining = waypoints.filter((_, idx) => idx !== startIndex);
  
  // Nearest neighbor algorithm
  let current = waypoints[startIndex];
  while (remaining.length > 0) {
    let nearest = remaining[0];
    let minDistance = calculateHaversineDistance(
      current.coordinates.lat, current.coordinates.lng,
      nearest.coordinates.lat, nearest.coordinates.lng
    );
    
    for (const wp of remaining.slice(1)) {
      const distance = calculateHaversineDistance(
        current.coordinates.lat, current.coordinates.lng,
        wp.coordinates.lat, wp.coordinates.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = wp;
      }
    }
    
    ordered.push(nearest);
    remaining.splice(remaining.indexOf(nearest), 1);
    current = nearest;
  }
  
  return ordered;
}

/**
 * Get optimized route for a day's waypoints
 * Returns full route with geometry, distances, and durations
 */
async function getOptimizedRoute(waypoints) {
  if (waypoints.length < 2) {
    return {
      waypoints: waypoints,
      totalDistance: 0,
      totalDuration: 0,
      segments: []
    };
  }
  
  // Optimize waypoint order
  const optimizedWaypoints = optimizeWaypointOrder(waypoints);
  
  // Get routes between consecutive waypoints
  const segments = [];
  let totalDistance = 0;
  let totalDuration = 0;
  
  for (let i = 0; i < optimizedWaypoints.length - 1; i++) {
    const start = optimizedWaypoints[i].coordinates;
    const end = optimizedWaypoints[i + 1].coordinates;
    
    const route = await getRouteBetweenPoints(start, end);
    
    if (route) {
      segments.push({
        from: optimizedWaypoints[i],
        to: optimizedWaypoints[i + 1],
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry
      });
      
      totalDistance += route.distance;
      totalDuration += route.duration;
    }
  }
  
  return {
    waypoints: optimizedWaypoints,
    totalDistance,
    totalDuration,
    segments,
    geometry: segments.flatMap(s => s.geometry)
  };
}

/**
 * Get optimized routes for multiple days
 */
async function getOptimizedRoutesForDays(waypointsByDay) {
  const routes = {};
  
  for (const [day, waypoints] of Object.entries(waypointsByDay)) {
    if (waypoints.length >= 2) {
      routes[parseInt(day)] = await getOptimizedRoute(waypoints);
    } else {
      routes[parseInt(day)] = {
        waypoints: waypoints,
        totalDistance: 0,
        totalDuration: 0,
        segments: [],
        geometry: []
      };
    }
  }
  
  return routes;
}

module.exports = {
  getRouteBetweenPoints,
  optimizeWaypointOrder,
  getOptimizedRoute,
  getOptimizedRoutesForDays,
  calculateHaversineDistance
};

