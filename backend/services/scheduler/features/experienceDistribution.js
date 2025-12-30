/**
 * Experience Distribution Optimizer
 * Handles cases where there are fewer experiences than trip days
 */

/**
 * Calculate optimal distribution strategy when experiences < days
 */
function calculateDistributionStrategy(experienceCount, dayCount, preferences) {
  const experiencesPerDay = preferences.pace === 'fast' ? 3 : 2;
  const maxPossibleDays = Math.ceil(experienceCount / experiencesPerDay);
  
  return {
    experienceCount,
    dayCount,
    experiencesPerDay,
    maxPossibleDays,
    hasInsufficientExperiences: experienceCount < dayCount * experiencesPerDay,
    recommendedStrategy: experienceCount < dayCount 
      ? 'spread_evenly' // Spread 1 per day
      : experienceCount < dayCount * experiencesPerDay
        ? 'distribute_optimally' // Distribute optimally
        : 'normal' // Normal scheduling
  };
}

/**
 * Distribute experiences evenly across days when there are fewer experiences
 */
function distributeExperiencesEvenly(experiences, days, preferences) {
  const strategy = calculateDistributionStrategy(experiences.length, days.length, preferences);
  
  if (strategy.recommendedStrategy === 'normal') {
    return null; // Use normal scheduling
  }
  
  const distribution = [];
  const experiencesPerDay = strategy.recommendedStrategy === 'spread_evenly' 
    ? 1 
    : Math.floor(experiences.length / days.length) || 1;
  
  let experienceIndex = 0;
  
  days.forEach((date, dayIndex) => {
    const dayExperiences = [];
    const remainingDays = days.length - dayIndex;
    const remainingExperiences = experiences.length - experienceIndex;
    
    // Calculate how many experiences to assign to this day
    let assignCount = experiencesPerDay;
    
    // If spreading evenly (1 per day), assign 1
    if (strategy.recommendedStrategy === 'spread_evenly') {
      assignCount = 1;
    } else {
      // Distribute optimally: ensure we don't run out
      const avgPerRemainingDay = remainingExperiences / remainingDays;
      assignCount = Math.ceil(avgPerRemainingDay);
    }
    
    // Don't assign more than available
    assignCount = Math.min(assignCount, remainingExperiences);
    
    // Assign experiences to this day
    for (let i = 0; i < assignCount && experienceIndex < experiences.length; i++) {
      dayExperiences.push(experiences[experienceIndex]);
      experienceIndex++;
    }
    
    distribution.push({
      date,
      dayIndex,
      experiences: dayExperiences,
      isEmpty: dayExperiences.length === 0
    });
  });
  
  return {
    distribution,
    strategy,
    warnings: generateDistributionWarnings(strategy, experiences.length, days.length)
  };
}

/**
 * Generate warnings and suggestions for insufficient experiences
 */
function generateDistributionWarnings(strategy, experienceCount, dayCount) {
  const warnings = [];
  const suggestions = [];
  
  if (strategy.hasInsufficientExperiences) {
    warnings.push({
      type: 'insufficient_experiences',
      severity: 'medium',
      message: `You have ${experienceCount} experience(s) for ${dayCount} day(s). Consider adding more experiences for a fuller itinerary.`
    });
    
    // Calculate how many more experiences are needed
    const experiencesPerDay = strategy.experiencesPerDay;
    const recommendedCount = dayCount * experiencesPerDay;
    const needed = recommendedCount - experienceCount;
    
    if (needed > 0) {
      suggestions.push({
        type: 'add_experiences',
        count: needed,
        message: `Add ${needed} more experience(s) to fill your ${dayCount}-day trip optimally.`
      });
    }
    
    // Suggest reducing trip duration
    const optimalDays = Math.ceil(experienceCount / experiencesPerDay);
    if (optimalDays < dayCount && optimalDays > 0) {
      suggestions.push({
        type: 'reduce_duration',
        currentDays: dayCount,
        suggestedDays: optimalDays,
        message: `Consider reducing your trip to ${optimalDays} day(s) to better match your ${experienceCount} experience(s).`
      });
    }
  }
  
  return {
    warnings,
    suggestions
  };
}

/**
 * Get recommendations for empty days
 */
async function getRecommendationsForEmptyDays(emptyDays, tripLocations, country, preferences, scheduledExperienceIds) {
  const Experience = require('../../../models/Experience');
  const mongoose = require('mongoose');
  
  const recommendations = [];
  
  for (const emptyDay of emptyDays) {
    const dayRecommendations = [];
    
    // Fetch available experiences for each location
    for (const location of tripLocations) {
      try {
        const query = {
          'location.country': country,
          'location.state': location.state,
          'location.district': location.district
        };
        
        // Exclude already scheduled experiences
        if (scheduledExperienceIds && scheduledExperienceIds.length > 0) {
          query._id = { $nin: scheduledExperienceIds.map(id => new mongoose.Types.ObjectId(id)) };
        }
        
        const experiences = await Experience.find(query)
          .populate('provider', 'name rating')
          .limit(10)
          .sort({ rating: -1, price: 1 }); // Sort by rating, then price
        
        dayRecommendations.push(...experiences.map(exp => ({
          experience: exp,
          location: location,
          reason: 'Available for this day',
          matchScore: calculateMatchScore(exp, preferences)
        })));
      } catch (error) {
        console.error(`Error fetching recommendations for ${location.district}:`, error);
      }
    }
    
    // Sort by match score and take top recommendations
    dayRecommendations.sort((a, b) => b.matchScore - a.matchScore);
    
    recommendations.push({
      day: emptyDay.date,
      dayIndex: emptyDay.dayIndex,
      recommendations: dayRecommendations.slice(0, 6) // Top 6 recommendations
    });
  }
  
  return recommendations;
}

/**
 * Calculate how well an experience matches user preferences
 */
function calculateMatchScore(experience, preferences) {
  let score = 0;
  
  // Price match (budget-friendly gets higher score for non-luxury)
  if (preferences.travelStyle !== 'luxury' && experience.price < 50) {
    score += 20;
  } else if (preferences.travelStyle === 'luxury' && experience.price > 100) {
    score += 20;
  }
  
  // Duration match
  if (preferences.pace === 'fast' && experience.duration <= 3) {
    score += 15;
  } else if (preferences.pace === 'slow' && experience.duration >= 4) {
    score += 15;
  }
  
  // Provider rating
  if (experience.provider?.rating) {
    score += experience.provider.rating * 10;
  }
  
  return score;
}

module.exports = {
  calculateDistributionStrategy,
  distributeExperiencesEvenly,
  generateDistributionWarnings,
  getRecommendationsForEmptyDays,
  calculateMatchScore
};

