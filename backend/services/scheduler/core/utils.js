/**
 * Utility functions for scheduler
 */

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
 * Convert minutes from midnight to time string (HH:mm)
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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
 * Add hours to a time string
 */
function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Get district coordinates fallback (Kerala districts)
 */
function getDistrictCoordinates() {
  return {
    'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'Kollam': { lat: 8.8932, lng: 76.6141 },
    'Pathanamthitta': { lat: 9.2648, lng: 76.7870 },
    'Alappuzha': { lat: 9.4981, lng: 76.3388 },
    'Kottayam': { lat: 9.5916, lng: 76.5222 },
    'Idukki': { lat: 9.9189, lng: 76.9444 },
    'Ernakulam': { lat: 9.9312, lng: 76.2673 },
    'Thrissur': { lat: 10.5276, lng: 76.2144 },
    'Palakkad': { lat: 10.7867, lng: 76.6548 },
    'Malappuram': { lat: 11.0404, lng: 76.0819 },
    'Kozhikode': { lat: 11.2588, lng: 75.7804 },
    'Wayanad': { lat: 11.6854, lng: 76.1320 },
    'Kannur': { lat: 11.8745, lng: 75.3704 },
    'Kasaragod': { lat: 12.4984, lng: 74.9899 }
  };
}

/**
 * Get coordinates with fallback
 */
function getCoordinates(location) {
  // First try to get from location.coordinates
  if (location?.coordinates?.lat && location?.coordinates?.lng) {
    return {
      lat: location.coordinates.lat,
      lng: location.coordinates.lng
    };
  }
  
  // Fallback to district coordinates
  const districtCoords = getDistrictCoordinates();
  if (location?.district && districtCoords[location.district]) {
    return districtCoords[location.district];
  }
  
  return null;
}

module.exports = {
  calculateDistance,
  timeToMinutes,
  minutesToTime,
  timeRangesOverlap,
  addHours,
  getDistrictCoordinates,
  getCoordinates
};



