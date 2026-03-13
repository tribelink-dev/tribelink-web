const axios = require('axios');
const Experience = require('../models/Experience');
const Hotel = require('../models/Hotel');
// const DriverProvider = require('../models/DriverProvider'); // Removed - drivers no longer supported
const Trip = require('../models/Trip');
const User = require('../models/User');
const mongoose = require('mongoose');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_AI = !!OPENAI_API_KEY;
const isDev = process.env.NODE_ENV !== 'production';
const logDebug = (...args) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

/**
 * Pathfinder - Revolutionary AI Agent for Personalized Filtering
 * 
 * Pathfinder is Triberoutes's advanced AI-powered personalization system that
 * filters hundreds of options to the best 2-3 matches based on comprehensive user profiling.
 * It analyzes cultural interests, booking history, preferences, and travel patterns
 * to curate the most authentic, personalized experiences for each traveler's journey.
 */

/**
 * Build comprehensive user profile from multiple data sources
 */
async function buildUserProfile(userId) {
  const user = await User.findById(userId).populate('bucketlist').populate('bookings');
  
  if (!user) {
    throw new Error('User not found');
  }

  // Get all past trips with details
  const pastTrips = await Trip.find({ user: userId, paymentStatus: 'Completed' })
    .populate('schedule.activities.experienceId')
    .populate('schedule.hotel')
    // .populate('assignedDriverProfile') // Removed - drivers no longer supported
    .sort({ createdAt: -1 })
    .limit(10);

  // Analyze booking history
  const bookingAnalysis = analyzeBookingHistory(pastTrips);
  
  // Build comprehensive profile
  const profile = {
    userId: userId.toString(),
    kytPreferences: user.preferences || {},
    personalizationProfile: user.personalizationProfile || {},
    bookingHistory: {
      totalTrips: pastTrips.length,
      experiencesBooked: bookingAnalysis.experiences,
      hotelsBooked: bookingAnalysis.hotels,
      // driversBooked: bookingAnalysis.drivers, // Removed - drivers no longer supported
      averageSpending: bookingAnalysis.averageSpending,
      preferredRegions: bookingAnalysis.preferredRegions,
      culturalInterests: bookingAnalysis.culturalInterests,
      budgetPattern: bookingAnalysis.budgetPattern,
      accommodationPattern: bookingAnalysis.accommodationPattern,
      transportationPattern: bookingAnalysis.transportationPattern
    },
    bucketlistPreferences: analyzeBucketlist(user.bucketlist || []),
    travelPatterns: analyzeTravelPatterns(pastTrips)
  };

  return profile;
}

/**
 * Analyze booking history to extract patterns
 */
function analyzeBookingHistory(trips) {
  const analysis = {
    experiences: [],
    hotels: [],
    // drivers: [], // Removed - drivers no longer supported
    averageSpending: { experiences: 0, hotels: 0 }, // drivers removed
    preferredRegions: {},
    culturalInterests: {},
    budgetPattern: { min: Infinity, max: 0, average: 0 },
    accommodationPattern: {},
    transportationPattern: {}
  };

  let totalExpSpend = 0, totalHotelSpend = 0; // totalDriverSpend removed
  let expCount = 0, hotelCount = 0; // driverCount removed

  trips.forEach(trip => {
    // Analyze experiences
    trip.schedule.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.experienceId && activity.experienceId._id) {
          const exp = activity.experienceId;
          analysis.experiences.push({
            id: exp._id.toString(),
            price: activity.price || exp.price,
            culturalMetadata: exp.culturalMetadata || {},
            tags: exp.tags || []
          });
          
          totalExpSpend += (activity.price || exp.price);
          expCount++;

          // Extract cultural interests
          if (exp.culturalMetadata) {
            if (exp.culturalMetadata.heritage) {
              analysis.culturalInterests[exp.culturalMetadata.heritage] = 
                (analysis.culturalInterests[exp.culturalMetadata.heritage] || 0) + 1;
            }
            (exp.culturalMetadata.traditions || []).forEach(trad => {
              analysis.culturalInterests[trad] = (analysis.culturalInterests[trad] || 0) + 1;
            });
          }
        }
      });

      // Analyze hotels
      if (day.hotel && day.hotel._id) {
        const hotel = day.hotel;
        analysis.hotels.push({
          id: hotel._id.toString(),
          pricePerNight: hotel.pricePerNight,
          amenities: hotel.amenities || [],
          rating: hotel.rating || 0
        });
        
        totalHotelSpend += hotel.pricePerNight;
        hotelCount++;

        // Track accommodation patterns
        hotel.amenities.forEach(amenity => {
          analysis.accommodationPattern[amenity] = 
            (analysis.accommodationPattern[amenity] || 0) + 1;
        });
      }
    });

    // Driver analysis removed - drivers no longer supported

    // Track preferred regions
    const regionKey = `${trip.state}-${trip.district}`;
    analysis.preferredRegions[regionKey] = (analysis.preferredRegions[regionKey] || 0) + 1;
  });

  // Calculate averages
  analysis.averageSpending.experiences = expCount > 0 ? totalExpSpend / expCount : 0;
  analysis.averageSpending.hotels = hotelCount > 0 ? totalHotelSpend / hotelCount : 0;
  // analysis.averageSpending.drivers removed

  // Calculate budget pattern
  const allPrices = analysis.experiences.map(e => e.price)
    .concat(analysis.hotels.map(h => h.pricePerNight));
    // .concat(analysis.drivers.map(d => d.pricing.perDay || 0)); // Removed
  
  if (allPrices.length > 0) {
    analysis.budgetPattern.min = Math.min(...allPrices);
    analysis.budgetPattern.max = Math.max(...allPrices);
    analysis.budgetPattern.average = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
  }

  return analysis;
}

