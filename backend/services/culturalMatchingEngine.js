const Experience = require('../models/Experience');
const User = require('../models/User');
const Trip = require('../models/Trip');
const mongoose = require('mongoose');

/**
 * Revolutionary Cultural Matching Engine
 * Discovers authentic regional experiences based on cultural patterns,
 * regional characteristics, and user preferences
 */

/**
 * Regional Cultural Profiles
 * Defines cultural characteristics of different regions
 */
const REGIONAL_CULTURAL_PROFILES = {
  'Kerala': {
    heritage: ['Traditional', 'Indigenous'],
    traditions: ['Festival', 'Cuisine', 'Craft', 'Music', 'Dance', 'Ritual'],
    experienceTypes: ['Hands-on', 'Observational', 'Spiritual', 'Culinary'],
    culturalSignificance: 'High',
    authenticityScore: 9,
    regionalTags: ['Kerala Backwaters', 'Ayurveda', 'Kathakali', 'Onam', 'Temple Festivals'],
    seasonalHighlights: {
      'Monsoon': ['Ayurveda Treatments', 'Backwater Cruises'],
      'Harvest': ['Onam Celebrations', 'Village Tours'],
      'Festival Season': ['Temple Festivals', 'Cultural Performances']
    },
    languages: ['Malayalam', 'English'],
    communityInvolvement: true
  },
  'Tamil Nadu': {
    heritage: ['Traditional', 'Indigenous', 'Colonial'],
    traditions: ['Festival', 'Cuisine', 'Craft', 'Music', 'Dance', 'Ritual', 'Ceremony'],
    experienceTypes: ['Hands-on', 'Observational', 'Spiritual', 'Educational', 'Artistic'],
    culturalSignificance: 'High',
    authenticityScore: 9,
    regionalTags: ['Tamil Nadu Temples', 'Carnatic Music', 'Bharatanatyam', 'Pongal', 'Tanjore Paintings'],
    seasonalHighlights: {
      'Harvest': ['Pongal Celebrations', 'Village Tours'],
      'Festival Season': ['Temple Festivals', 'Music Festivals']
    },
    languages: ['Tamil', 'English'],
    communityInvolvement: true
  },
  'Rajasthan': {
    heritage: ['Traditional', 'Colonial'],
    traditions: ['Festival', 'Cuisine', 'Craft', 'Music', 'Dance'],
    experienceTypes: ['Hands-on', 'Observational', 'Interactive', 'Artistic', 'Festive'],
    culturalSignificance: 'High',
    authenticityScore: 8,
    regionalTags: ['Desert Culture', 'Folk Music', 'Rajasthani Cuisine', 'Handicrafts', 'Camel Safaris'],
    seasonalHighlights: {
      'Winter': ['Desert Safaris', 'Cultural Performances'],
      'Festival Season': ['Pushkar Fair', 'Desert Festivals']
    },
    languages: ['Hindi', 'Rajasthani', 'English'],
    communityInvolvement: true
  },
  'Goa': {
    heritage: ['Colonial', 'Fusion', 'Contemporary'],
    traditions: ['Festival', 'Cuisine', 'Music'],
    experienceTypes: ['Hands-on', 'Observational', 'Interactive', 'Culinary', 'Festive'],
    culturalSignificance: 'Medium',
    authenticityScore: 7,
    regionalTags: ['Portuguese Heritage', 'Beach Culture', 'Goan Cuisine', 'Carnival'],
    seasonalHighlights: {
      'Winter': ['Beach Activities', 'Carnival Celebrations'],
      'Monsoon': ['Spice Plantation Tours']
    },
    languages: ['Konkani', 'English', 'Portuguese'],
    communityInvolvement: true
  }
};

/**
 * Cultural Experience Patterns
 * Maps user preferences to cultural experience types
 */
const CULTURAL_EXPERIENCE_PATTERNS = {
  'Traditional': {
    preferredHeritage: ['Traditional', 'Indigenous'],
    preferredTypes: ['Hands-on', 'Observational', 'Spiritual'],
    authenticityThreshold: 7,
    communityFocus: true
  },
  'Contemporary': {
    preferredHeritage: ['Contemporary', 'Fusion'],
    preferredTypes: ['Interactive', 'Educational'],
    authenticityThreshold: 5,
    communityFocus: false
  },
  'Spiritual': {
    preferredHeritage: ['Traditional', 'Indigenous'],
    preferredTypes: ['Spiritual', 'Observational'],
    authenticityThreshold: 8,
    communityFocus: true
  },
  'Culinary': {
    preferredHeritage: ['Traditional', 'Fusion'],
    preferredTypes: ['Hands-on', 'Culinary', 'Interactive'],
    authenticityThreshold: 6,
    communityFocus: true
  },
  'Artistic': {
    preferredHeritage: ['Traditional', 'Contemporary'],
    preferredTypes: ['Hands-on', 'Artistic', 'Educational'],
    authenticityThreshold: 7,
    communityFocus: true
  }
};

