/**
 * Budget Optimizer
 * Optimizes schedule within budget constraints and suggests cost-effective alternatives
 */

/**
 * Calculate total cost of schedule
 */
function calculateScheduleCost(schedule, hotels, guide, preferences) {
  let totalCost = 0;
  
  // Activity costs
  schedule.forEach(day => {
    day.activities.forEach(activity => {
      totalCost += activity.price || 0;
    });
  });
  
  // Hotel costs
  schedule.forEach(day => {
    if (day.hotel && hotels.length > 0) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (hotel) {
        totalCost += hotel.pricePerNight;
      }
    }
  });
  
  // Guide cost
  if (guide) {
    totalCost += 50 * schedule.length; // $50 per day
  }
  
  // Transport cost
  if (preferences.transport === 'luxury') {
    totalCost += 30 * schedule.length; // $30 per day
  }
  
  return totalCost;
}

/**
 * Find cost-effective alternatives for activities
 */
function findCostEffectiveAlternatives(activity, availableExperiences, maxPrice = null) {
  const alternatives = availableExperiences
    .filter(exp => {
      // Same location
      if (exp.location.district !== activity.location?.district ||
          exp.location.state !== activity.location?.state) {
        return false;
      }
      
      // Similar duration (within 1 hour)
      const durationDiff = Math.abs((exp.duration || 2) - (activity.duration || 2));
      if (durationDiff > 1) {
        return false;
      }
      
      // Price constraint
      if (maxPrice && exp.price > maxPrice) {
        return false;
      }
      
      // Must be cheaper or similar price
      return exp.price <= activity.price * 1.1; // Within 10% of original
    })
    .sort((a, b) => a.price - b.price) // Sort by price ascending
    .slice(0, 5); // Top 5 alternatives
  
  return alternatives.map(exp => ({
    experience: exp,
    savings: activity.price - exp.price,
    savingsPercent: ((activity.price - exp.price) / activity.price * 100).toFixed(1)
  }));
}

/**
 * Optimize schedule to fit within budget
 */
function optimizeScheduleForBudget(schedule, hotels, guide, preferences, budget) {
  const currentCost = calculateScheduleCost(schedule, hotels, guide, preferences);
  
  if (currentCost <= budget) {
    return {
      optimized: false,
      currentCost,
      budget,
      savings: 0,
      suggestions: []
    };
  }
  
  const overBudget = currentCost - budget;
  const suggestions = [];
  let potentialSavings = 0;
  
  // Suggest cheaper hotel alternatives
  schedule.forEach((day, dayIndex) => {
    if (day.hotel) {
      const currentHotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (currentHotel) {
        const cheaperHotels = hotels
          .filter(h => 
            h.location.district === currentHotel.location.district &&
            h.pricePerNight < currentHotel.pricePerNight &&
            h.rating >= currentHotel.rating - 1 // Don't sacrifice too much quality
          )
          .sort((a, b) => a.pricePerNight - b.pricePerNight)
          .slice(0, 3);
        
        if (cheaperHotels.length > 0) {
          const savings = currentHotel.pricePerNight - cheaperHotels[0].pricePerNight;
          suggestions.push({
            type: 'hotel',
            dayIndex,
            current: currentHotel,
            alternatives: cheaperHotels,
            savings,
            message: `Consider "${cheaperHotels[0].name}" instead of "${currentHotel.name}" to save $${savings.toFixed(2)}`
          });
          potentialSavings += savings;
        }
      }
    }
  });
  
  // Suggest cheaper activity alternatives
  schedule.forEach((day, dayIndex) => {
    day.activities.forEach((activity, actIndex) => {
      // This would require fetching available experiences
      // For now, we'll provide a structure
      suggestions.push({
        type: 'activity',
        dayIndex,
        activityIndex: actIndex,
        current: activity,
        message: `Consider cheaper alternatives for "${activity.title}"`
      });
    });
  });
  
  // Suggest removing optional services
  if (preferences.transport === 'luxury') {
    const cabSavings = 30 * schedule.length;
    suggestions.push({
      type: 'service',
      service: 'luxury_transport',
      savings: cabSavings,
      message: `Switch to standard transport to save $${cabSavings.toFixed(2)}`
    });
    potentialSavings += cabSavings;
  }
  
  if (guide) {
    const guideSavings = 50 * schedule.length;
    suggestions.push({
      type: 'service',
      service: 'guide',
      savings: guideSavings,
      message: `Remove guide service to save $${guideSavings.toFixed(2)}`
    });
    potentialSavings += guideSavings;
  }
  
  return {
    optimized: potentialSavings >= overBudget,
    currentCost,
    budget,
    overBudget,
    potentialSavings,
    suggestions: suggestions.sort((a, b) => (b.savings || 0) - (a.savings || 0))
  };
}

/**
 * Get budget breakdown
 */
function getBudgetBreakdown(schedule, hotels, guide, preferences) {
  const breakdown = {
    activities: 0,
    hotels: 0,
    guide: 0,
    transport: 0,
    total: 0
  };
  
  schedule.forEach(day => {
    day.activities.forEach(activity => {
      breakdown.activities += activity.price || 0;
    });
    
    if (day.hotel && hotels.length > 0) {
      const hotel = hotels.find(h => h._id.toString() === day.hotel.toString());
      if (hotel) {
        breakdown.hotels += hotel.pricePerNight;
      }
    }
  });
  
  if (guide) {
    breakdown.guide = 50 * schedule.length;
  }
  
  if (preferences.transport === 'luxury') {
    breakdown.transport = 30 * schedule.length;
  }
  
  breakdown.total = breakdown.activities + breakdown.hotels + breakdown.guide + breakdown.transport;
  
  return breakdown;
}

module.exports = {
  calculateScheduleCost,
  findCostEffectiveAlternatives,
  optimizeScheduleForBudget,
  getBudgetBreakdown
};