/**
 * Analyze bucketlist to understand interests
 */
function analyzeBucketlist(bucketlist) {
  const preferences = {
    culturalInterests: {},
    priceRange: { min: Infinity, max: 0 },
    heritageTypes: {},
    experienceTypes: {}
  };

  bucketlist.forEach(exp => {
    if (exp.culturalMetadata) {
      if (exp.culturalMetadata.heritage) {
        preferences.heritageTypes[exp.culturalMetadata.heritage] = 
          (preferences.heritageTypes[exp.culturalMetadata.heritage] || 0) + 1;
      }
      if (exp.culturalMetadata.experienceType) {
        preferences.experienceTypes[exp.culturalMetadata.experienceType] = 
          (preferences.experienceTypes[exp.culturalMetadata.experienceType] || 0) + 1;
      }
      (exp.culturalMetadata.traditions || []).forEach(trad => {
        preferences.culturalInterests[trad] = 
          (preferences.culturalInterests[trad] || 0) + 1;
      });
    }
    
    if (exp.price) {
      preferences.priceRange.min = Math.min(preferences.priceRange.min, exp.price);
      preferences.priceRange.max = Math.max(preferences.priceRange.max, exp.price);
    }
  });

  return preferences;
}

/**
 * Analyze travel patterns
 */
