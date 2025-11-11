const axios = require('axios');
const { scheduleTrip } = require('./scheduler');
const Experience = require('../models/Experience');
const Review = require('../models/Review');

/**
 * Gumo.ai-like AI-Powered Scheduling Engine
 * Uses AI to intelligently optimize trip schedules based on multiple factors
 */

// Check if OpenAI API key is available
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_AI = !!OPENAI_API_KEY;

/**
 * Generate AI-optimized schedule using OpenAI
 */
async function generateAISchedule({
  experiences,
  fromDate,
  toDate,
  preferences,
  locations,
  existingSchedule = null
}) {
  if (!USE_AI) {
    console.log('OpenAI API key not found, using rule-based optimization');
    return null;
  }

  try {
    // Prepare context for AI
    const context = {
      tripDuration: Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1,
      experiences: experiences.map(exp => ({
        id: exp._id.toString(),
        title: exp.title,
        price: exp.price,
        duration: exp.duration || 2,
        location: {
          district: exp.location.district,
          state: exp.location.state,
          coordinates: exp.location.coordinates
        },
        rating: exp.provider?.rating || 0,
        availableDates: exp.availableDates || []
      })),
      preferences: {
        travelStyle: preferences.travelStyle || 'moderate',
        pace: preferences.pace || 'moderate',
        transport: preferences.transport || 'cab'
      },
      locations: locations,
      existingSchedule: existingSchedule
    };

    const prompt = `You are an AI trip planning assistant (like Gumo.ai) that creates optimized travel itineraries.

Given the following trip information:
- Duration: ${context.tripDuration} days
- Travel Style: ${context.preferences.travelStyle}
- Pace: ${context.preferences.pace}
- Locations: ${locations.map(l => `${l.district}, ${l.state}`).join(', ')}

Available Experiences:
${context.experiences.map((exp, idx) => `
${idx + 1}. ${exp.title}
   - Price: $${exp.price}
   - Duration: ${exp.duration} hours
   - Location: ${exp.location.district}, ${exp.location.state}
   - Rating: ${exp.rating}/5
`).join('')}

Optimization Goals:
1. Minimize travel time between activities
2. Group activities by location to reduce transportation
3. Respect user pace preference (${context.preferences.pace})
4. Balance budget with experience quality
5. Ensure logical flow (morning to evening activities)
6. Consider experience ratings and popularity

Provide an optimized day-by-day schedule in JSON format:
{
  "schedule": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [
        {
          "experienceId": "experience_id",
          "startTime": "HH:mm",
          "endTime": "HH:mm",
          "reason": "Why this activity fits here"
        }
      ],
      "optimizationNotes": "Why this day is optimized"
    }
  ],
  "totalEstimatedPrice": 0,
  "optimizationScore": 0.95,
  "insights": ["Key insights about the schedule"]
}

Return ONLY valid JSON, no additional text.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini', // Using cost-effective model
        messages: [
          {
            role: 'system',
            content: 'You are an expert travel itinerary optimizer. Always return valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent, logical outputs
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content.trim();
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
    const aiSchedule = JSON.parse(jsonStr);

    return aiSchedule;
  } catch (error) {
    console.error('AI scheduling error:', error.response?.data || error.message);
    return null; // Fallback to rule-based scheduler
  }
}

/**
 * Intelligent optimization using multiple algorithms
 */
function optimizeScheduleIntelligently({
  experiences,
  fromDate,
  toDate,
  preferences,
  locations
}) {
  const days = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24)) + 1;
  const optimizedSchedule = [];

  // Get reviews for popularity scoring
  const experienceIds = experiences.map(exp => exp._id);
  
  // Calculate experience scores (multi-factor)
  const experienceScores = experiences.map(exp => {
    let score = 0;
    
    // Factor 1: Provider rating (0-50 points)
    if (exp.provider?.rating) {
      score += exp.provider.rating * 10;
    }
    
    // Factor 2: Price value (budget-friendly gets boost for non-luxury)
    if (preferences.travelStyle !== 'luxury' && exp.price < 50) {
      score += 10;
    } else if (preferences.travelStyle === 'luxury' && exp.price > 100) {
      score += 10;
    }
    
    // Factor 3: Duration compatibility
    if (preferences.pace === 'fast' && exp.duration <= 3) {
      score += 5;
    } else if (preferences.pace === 'slow' && exp.duration >= 4) {
      score += 5;
    }
    
    // Factor 4: Location centrality (prefer central locations)
    // This would require location data analysis
    
    return {
      experience: exp,
      score: score
    };
  });

  // Sort by score
  experienceScores.sort((a, b) => b.score - a.score);

  // Group by location for efficient scheduling
  const locationGroups = {};
  experienceScores.forEach(({ experience }) => {
    const key = `${experience.location.district}-${experience.location.state}`;
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(experience);
  });

  // Create optimized schedule
  let experienceIndex = 0;
  let currentLocation = null;
  
  for (let day = 0; day < days; day++) {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + day);
    const dayActivities = [];
    
    // Determine experiences per day based on pace
    const experiencesPerDay = preferences.pace === 'fast' ? 3 : 2;
    
    // Try to group by location
    const locationKeys = Object.keys(locationGroups);
    if (locationKeys.length > 0) {
      // Use current location or switch to next
      if (!currentLocation || !locationGroups[currentLocation] || locationGroups[currentLocation].length === 0) {
        currentLocation = locationKeys[0];
      }
      
      const locationExps = locationGroups[currentLocation] || [];
      for (let i = 0; i < Math.min(experiencesPerDay, locationExps.length); i++) {
        if (experienceIndex >= experienceScores.length) break;
        
        const exp = locationExps[i] || experienceScores[experienceIndex]?.experience;
        if (!exp) break;
        
        // Calculate optimal time slot
        const startTime = dayActivities.length === 0 ? '09:00' : 
          addHours(dayActivities[dayActivities.length - 1].endTime, 0.5); // 30 min buffer
        
        dayActivities.push({
          experienceId: exp._id,
          title: exp.title,
          price: exp.price,
          startTime: startTime,
          endTime: addHours(startTime, exp.duration || 2),
          duration: exp.duration || 2,
          provider: {
            _id: exp.provider?._id || null,
            name: exp.provider?.name || 'Unknown'
          },
          location: exp.location
        });
        
        experienceIndex++;
      }
      
      // Remove used experiences from location group
      if (locationGroups[currentLocation]) {
        locationGroups[currentLocation] = locationGroups[currentLocation].slice(experiencesPerDay);
      }
    }
    
    optimizedSchedule.push({
      date: date.toISOString().split('T')[0],
      activities: dayActivities
    });
  }

  return optimizedSchedule;
}

/**
 * Add hours to time string
 */
function addHours(timeStr, hours) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + Math.round(hours * 60);
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
}

/**
 * Main AI-powered scheduling function
 * Combines AI optimization with rule-based fallback
 */
async function scheduleTripWithAI({
  experienceIds,
  fromDate,
  toDate,
  preferences,
  country,
  state,
  district,
  locations,
  guideId = null
}) {
  console.log('🤖 AI Scheduler (Gumo.ai-like) starting...');
  
  // First, get base schedule from rule-based scheduler
  const baseSchedule = await scheduleTrip({
    experienceIds,
    fromDate,
    toDate,
    preferences,
    country,
    state,
    district,
    locations,
    guideId
  });

  // If AI is available, try to enhance the schedule
  if (USE_AI && baseSchedule && baseSchedule.schedule) {
    try {
      // Fetch full experience details for AI
      const Experience = require('../models/Experience');
      const mongoose = require('mongoose');
      
      const experiences = await Experience.find({
        _id: { $in: experienceIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).populate('provider');

      const aiOptimized = await generateAISchedule({
        experiences,
        fromDate,
        toDate,
        preferences,
        locations: locations || [{ state, district }],
        existingSchedule: baseSchedule.schedule
      });

      if (aiOptimized && aiOptimized.schedule) {
        console.log('✅ AI optimization applied');
        // Merge AI insights with base schedule
        return {
          ...baseSchedule,
          schedule: mergeAISchedule(baseSchedule.schedule, aiOptimized.schedule, experiences),
          aiInsights: aiOptimized.insights || [],
          optimizationScore: aiOptimized.optimizationScore || 0.85
        };
      }
    } catch (error) {
      console.error('AI optimization failed, using base schedule:', error.message);
    }
  }

  // Fallback: Use intelligent rule-based optimization
  const Experience = require('../models/Experience');
  const mongoose = require('mongoose');
  
  const experiences = await Experience.find({
    _id: { $in: experienceIds.map(id => new mongoose.Types.ObjectId(id)) }
  }).populate('provider');

  const optimizedSchedule = optimizeScheduleIntelligently({
    experiences,
    fromDate,
    toDate,
    preferences,
    locations: locations || [{ state, district }]
  });

  if (optimizedSchedule && optimizedSchedule.length > 0) {
    return {
      ...baseSchedule,
      schedule: optimizedSchedule,
      aiInsights: ['Schedule optimized using intelligent algorithms'],
      optimizationScore: 0.80
    };
  }

  return baseSchedule;
}

/**
 * Merge AI schedule with base schedule
 */
function mergeAISchedule(baseSchedule, aiSchedule, experiences) {
  // Create experience lookup
  const expMap = {};
  experiences.forEach(exp => {
    expMap[exp._id.toString()] = exp;
  });

  // Merge AI recommendations with base schedule
  return baseSchedule.map((baseDay, dayIdx) => {
    const aiDay = aiSchedule.find(d => d.day === dayIdx + 1);
    
    if (aiDay && aiDay.activities) {
      // Use AI-optimized activities if available
      const mergedActivities = aiDay.activities.map(aiAct => {
        const exp = expMap[aiAct.experienceId];
        if (!exp) return null;

        return {
          experienceId: exp._id,
          title: exp.title,
          price: exp.price,
          startTime: aiAct.startTime || '09:00',
          endTime: aiAct.endTime || addHours(aiAct.startTime || '09:00', exp.duration || 2),
          duration: exp.duration || 2,
          provider: {
            _id: exp.provider?._id || null,
            name: exp.provider?.name || 'Unknown'
          },
          location: exp.location,
          aiReason: aiAct.reason // Store AI reasoning
        };
      }).filter(Boolean);

      return {
        ...baseDay,
        activities: mergedActivities.length > 0 ? mergedActivities : baseDay.activities,
        optimizationNotes: aiDay.optimizationNotes
      };
    }

    return baseDay;
  });
}

/**
 * Get AI-powered recommendations for free days
 */
async function getAIRecommendations({
  tripId,
  dayIndex,
  date,
  location,
  preferences,
  scheduledExperienceIds,
  existingSchedule
}) {
  if (!USE_AI) {
    return null; // Fallback to rule-based recommendations
  }

  try {
    const Experience = require('../models/Experience');
    const mongoose = require('mongoose');

    // Find available experiences
    const query = {
      'location.country': location.country,
      'location.state': location.state,
      'location.district': location.district
    };

    if (scheduledExperienceIds && scheduledExperienceIds.length > 0) {
      query._id = { $nin: scheduledExperienceIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const experiences = await Experience.find(query)
      .populate('provider', 'name rating')
      .limit(20);

    if (experiences.length === 0) {
      return null;
    }

    const prompt = `You are an AI travel recommendation engine. Given:
- Date: ${date}
- Location: ${location.district}, ${location.state}
- Travel Style: ${preferences.travelStyle || 'moderate'}
- Pace: ${preferences.pace || 'moderate'}
- Already scheduled: ${scheduledExperienceIds.length} experiences

Available experiences:
${experiences.map((exp, idx) => `
${idx + 1}. ${exp.title} - $${exp.price} - ${exp.duration || 2}h - Rating: ${exp.provider?.rating || 0}/5
`).join('')}

Recommend the top 6 experiences that:
1. Complement the existing schedule
2. Match user preferences
3. Are available on ${date}
4. Provide good value

Return JSON:
{
  "recommendations": [
    {
      "experienceId": "id",
      "score": 0.95,
      "reasons": ["reason1", "reason2"]
    }
  ]
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a travel recommendation expert. Return valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
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
    const aiRecs = JSON.parse(jsonStr);

    // Map to experience details
    const expMap = {};
    experiences.forEach(exp => {
      expMap[exp._id.toString()] = exp;
    });

    return aiRecs.recommendations
      .map(rec => {
        const exp = expMap[rec.experienceId];
        if (!exp) return null;

        return {
          _id: exp._id,
          title: exp.title,
          description: exp.description,
          price: exp.price,
          duration: exp.duration,
          imageUrl: exp.imageUrl,
          location: exp.location,
          provider: exp.provider ? {
            _id: exp.provider._id,
            name: exp.provider.name,
            rating: exp.provider.rating || 0
          } : null,
          score: rec.score,
          reasons: rec.reasons
        };
      })
      .filter(Boolean)
      .slice(0, 6);
  } catch (error) {
    console.error('AI recommendations error:', error.message);
    return null;
  }
}

module.exports = {
  scheduleTripWithAI,
  getAIRecommendations,
  USE_AI
};