/**
 * Discover authentic cultural experiences for a region
 */
async function discoverCulturalExperiences({
  region,
  state,
  district,
  userPreferences = {},
  culturalInterests = [],
  dateRange = null
}) {
  try {
    // Get regional cultural profile
    const regionalProfile = REGIONAL_CULTURAL_PROFILES[state] || getDefaultRegionalProfile(state);
    
    // Build query based on regional characteristics
    const query = {
      'location.state': state,
      'location.district': district || { $exists: true }
    };

    // Add cultural metadata filters
    const culturalFilters = buildCulturalFilters(regionalProfile, userPreferences, culturalInterests);
    if (Object.keys(culturalFilters).length > 0) {
      Object.assign(query, culturalFilters);
    }

    // Add date filtering if provided
    if (dateRange && dateRange.from && dateRange.to) {
      query.availableDates = {
        $elemMatch: {
          date: {
            $gte: new Date(dateRange.from),
            $lte: new Date(dateRange.to)
          },
          available: true
        }
      };
    }

    // Fetch experiences
    const experiences = await Experience.find(query)
      .populate('provider', 'name rating')
      .lean();

    // Score and rank experiences based on cultural authenticity
    const scoredExperiences = experiences.map(exp => {
      const culturalScore = calculateCulturalMatchScore(
        exp,
        regionalProfile,
        userPreferences,
        culturalInterests
      );
      
      return {
        ...exp,
        culturalMatchScore: culturalScore.total,
        culturalBreakdown: culturalScore.breakdown,
        authenticityLevel: getAuthenticityLevel(exp.culturalMetadata?.authenticityScore || 5),
        regionalRelevance: culturalScore.regionalRelevance
      };
    });

    // Sort by cultural match score
    scoredExperiences.sort((a, b) => b.culturalMatchScore - a.culturalMatchScore);

    // Categorize experiences
    const categorized = categorizeCulturalExperiences(scoredExperiences, regionalProfile);

    return {
      experiences: scoredExperiences,
      regionalProfile: {
        state,
        district,
        culturalCharacteristics: regionalProfile,
        totalExperiences: scoredExperiences.length
      },
      categorized: categorized,
      recommendations: generateCulturalRecommendations(
        scoredExperiences,
        regionalProfile,
        userPreferences
      )
    };
  } catch (error) {
    console.error('Error discovering cultural experiences:', error);
    throw error;
  }
}

/**
 * Build cultural filters based on regional profile and user preferences
 */
function buildCulturalFilters(regionalProfile, userPreferences, culturalInterests) {
  const filters = {};

  // Filter by heritage if user has preferences
  if (userPreferences.preferredHeritage && userPreferences.preferredHeritage.length > 0) {
    filters['culturalMetadata.heritage'] = { $in: userPreferences.preferredHeritage };
  } else {
    // Use regional default heritage
    filters['culturalMetadata.heritage'] = { $in: regionalProfile.heritage };
  }

  // Filter by experience type if user has preferences
  if (userPreferences.experiencePreferences) {
    const preferredTypes = Object.entries(userPreferences.experiencePreferences)
      .filter(([_, score]) => score >= 7)
      .map(([type, _]) => type.charAt(0).toUpperCase() + type.slice(1));
    
    if (preferredTypes.length > 0) {
      filters['culturalMetadata.experienceType'] = { $in: preferredTypes };
    }
  }

  // Filter by authenticity score
  const authenticityThreshold = userPreferences.authenticityThreshold || 6;
  filters['culturalMetadata.authenticityScore'] = { $gte: authenticityThreshold };

  // Filter by traditions if user has cultural interests
  if (culturalInterests.length > 0) {
    filters['culturalMetadata.traditions'] = { $in: culturalInterests };
  }

  return filters;
}

/**
 * Calculate cultural match score for an experience
 */