function analyzeTravelPatterns(trips) {
  if (trips.length === 0) {
    return {
      averageDuration: 0,
      preferredSeasons: {},
      tripFrequency: 0
    };
  }

  const durations = trips.map(t => {
    const days = Math.ceil((new Date(t.toDate) - new Date(t.fromDate)) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  });

  const averageDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

  // Calculate trip frequency (trips per month)
  if (trips.length > 1) {
    const firstTrip = new Date(trips[trips.length - 1].createdAt);
    const lastTrip = new Date(trips[0].createdAt);
    const monthsDiff = (lastTrip - firstTrip) / (1000 * 60 * 60 * 24 * 30);
    const tripFrequency = monthsDiff > 0 ? trips.length / monthsDiff : 0;
  }

  return {
    averageDuration: averageDuration,
    preferredSeasons: {}, // Could be enhanced with date analysis
    tripFrequency: trips.length
  };
}

/**
 * AI-Powered Experience Filtering
 * Filters hundreds of experiences to top 2-3 based on comprehensive user profile
 */
async function filterExperiencesAI(userId, experiences, context = {}) {
  if (!USE_AI || experiences.length === 0) {
    // Fallback: return top experiences by basic scoring
    const targetCount = context.targetCount || Math.min(3, experiences.length);
    logDebug(`[Pathfinder] AI disabled or no experiences, using fallback (returning ${targetCount})`);
    return experiences.slice(0, targetCount);
  }

  try {
    logDebug(`[Pathfinder] Starting AI filtering for ${experiences.length} experiences`);
    // Sort experiences consistently by _id to ensure deterministic ordering
    const sortedExperiences = [...experiences].sort((a, b) => {
      const idA = a._id?.toString() || a._id || '';
      const idB = b._id?.toString() || b._id || '';
      return idA.localeCompare(idB);
    });
    
    const userProfile = await buildUserProfile(userId);

    // Extract context information
    const tripDays = context.tripDays || 1;
    const pace = context.pace || 'normal';
    const targetCount = context.targetCount || Math.min(3, sortedExperiences.length);
    const maxExperiences = context.maxExperiences || targetCount;
    const userPrompt = context.prompt || null;
    
    // Calculate experiences per day based on pace
    const experiencesPerDay = pace === 'fast' ? 3.5 : 2.5;
    
    // Prepare context for AI
    const prompt = `You are Pathfinder, Triberoutes's intelligent travel curator and trip planner. Your PRIMARY GOAL is to maximize the number of high-quality experiences that can fit into the traveler's ${tripDays}-day trip, while ensuring each experience is personalized and culturally authentic.

TRAVELER PROFILE:
- KYT Preferences: ${JSON.stringify(userProfile.kytPreferences)}
- Cultural Interests: ${JSON.stringify(userProfile.bookingHistory.culturalInterests)}
- Budget Pattern: Average $${userProfile.bookingHistory.averageSpending.experiences.toFixed(2)} per experience
- Preferred Heritage Types: ${Object.keys(userProfile.bookingHistory.culturalInterests).join(', ')}
- Travel Style: ${userProfile.kytPreferences.travelStyle || 'unknown'}
- Pace: ${pace} (${pace === 'fast' ? 'can handle 3-4 experiences per day' : 'prefers 2-3 experiences per day'})

TRIP DETAILS:
- Trip Duration: ${tripDays} day${tripDays > 1 ? 's' : ''}
- Target: Select up to ${targetCount} experiences (max ${maxExperiences} can fit)
- Experiences per day: ~${experiencesPerDay.toFixed(1)} (based on ${pace} pace)
- Goal: Fill all ${tripDays} days with as many quality experiences as possible

USER'S FREE-TEXT PREFERENCES (if provided):
${userPrompt ? userPrompt : 'None provided'}

AVAILABLE EXPERIENCES (${sortedExperiences.length}):
${sortedExperiences.map((exp, idx) => `
${idx + 1}. ${exp.title}
   - Price: $${exp.price}
   - Duration: ${exp.duration || 2} hours
   - Location: ${exp.location.district}, ${exp.location.state}
   - Cultural Heritage: ${exp.culturalMetadata?.heritage || 'Not specified'}
   - Traditions: ${(exp.culturalMetadata?.traditions || []).join(', ') || 'None'}
   - Experience Type: ${exp.culturalMetadata?.experienceType || 'Not specified'}
   - Authenticity Score: ${exp.culturalMetadata?.authenticityScore || 5}/10
   - Rating: ${exp.averageRating || 0}/5
   - Tags: ${(exp.tags || []).join(', ') || 'None'}
`).join('')}

CONTEXT:
${JSON.stringify(context)}

YOUR PRIMARY TASK: Select the MAXIMUM number of experiences (up to ${targetCount}) that can be scheduled across ${tripDays} days, prioritizing:
1. **MAXIMIZING QUANTITY**: Select as many experiences as possible (up to ${targetCount}) to fill all ${tripDays} days
2. **Cultural interest alignment**: Heritage, traditions, experience type matching traveler's interests
3. **Budget compatibility**: Prefer experiences within ±30% of average spending, but include variety
4. **Travel style and pace compatibility**: Ensure experiences match the ${pace} pace preference
5. **Authenticity and cultural significance**: Prioritize authentic cultural experiences
6. **Overall value and rating**: Balance quality with quantity
7. **Location diversity**: If multiple locations, include experiences from different areas
8. **Duration variety**: Mix shorter and longer experiences to optimize daily schedules

IMPORTANT INSTRUCTIONS:
- Select ${targetCount} experiences if possible (to maximize trip value)
- If fewer high-quality matches exist, select the best available (minimum 2-3)
- Consider that experiences can be scheduled across different days
- Ensure variety in experience types, locations, and durations
- Be consistent - for the same traveler profile and same experience list, always select the same matches
- Use the exact index numbers from the list above (1, 2, 3, etc.)

Return ONLY valid JSON:
{
  "selectedExperiences": [
    {
      "index": 1,
      "matchScore": 0.95,
      "reasons": ["reason1", "reason2", "reason3"]
    },
    {
      "index": 2,
      "matchScore": 0.90,
      "reasons": ["reason1", "reason2"]
    }
    // ... continue for up to ${targetCount} experiences
  ],
  "insights": "A brief explanation from Pathfinder about how these ${targetCount} experiences will create a rich, full itinerary across ${tripDays} days"
}`;

    console.log('[Pathfinder] Calling OpenAI API...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are Pathfinder, Triberoutes\'s intelligent travel curator. You help travelers discover authentic cultural experiences through personalized curation. Always return valid JSON only. Select experiences that create authentic, culturally rich travel experiences. Provide helpful, conversational explanations as if personally recommending these experiences.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000 // Increased for selecting more experiences
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );
    console.log('[Pathfinder] OpenAI API response received');

    const content = response.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const aiResult = JSON.parse(jsonStr);

    // Map AI selections back to experiences using sorted array (targetCount already extracted above)
    const selectedExperiences = aiResult.selectedExperiences
      .map(selection => {
        const idx = selection.index - 1; // Convert to 0-based
        if (idx >= 0 && idx < sortedExperiences.length) {
          return {
            ...sortedExperiences[idx],
            matchScore: selection.matchScore,
            aiReasons: selection.reasons,
            aiInsights: aiResult.insights
          };
        }
        console.warn(`AI returned invalid index ${selection.index} for experience list of length ${sortedExperiences.length}`);
        return null;
      })
      .filter(Boolean)
      .slice(0, targetCount); // Allow up to targetCount experiences

    // Sort by match score descending for consistent ordering
    selectedExperiences.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return selectedExperiences;
  } catch (error) {
    console.error('[Pathfinder] AI experience filtering error:', error.message);
    console.error('[Pathfinder] Error details:', error.response?.data || error);
    
    // Check if it's a timeout error
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      logDebug('[Pathfinder] Request timeout, falling back to rule-based filtering');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      logDebug('[Pathfinder] API key issue, falling back to rule-based filtering');
    }
    
    // Fallback to rule-based filtering
    try {
      const userProfile = await buildUserProfile(userId);
      const targetCount = context.targetCount || Math.min(3, experiences.length);
      const fallbackResults = await filterExperiencesRuleBased(userId, experiences, userProfile, targetCount);
      logDebug(`[Pathfinder] Fallback returned ${fallbackResults.length} experiences`);
      return fallbackResults;
    } catch (fallbackError) {
      console.error('[Pathfinder] Fallback filtering also failed:', fallbackError);
      // Last resort: return top experiences up to target count
      const targetCount = context.targetCount || Math.min(3, experiences.length);
      return experiences.slice(0, targetCount);
    }
  }
}

