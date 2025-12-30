const mongoose = require('mongoose');

/**
 * Middleware to check if MongoDB is connected before processing requests
 * Returns a user-friendly error if database is not available
 */
const checkDBConnection = (req, res, next) => {
  const connectionState = mongoose.connection.readyState;
  
  // Mongoose connection states:
  // 0 = disconnected
  // 1 = connected
  // 2 = connecting
  // 3 = disconnecting
  
  if (connectionState === 0) {
    // Database is disconnected
    return res.status(503).json({ 
      message: 'Database connection unavailable. MongoDB is not running.',
      error: 'MongoDB connection error',
      details: 'Please ensure MongoDB is running or check your connection settings.'
    });
  }
  
  if (connectionState === 2) {
    // Database is connecting
    return res.status(503).json({ 
      message: 'Database is connecting. Please try again in a moment.',
      error: 'MongoDB connecting'
    });
  }
  
  // Connection is ready (state 1) or disconnecting (state 3 - allow through)
  next();
};

module.exports = checkDBConnection;

