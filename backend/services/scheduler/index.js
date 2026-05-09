/**
 * Scheduler Module Index
 * Main entry point for scheduler functionality
 */

const { scheduleTrip } = require('./core/scheduler');
const {
  calculateScheduleCost,
  optimizeScheduleForBudget,
  getBudgetBreakdown
} = require('./features/budgetOptimizer');

// Export main function for backward compatibility
module.exports = {
  scheduleTrip,
  calculateScheduleCost,
  optimizeScheduleForBudget,
  getBudgetBreakdown
};