/**
 * Rule-based fallback for experience filtering
 */
async function filterExperiencesRuleBased(userId, experiences, userProfile, targetCount = 3) {
  // Score each experience
  const scored = experiences.map(exp => {
    let score = 0;

    // Cultural interest match (40 points)
    const culturalInterests = userProfile.bookingHistory.culturalInterests || {};
    if (exp.culturalMetadata?.heritage && culturalInterests[exp.culturalMetadata.heritage]) {
      score += 20;
    }
    (exp.culturalMetadata?.traditions || []).forEach(trad => {
      if (culturalInterests[trad]) {
        score += 10;
      }
    });

    // Budget compatibility (30 points)
    const avgSpend = userProfile.bookingHistory.averageSpending.experiences || 50;
    const priceDiff = Math.abs(exp.price - avgSpend) / avgSpend;
    if (priceDiff <= 0.3) {
      score += 30;
    } else if (priceDiff <= 0.5) {
      score += 20;
    } else {
      score += 10;
    }

    // Rating (20 points)
    score += (exp.averageRating || 0) * 4;

    // Authenticity (10 points)
    score += (exp.culturalMetadata?.authenticityScore || 5) * 1;

    return { experience: exp, score };
  });

  // Sort by score and return top experiences up to target count
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, targetCount).map(item => item.experience);
}

/**
 * Pathfinder - Hotel Filtering
 * Filters hotels to top 2-3 matches based on user profile
 */
