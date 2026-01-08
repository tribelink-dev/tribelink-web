/**
 * Intelligent Guide Matching Algorithm
 * Matches guides to travelers based on multiple factors:
 * - Experience match (which experiences guide can service)
 * - Rating and reviews
 * - Availability
 * - Location proximity
 * - Price/rate
 * - Previous bookings and completion rate
 */

const Host = require('../models/Host');
const Trip = require('../models/Trip');
const Experience = require('../models/Experience');

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Get guide's completion rate (completed trips / total trips)
 */
async function getGuideCompletionRate(guideId) {
  try {
    const trips = await Trip.find({
      'schedule.guide': guideId
    });
    
    if (trips.length === 0) return 1.0; // New guide, assume 100% completion
    
    const completed = trips.filter(t => t.paymentStatus === 'Completed').length;
    return completed / trips.length;
  } catch (error) {
    console.error('Error calculating completion rate:', error);
    return 0.8; // Default fallback
  }
}

/**
 * Calculate experience match score
 * Returns ratio of traveler's experiences that guide can service
 */
function calculateExperienceMatchScore(guideExperiences, travelerExperienceIds) {
  if (!guideExperiences || guideExperiences.length === 0) return 0;
  if (!travelerExperienceIds || travelerExperienceIds.length === 0) return 0;
  
  const guideExpIds = guideExperiences.map(id => id.toString());
  const travelerExpIds = travelerExperienceIds.map(id => id.toString());
  
  const matched = travelerExpIds.filter(id => guideExpIds.includes(id)).length;
  return matched / travelerExpIds.length;
}

/**
 * Calculate location proximity score
 * Returns score based on how close guide's serviced locations are to trip locations
 */
function calculateLocationProximityScore(guideExperiences, tripLocations, allExperiences) {
  if (!guideExperiences || guideExperiences.length === 0) return 0;
  if (!tripLocations || tripLocations.length === 0) return 0.5; // Neutral score
  
  // Get locations of guide's serviced experiences
  const guideLocations = new Set();
  guideExperiences.forEach(expId => {
    const exp = allExperiences.find(e => e._id.toString() === expId.toString());
    if (exp && exp.location) {
      const locKey = `${exp.location.state}-${exp.location.district}`;
      guideLocations.add(locKey);
    }
  });
  
  // Check how many trip locations match guide's locations
  const tripLocationKeys = tripLocations.map(loc => `${loc.state}-${loc.district}`);
  const matchedLocations = tripLocationKeys.filter(key => guideLocations.has(key)).length;
  
  return matchedLocations / tripLocations.length;
}

/**
 * Calculate availability score
 * Returns score based on guide's availability for trip dates
 */
