/**
 * Route Optimization API Routes
 * 
 * Provides endpoints for route optimization and real road routing
 */

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getOptimizedRoute, getOptimizedRoutesForDays } = require('../services/routeOptimizer');

const router = express.Router();

// Get optimized route for waypoints
router.post('/optimize', authenticate, async (req, res) => {
  try {
    const { waypoints } = req.body;
    
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 waypoints are required' 
      });
    }
    
    const optimizedRoute = await getOptimizedRoute(waypoints);
    
    res.json({
      success: true,
      route: optimizedRoute
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ 
      message: 'Error optimizing route', 
      error: error.message 
    });
  }
});

// Get optimized routes for multiple days
router.post('/optimize-days', authenticate, async (req, res) => {
  try {
    const { waypointsByDay } = req.body;
    
    if (!waypointsByDay || typeof waypointsByDay !== 'object') {
      return res.status(400).json({ 
        message: 'waypointsByDay object is required' 
      });
    }
    
    const optimizedRoutes = await getOptimizedRoutesForDays(waypointsByDay);
    
    res.json({
      success: true,
      routes: optimizedRoutes
    });
  } catch (error) {
    console.error('Route optimization error:', error);
    res.status(500).json({ 
      message: 'Error optimizing routes', 
      error: error.message 
    });
  }
});

module.exports = router;