async function filterHotelsAI(userId, hotels, context = {}) {
  if (!USE_AI || hotels.length === 0) {
    return hotels.slice(0, 3);
  }

  try {
    const userProfile = await buildUserProfile(userId);

    const prompt = `You are Pathfinder, Triberoutes's intelligent travel curator. Filter ${hotels.length} hotels to the TOP 2-3 BEST matches for this traveler.

TRAVELER PROFILE:
- Average Hotel Spending: $${userProfile.bookingHistory.averageSpending.hotels.toFixed(2)}/night
- Preferred Amenities: ${Object.keys(userProfile.bookingHistory.accommodationPattern).sort((a, b) => 
  (userProfile.bookingHistory.accommodationPattern[b] || 0) - (userProfile.bookingHistory.accommodationPattern[a] || 0)
).slice(0, 5).join(', ')}
- Travel Style: ${userProfile.kytPreferences.travelStyle || 'unknown'}
- Budget Pattern: $${userProfile.bookingHistory.budgetPattern.min}-$${userProfile.bookingHistory.budgetPattern.max}

AVAILABLE HOTELS (${hotels.length}):
${hotels.map((hotel, idx) => `
${idx + 1}. ${hotel.name}
   - Price/Night: $${hotel.pricePerNight}
   - Rating: ${hotel.rating || 0}/5
   - Amenities: ${(hotel.amenities || []).join(', ')}
   - Location: ${hotel.location.district}, ${hotel.location.state}
   - Rooms Available: ${hotel.roomsAvailable}
`).join('')}

Select TOP 2-3 hotels based on:
1. Budget compatibility (±30% of average spending)
2. Amenity preferences match
3. Value for money (rating vs price)
4. Availability

Return JSON:
{
  "selectedHotels": [
    {
      "index": 1,
      "matchScore": 0.95,
      "reasons": ["reason1", "reason2"]
    }
  ]
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Pathfinder, Triberoutes\'s intelligent travel curator specializing in hotel recommendations. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const aiResult = JSON.parse(jsonStr);

    return aiResult.selectedHotels
      .map(selection => {
        const idx = selection.index - 1;
        if (idx >= 0 && idx < hotels.length) {
          return {
            ...hotels[idx],
            matchScore: selection.matchScore,
            aiReasons: selection.reasons
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 3);
  } catch (error) {
    console.error('AI hotel filtering error:', error.message);
    return filterHotelsRuleBased(userId, hotels, await buildUserProfile(userId));
  }
}

/**
 * Rule-based hotel filtering fallback
 */
async function filterHotelsRuleBased(userId, hotels, userProfile) {
  const avgSpend = userProfile.bookingHistory.averageSpending.hotels || 100;
  const preferredAmenities = Object.keys(userProfile.bookingHistory.accommodationPattern || {})
    .sort((a, b) => (userProfile.bookingHistory.accommodationPattern[b] || 0) - (userProfile.bookingHistory.accommodationPattern[a] || 0))
    .slice(0, 3);

  const scored = hotels.map(hotel => {
    let score = 0;

    // Budget match (40 points)
    const priceDiff = Math.abs(hotel.pricePerNight - avgSpend) / avgSpend;
    if (priceDiff <= 0.3) score += 40;
    else if (priceDiff <= 0.5) score += 30;
    else score += 20;

    // Amenity match (30 points)
    preferredAmenities.forEach(amenity => {
      if (hotel.amenities && hotel.amenities.includes(amenity)) {
            score += 10;
          }
    });

    // Rating (20 points)
    score += (hotel.rating || 0) * 4;

    // Availability (10 points)
    if (hotel.roomsAvailable > 0) score += 10;

    return { hotel, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(item => item.hotel);
}

/**
 * Pathfinder - Chauffeur/Driver Filtering
 * DEPRECATED: Drivers no longer supported - function kept for backward compatibility
 */
async function filterDriversAI(userId, drivers, context = {}) {
  // Drivers no longer supported - return empty array
  return [];
}

/**
 * Rule-based driver filtering fallback
 * DEPRECATED: Drivers no longer supported
 */
async function filterDriversRuleBased(userId, drivers, userProfile) {
  // Drivers no longer supported - return empty array
  return [];
}

/**
 * Update user personalization profile based on new booking
 */
async function updatePersonalizationProfile(userId, bookingData) {
  const user = await User.findById(userId);
  if (!user) return;

  const profile = user.personalizationProfile || {};

  // Update budget patterns
  if (bookingData.experiencePrice) {
    const currentAvg = profile.budgetPattern?.averageSpent || 0;
    const count = user.bookings?.length || 0;
    profile.budgetPattern = profile.budgetPattern || {};
    profile.budgetPattern.averageSpent = 
      (currentAvg * count + bookingData.experiencePrice) / (count + 1);
  }

  // Update cultural interests
  if (bookingData.culturalMetadata) {
    profile.culturalInterests = profile.culturalInterests || [];
    if (bookingData.culturalMetadata.heritage && 
        !profile.culturalInterests.includes(bookingData.culturalMetadata.heritage)) {
      profile.culturalInterests.push(bookingData.culturalMetadata.heritage);
    }
  }

  profile.lastUpdated = new Date();
  user.personalizationProfile = profile;
  await user.save();
}

module.exports = {
  buildUserProfile,
  filterExperiencesAI,
  filterHotelsAI,
  filterDriversAI,
  updatePersonalizationProfile,
  USE_AI
};