function calculateCulturalMatchScore(experience, regionalProfile, userPreferences, culturalInterests) {
  let totalScore = 0;
  const breakdown = {
    heritageMatch: 0,
    traditionMatch: 0,
    authenticity: 0,
    regionalRelevance: 0,
    userPreferenceMatch: 0
  };

  const culturalMetadata = experience.culturalMetadata || {};

  // Heritage match (20 points)
  if (culturalMetadata.heritage) {
    if (regionalProfile.heritage.includes(culturalMetadata.heritage)) {
      breakdown.heritageMatch = 20;
      totalScore += 20;
    } else if (userPreferences.preferredHeritage?.includes(culturalMetadata.heritage)) {
      breakdown.heritageMatch = 15;
      totalScore += 15;
    }
  }

  // Tradition match (25 points)
  const experienceTraditions = culturalMetadata.traditions || [];
  const regionalTraditions = regionalProfile.traditions || [];
  const matchingTraditions = experienceTraditions.filter(t => 
    regionalTraditions.includes(t) || culturalInterests.includes(t)
  );
  
  if (matchingTraditions.length > 0) {
    breakdown.traditionMatch = Math.min(25, matchingTraditions.length * 8);
    totalScore += breakdown.traditionMatch;
  }

  // Authenticity score (25 points)
  const authenticityScore = culturalMetadata.authenticityScore || 5;
  breakdown.authenticity = (authenticityScore / 10) * 25;
  totalScore += breakdown.authenticity;

  // Regional relevance (15 points)
  const regionalTags = culturalMetadata.regionalTags || [];
  const matchingTags = regionalTags.filter(tag => 
    regionalProfile.regionalTags.some(rt => 
      tag.toLowerCase().includes(rt.toLowerCase()) || 
      rt.toLowerCase().includes(tag.toLowerCase())
    )
  );
  
  if (matchingTags.length > 0) {
    breakdown.regionalRelevance = 15;
    totalScore += 15;
  } else if (experience.location?.state === regionalProfile.state) {
    breakdown.regionalRelevance = 10;
    totalScore += 10;
  }

  // User preference match (15 points)
  if (userPreferences.experiencePreferences) {
    const expType = culturalMetadata.experienceType;
    if (expType) {
      const normalizedType = expType.toLowerCase();
      const userScore = userPreferences.experiencePreferences[normalizedType] || 0;
      breakdown.userPreferenceMatch = (userScore / 10) * 15;
      totalScore += breakdown.userPreferenceMatch;
    }
  }

  return {
    total: Math.min(100, totalScore),
    breakdown
  };
}

/**
 * Categorize experiences by cultural themes
 */
function categorizeCulturalExperiences(experiences, regionalProfile) {
  const categories = {
    'Highly Authentic': [],
    'Traditional Heritage': [],
    'Cultural Immersion': [],
    'Community Experiences': [],
    'Seasonal Highlights': []
  };

  experiences.forEach(exp => {
    const metadata = exp.culturalMetadata || {};

    // Highly Authentic
    if (metadata.authenticityScore >= 8) {
      categories['Highly Authentic'].push(exp);
    }

    // Traditional Heritage
    if (metadata.heritage === 'Traditional' || metadata.heritage === 'Indigenous') {
      categories['Traditional Heritage'].push(exp);
    }

    // Cultural Immersion
    if (metadata.experienceType === 'Hands-on' || metadata.experienceType === 'Interactive') {
      categories['Cultural Immersion'].push(exp);
    }

    // Community Experiences
    if (metadata.localCommunityInvolvement) {
      categories['Community Experiences'].push(exp);
    }

    // Seasonal Highlights
    if (metadata.seasonalAvailability && metadata.seasonalAvailability.length > 0) {
      categories['Seasonal Highlights'].push(exp);
    }
  });

  return categories;
}

/**
 * Generate cultural recommendations
 */