function calculateAvailabilityScore(guideAvailability, fromDate, toDate) {
  if (!guideAvailability || guideAvailability.length === 0) return 0;
  
  const from = new Date(fromDate);
  const to = new Date(toDate);
  
  // Count available days
  let availableDays = 0;
  let totalDays = 0;
  
  const currentDate = new Date(from);
  while (currentDate <= to) {
    totalDays++;
    const dateStr = currentDate.toISOString().split('T')[0];
    const isAvailable = guideAvailability.some(avail => {
      const availDate = new Date(avail.date).toISOString().split('T')[0];
      return availDate === dateStr && avail.available !== false;
    });
    if (isAvailable) availableDays++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalDays > 0 ? availableDays / totalDays : 0;
}

/**
 * Calculate rating score (normalized to 0-1)
 */
function calculateRatingScore(rating, ratingCount) {
  if (!rating || rating === 0) return 0.5; // Neutral for new guides
  if (ratingCount === 0) return 0.5;
  
  // Normalize rating (0-5 scale to 0-1 scale)
  const normalizedRating = rating / 5;
  
  // Boost score based on number of reviews (more reviews = more reliable)
  const reviewBonus = Math.min(ratingCount / 50, 0.2); // Max 0.2 bonus for 50+ reviews
  
  return Math.min(normalizedRating + reviewBonus, 1.0);
}

/**
 * Calculate price score (lower price = higher score, but not too low)
 */
function calculatePriceScore(guideHourlyRate, averageRate) {
  if (!guideHourlyRate) return 0.5;
  if (!averageRate || averageRate === 0) return 0.5;
  
  // Prefer guides with rates close to average (not too expensive, not suspiciously cheap)
  const ratio = guideHourlyRate / averageRate;
  
  if (ratio <= 0.7) return 0.6; // Too cheap might be suspicious
  if (ratio <= 1.0) return 1.0; // Ideal range
  if (ratio <= 1.3) return 0.8; // Slightly expensive
  return 0.5; // Too expensive
}

/**
 * Calculate overall match score for a guide
 */
async function calculateGuideMatchScore(guide, travelerExperienceIds, tripLocations, fromDate, toDate, allExperiences) {
  const scores = {
    experienceMatch: 0,
    locationProximity: 0,
    availability: 0,
    rating: 0,
    price: 0,
    completionRate: 0
  };
  
  // Experience match (weight: 30%)
  scores.experienceMatch = calculateExperienceMatchScore(
    guide.servicedExperiences,
    travelerExperienceIds
  );
  
  // Location proximity (weight: 15%)
  scores.locationProximity = calculateLocationProximityScore(
    guide.servicedExperiences,
    tripLocations,
    allExperiences
  );
  
  // Availability (weight: 25%)
  scores.availability = calculateAvailabilityScore(
    guide.availability,
    fromDate,
    toDate
  );
  
  // Rating (weight: 15%)
  scores.rating = calculateRatingScore(guide.rating || 0, guide.ratingCount || 0);
  
  // Completion rate (weight: 10%)
  scores.completionRate = await getGuideCompletionRate(guide._id);
  
  // Price score (weight: 5%)
  const hourlyRate = guide.getHourlyRate ? guide.getHourlyRate() : (guide.hourlyRate || 15);
  const averageRate = 15; // Could be calculated from all guides
  scores.price = calculatePriceScore(hourlyRate, averageRate);
  
  // Weighted sum
  const weights = {
    experienceMatch: 0.30,
    locationProximity: 0.15,
    availability: 0.25,
    rating: 0.15,
    completionRate: 0.10,
    price: 0.05
  };
  
  const totalScore = 
    scores.experienceMatch * weights.experienceMatch +
    scores.locationProximity * weights.locationProximity +
    scores.availability * weights.availability +
    scores.rating * weights.rating +
    scores.completionRate * weights.completionRate +
    scores.price * weights.price;
  
  return {
    totalScore,
    scores,
    guide: {
      _id: guide._id,
      name: guide.name,
      rating: guide.rating || 0,
      ratingCount: guide.ratingCount || 0,
      hourlyRate: hourlyRate
    }
  };
}

/**
 * Find best matching guides for a trip
 * @param {Array} experienceIds - Traveler's selected experience IDs
 * @param {Array} tripLocations - Trip locations [{state, district}]
 * @param {Date} fromDate - Trip start date
 * @param {Date} toDate - Trip end date
 * @param {Number} limit - Maximum number of guides to return
 * @returns {Array} Sorted array of guides with match scores
 */
async function findBestMatchingGuides(experienceIds, tripLocations, fromDate, toDate, limit = 10) {
  try {
    // Fetch all experiences to get location data
    const Experience = require('../models/Experience');
    const allExperiences = await Experience.find({
      _id: { $in: experienceIds }
    }).lean();
    
    // Find guides who can service at least one of the traveler's experiences
    const guides = await Host.find({
      providerType: 'GUIDE',
      servicedExperiences: { $in: experienceIds }
    })
    .select('-password -googleId')
    .lean();
    
    if (guides.length === 0) {
      console.log('No guides found with matching serviced experiences');
      return [];
    }
    
    // Calculate match scores for each guide
    const guideScores = await Promise.all(
      guides.map(guide => 
        calculateGuideMatchScore(
          guide,
          experienceIds,
          tripLocations,
          fromDate,
          toDate,
          allExperiences
        )
      )
    );
    
    // Filter guides with minimum availability (at least 50% of trip dates)
    const filteredScores = guideScores.filter(match => match.scores.availability >= 0.5);
    
    // Sort by total score (descending)
    filteredScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Return top N guides
    return filteredScores.slice(0, limit).map(match => ({
      guide: match.guide,
      matchScore: match.totalScore,
      breakdown: match.scores,
      experienceMatch: match.scores.experienceMatch,
      availability: match.scores.availability
    }));
    
  } catch (error) {
    console.error('Error finding matching guides:', error);
    throw error;
  }
}

/**
 * Select best guide automatically based on matching algorithm
 * @param {Array} experienceIds - Traveler's selected experience IDs
 * @param {Array} tripLocations - Trip locations
 * @param {Date} fromDate - Trip start date
 * @param {Date} toDate - Trip end date
 * @returns {Object|null} Best matching guide or null
 */
async function selectBestGuide(experienceIds, tripLocations, fromDate, toDate) {
  try {
    const matches = await findBestMatchingGuides(experienceIds, tripLocations, fromDate, toDate, 1);
    
    if (matches.length === 0) {
      return null;
    }
    
    return matches[0].guide._id;
  } catch (error) {
    console.error('Error selecting best guide:', error);
    return null;
  }
}

module.exports = {
  findBestMatchingGuides,
  selectBestGuide,
  calculateGuideMatchScore,
  calculateExperienceMatchScore,
  calculateAvailabilityScore,
  calculateRatingScore
};

