/**
 * Enhanced AI Scheduler with Validation Layer
 * Provides hybrid AI + rule-based approach with validation
 */

const { validateSchedule } = require('../validation/scheduleValidator');
const { scheduleTrip } = require('../core/scheduler');

/**
 * Validate AI-generated schedule before applying
 */
function validateAISchedule(aiSchedule, experiences, hotels, guide, preferences) {
  // Check if AI schedule has required structure
  if (!aiSchedule || !aiSchedule.schedule || !Array.isArray(aiSchedule.schedule)) {
    return {
      valid: false,
      reason: 'Invalid AI schedule structure'
    };
  }
  
  // Validate each day
  const validation = validateSchedule(aiSchedule.schedule, experiences, hotels, guide, preferences);
  
  // Only accept if quality score is reasonable
  if (validation.quality.score < 50) {
    return {
      valid: false,
      reason: `AI schedule quality too low: ${validation.quality.score}`,
      quality: validation.quality
    };
  }
  
  return {
    valid: validation.valid && validation.quality.score >= 50,
    validation,
    quality: validation.quality
  };
}

/**
 * Hybrid AI scheduling with validation
 */
async function scheduleTripWithAIValidated({
  experienceIds,
  fromDate,
  toDate,
  preferences,
  country,
  state,
  district,
  locations,
  guideId = null,
  guidePricingMode = 'daily',
  userId = null,
  aiSchedulerFunction = null
}) {
  // First, get base schedule from rule-based scheduler
  let baseSchedule;
  try {
    console.log('[AI Scheduler Enhanced] Calling base scheduler...');
    baseSchedule = await scheduleTrip({
      experienceIds,
      fromDate,
      toDate,
      preferences,
      country,
      state,
      district,
      locations,
      guideId,
      guidePricingMode,
      userId
    });
    console.log('[AI Scheduler Enhanced] Base scheduler completed:', {
      scheduleDays: baseSchedule?.schedule?.length || 0
    });
  } catch (error) {
    console.error('[AI Scheduler Enhanced] Base scheduler failed:', error);
    console.error('[AI Scheduler Enhanced] Error details:', {
      message: error.message,
      experienceIdsCount: experienceIds?.length || 0
    });
    // Re-throw with context
    throw new Error(`Failed to create base schedule: ${error.message}`);
  }
  
  // If AI scheduler function is provided, try to enhance
  if (aiSchedulerFunction && baseSchedule && baseSchedule.schedule) {
    try {
      const Experience = require('../../../models/Experience');
      const mongoose = require('mongoose');
      
      const experiences = await Experience.find({
        _id: { $in: experienceIds.map(id => new mongoose.Types.ObjectId(id)) }
      }).populate('provider');
      
      const Hotel = require('../../../models/Hotel');
      const hotels = baseSchedule.availableHotels || [];
      
      const Host = require('../../../models/Host');
      let guide = null;
      if (guideId) {
        guide = await Host.findById(guideId);
      }
      
      // Get AI optimized schedule
      const aiOptimized = await aiSchedulerFunction({
        experiences,
        fromDate,
        toDate,
        preferences,
        locations: locations || [{ state, district }],
        existingSchedule: baseSchedule.schedule
      });
      
      if (aiOptimized && aiOptimized.schedule) {
        // Merge AI schedule with base schedule to ensure proper ObjectIds
        const { mergeAISchedule } = require('../../aiScheduler');
        const mergedSchedule = mergeAISchedule(
          baseSchedule.schedule,
          aiOptimized.schedule,
          experiences
        );
        
        // Validate merged schedule
        const validation = validateAISchedule(
          { ...aiOptimized, schedule: mergedSchedule },
          experiences,
          hotels,
          guide,
          preferences
        );
        
        if (validation.valid && mergedSchedule.length > 0) {
          console.log('✅ AI optimization applied and validated');
          return {
            ...baseSchedule,
            schedule: mergedSchedule,
            aiInsights: aiOptimized.insights || [],
            optimizationScore: aiOptimized.optimizationScore || validation.quality.score / 100,
            validation: validation.validation,
            aiValidated: true
          };
        } else {
          console.log(`⚠️ AI schedule validation failed: ${validation.reason || 'Invalid schedule'}, using base schedule`);
        }
      }
    } catch (error) {
      console.error('AI optimization failed, using base schedule:', error.message);
    }
  }
  
  // Return base schedule (already validated)
  return {
    ...baseSchedule,
    aiValidated: false,
    aiInsights: []
  };
}

module.exports = {
  validateAISchedule,
  scheduleTripWithAIValidated
};