function generateCulturalRecommendations(experiences, regionalProfile, userPreferences) {
  const recommendations = [];

  // Top authentic experiences
  const topAuthentic = experiences
    .filter(exp => (exp.culturalMetadata?.authenticityScore || 0) >= 8)
    .slice(0, 3);
  
  if (topAuthentic.length > 0) {
    recommendations.push({
      category: 'Most Authentic',
      description: 'Highly rated authentic cultural experiences',
      experiences: topAuthentic
    });
  }

  // Traditional heritage experiences
  const traditional = experiences
    .filter(exp => 
      exp.culturalMetadata?.heritage === 'Traditional' || 
      exp.culturalMetadata?.heritage === 'Indigenous'
    )
    .slice(0, 3);
  
  if (traditional.length > 0) {
    recommendations.push({
      category: 'Traditional Heritage',
      description: 'Experience traditional and indigenous culture',
      experiences: traditional
    });
  }

  // Community-involved experiences
  const community = experiences
    .filter(exp => exp.culturalMetadata?.localCommunityInvolvement)
    .slice(0, 3);
  
  if (community.length > 0) {
    recommendations.push({
      category: 'Community Experiences',
      description: 'Support local communities through authentic experiences',
      experiences: community
    });
  }

  return recommendations;
}

/**
 * Get default regional profile for unknown regions
 */
function getDefaultRegionalProfile(state) {
  return {
    heritage: ['Traditional', 'Contemporary'],
    traditions: ['Festival', 'Cuisine', 'Craft'],
    experienceTypes: ['Hands-on', 'Observational', 'Interactive'],
    culturalSignificance: 'Medium',
    authenticityScore: 6,
    regionalTags: [],
    seasonalHighlights: {},
    languages: ['English'],
    communityInvolvement: false
  };
}

/**
 * Get authenticity level description
 */
function getAuthenticityLevel(score) {
  if (score >= 9) return 'Highly Authentic';
  if (score >= 7) return 'Authentic';
  if (score >= 5) return 'Moderately Authentic';
  return 'Tourist-Oriented';
}

/**
 * Match user cultural profile to regional experiences
 */
async function matchUserToCulturalExperiences(userId, region, state, district) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user's cultural profile
    const userPreferences = user.personalizationProfile || {};
    const culturalInterests = userPreferences.culturalInterests || [];

    // Get past trip experiences to understand preferences
    const pastTrips = await Trip.find({ user: userId, paymentStatus: 'Completed' })
      .populate('schedule.activities.experienceId')
      .limit(5);

    const pastCulturalInterests = [];
    pastTrips.forEach(trip => {
      trip.schedule.forEach(day => {
        day.activities.forEach(activity => {
          if (activity.experienceId?.culturalMetadata) {
            const metadata = activity.experienceId.culturalMetadata;
            if (metadata.heritage) pastCulturalInterests.push(metadata.heritage);
            if (metadata.traditions) {
              pastCulturalInterests.push(...metadata.traditions);
            }
          }
        });
      });
    });

    // Combine user preferences
    const allCulturalInterests = [...culturalInterests, ...pastCulturalInterests];
    const uniqueInterests = [...new Set(allCulturalInterests)];

    // Discover cultural experiences
    const discovery = await discoverCulturalExperiences({
      region,
      state,
      district,
      userPreferences: {
        preferredHeritage: userPreferences.preferredHeritage || [],
        experiencePreferences: userPreferences.experiencePreferences || {},
        authenticityThreshold: userPreferences.experiencePreferences?.valueSeeking 
          ? (10 - userPreferences.experiencePreferences.valueSeeking) 
          : 6
      },
      culturalInterests: uniqueInterests
    });

    return discovery;
  } catch (error) {
    console.error('Error matching user to cultural experiences:', error);
    throw error;
  }
}

/**
 * Get seasonal cultural recommendations
 */
function getSeasonalCulturalRecommendations(state, currentDate = new Date()) {
  const regionalProfile = REGIONAL_CULTURAL_PROFILES[state];
  if (!regionalProfile) return [];

  const month = currentDate.getMonth();
  let season = '';

  // Determine season (simplified)
  if (month >= 6 && month <= 9) {
    season = 'Monsoon';
  } else if (month >= 10 && month <= 12) {
    season = 'Harvest';
  } else if (month >= 0 && month <= 2) {
    season = 'Festival Season';
  } else {
    season = 'Peak Season';
  }

  const seasonalHighlights = regionalProfile.seasonalHighlights[season] || [];
  
  return {
    season,
    recommendations: seasonalHighlights,
    description: `Best cultural experiences during ${season} in ${state}`
  };
}

module.exports = {
  discoverCulturalExperiences,
  matchUserToCulturalExperiences,
  getSeasonalCulturalRecommendations,
  REGIONAL_CULTURAL_PROFILES,
  CULTURAL_EXPERIENCE_PATTERNS,
  calculateCulturalMatchScore,
  getAuthenticityLevel
};

