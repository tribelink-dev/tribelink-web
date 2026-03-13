const express = require('express');
const LocalHost = require('../models/LocalHost');
const Experience = require('../models/Experience');
const { authenticate, requireUser } = require('../middleware/auth');
const { matchUserToCulturalExperiences } = require('../services/culturalMatchingEngine');

const router = express.Router();

// Helper to compute simple match score for an abode
function computeAbodeMatchScore({ rating, ratingCount, availabilityCoverage, culturalScore }) {
  const safeRating = Math.max(0, Math.min(5, rating || 0));
  const ratingComponent = (safeRating / 5) * 40;

  const clampedCoverage = Math.max(0, Math.min(1, availabilityCoverage || 0));
  const coverageComponent = clampedCoverage * 30;

  const clampedCultural = Math.max(0, Math.min(100, culturalScore || 0));
  const culturalComponent = (clampedCultural / 100) * 30;

  return Math.round(ratingComponent + coverageComponent + culturalComponent);
}

// GET /api/planner/abodes/search
// Basic planner-focused search for abodes in a region/date range
router.get('/abodes/search', authenticate, requireUser, async (req, res) => {
  try {
    const { country = 'India', state, district = '', fromDate, toDate, guests = 2 } = req.query;

    if (!state || !fromDate || !toDate) {
      return res.status(400).json({
        message: 'state, fromDate, and toDate are required',
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return res.status(400).json({ message: 'Invalid fromDate or toDate' });
    }

    // Basic location filter (district optional for state-wide searches)
    const query = {
      'location.country': country,
      'location.state': state,
      isArchived: false,
      'abodeDetails.capacity': { $gte: Number(guests) || 1 },
    };

    if (district && district.trim() !== '') {
      query['location.district'] = district;
    }

    const abodes = await LocalHost.find(query)
      .populate('linkedExperiences')
      .lean();

    if (!abodes.length) {
      return res.json({ abodes: [], total: 0 });
    }

    const tripNights = Math.max(
      1,
      Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Optional cultural matching (best-effort; falls back gracefully)
    let culturalProfilesByAbodeId = {};
    try {
      const sampleAbode = abodes[0];
      const stateForEngine = sampleAbode.location?.state;
      const districtForEngine = sampleAbode.location?.district || null;
      if (stateForEngine) {
        const culturalMatch = await matchUserToCulturalExperiences(
          req.user._id,
          stateForEngine,
          stateForEngine,
          districtForEngine
        );
        const byId = {};
        (culturalMatch?.experiences || []).forEach((exp) => {
          (exp.linkedToAbodes || []).forEach((abodeId) => {
            const key = abodeId.toString();
            if (!byId[key]) {
              byId[key] = 0;
            }
            byId[key] = Math.max(byId[key], exp.culturalMatchScore || 0);
          });
        });
        culturalProfilesByAbodeId = byId;
      }
    } catch (err) {
      // Cultural engine is best-effort; log and continue
      console.error('[plannerAbodes] cultural matching error:', err.message);
    }

    const results = abodes.map((abode) => {
      // Compute availability coverage across requested nights
      const availabilityByDate = new Map();
      (abode.availability || []).forEach((slot) => {
        const d = new Date(slot.date);
        const key = d.toISOString().split('T')[0];
        availabilityByDate.set(key, slot);
      });

      let availableNights = 0;
      const cursor = new Date(from);
      while (cursor < to) {
        const key = cursor.toISOString().split('T')[0];
        const slot = availabilityByDate.get(key);
        if (slot && slot.available !== false) {
          availableNights += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      const availabilityCoverage = tripNights > 0 ? availableNights / tripNights : 0;

      const culturalScore =
        culturalProfilesByAbodeId[abode._id.toString()] || 0;

      const matchScore = computeAbodeMatchScore({
        rating: abode.rating,
        ratingCount: abode.ratingCount,
        availabilityCoverage,
        culturalScore,
      });

      // Determine core vs add-on experiences
      const linkedExperiences = abode.linkedExperiences || [];
      const bundle = abode.bundleMetadata || {};

      const defaultCoreIds = (bundle.defaultCoreExperienceIds || []).map((id) =>
        id.toString()
      );
      const recommendedAddOnIds = (bundle.recommendedAddOnExperienceIds || []).map(
        (id) => id.toString()
      );

      const coreExperiences = [];
      const addOnExperiences = [];

      linkedExperiences.forEach((exp) => {
        const idStr = exp._id.toString();
        if (defaultCoreIds.includes(idStr)) {
          coreExperiences.push(exp);
        } else if (recommendedAddOnIds.includes(idStr)) {
          addOnExperiences.push(exp);
        } else {
          // Fallback: treat first 1–2 as core if no explicit metadata
          if (!defaultCoreIds.length && coreExperiences.length < 2) {
            coreExperiences.push(exp);
          } else {
            addOnExperiences.push(exp);
          }
        }
      });

      return {
        abode,
        coreExperiences,
        addOnExperiences,
        matchScore,
        availabilityCoverage,
        culturalScore,
      };
    });

    // Sort by matchScore desc
    results.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      abodes: results,
      total: results.length,
      fromDate,
      toDate,
      country,
      state,
      district,
    });
  } catch (error) {
    console.error('[plannerAbodes] search error:', error);
    res.status(500).json({
      message: 'Failed to search abodes for planner',
      error: error.message,
    });
  }
});

// POST /api/planner/abodes/preview
// Lightweight preview of abode + nearby standalone experiences
router.post('/abodes/preview', authenticate, requireUser, async (req, res) => {
  try {
    const { segments } = req.body;
    if (!Array.isArray(segments) || !segments.length) {
      return res.status(400).json({ message: 'segments array is required' });
    }

    const results = [];

    for (const segment of segments) {
      const { segmentId, abodeId, fromDate, toDate } = segment;
      if (!abodeId || !fromDate || !toDate) {
        continue;
      }

      const from = new Date(fromDate);
      const to = new Date(toDate);
      const nights = Math.max(
        1,
        Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
      );

      const abode = await LocalHost.findById(abodeId)
        .populate('linkedExperiences')
        .lean();
      if (!abode) continue;

      const coreExperiences = abode.linkedExperiences || [];

      // Find nearby standalone experiences within same state/district
      const expQuery = {
        'location.country': abode.location.country,
        'location.state': abode.location.state,
        isArchived: false,
      };
      if (abode.location.district) {
        expQuery['location.district'] = abode.location.district;
      }

      const pureExperiences = await Experience.find(expQuery)
        .limit(40)
        .lean();

      // Simple per-day preview: 1–2 abode experiences + 1–2 pure experiences
      const days = [];
      const corePerDay = Math.max(0, Math.min(2, coreExperiences.length));
      const purePerDay = 2;

      let coreIndex = 0;
      let pureIndex = 0;

      const dateCursor = new Date(from);
      for (let i = 0; i < nights; i += 1) {
        const dayDate = new Date(dateCursor);
        const dayCore = [];
        const dayPure = [];

        for (let c = 0; c < corePerDay && coreIndex < coreExperiences.length; c += 1) {
          dayCore.push(coreExperiences[coreIndex]);
          coreIndex += 1;
        }
        for (let p = 0; p < purePerDay && pureIndex < pureExperiences.length; p += 1) {
          dayPure.push(pureExperiences[pureIndex]);
          pureIndex += 1;
        }

        days.push({
          date: dayDate,
          abodeId,
          segmentId: segmentId || null,
          coreExperiences: dayCore,
          pureExperiences: dayPure,
        });

        dateCursor.setDate(dateCursor.getDate() + 1);
      }

      results.push({
        segmentId: segmentId || null,
        abode,
        fromDate,
        toDate,
        days,
      });
    }

    res.json({
      segments: results,
    });
  } catch (error) {
    console.error('[plannerAbodes] preview error:', error);
    res.status(500).json({
      message: 'Failed to build abode previews for planner',
      error: error.message,
    });
  }
});

module.exports = router;

