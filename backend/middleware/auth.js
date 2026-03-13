const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');
const Provider = require('../models/Provider');

// Load and validate JWT secret once at startup
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Fail fast in all environments if JWT_SECRET is missing
  // so we never fall back to a weak, hardcoded secret.
  throw new Error('JWT_SECRET environment variable is required but not set.');
}

const authenticate = async (req, res, next) => {
  let token; // ensure token is in scope for error logging
  try {
    const authHeader = req.header('Authorization');
    token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Try to find user first
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.userType = 'user';
      return next();
    }

    // Try Provider model (for DRIVER_PARTNER, EXPERIENCE_HOST, GUIDE, etc.)
    const provider = await Provider.findById(decoded.userId);
    if (provider) {
      req.user = provider;
      req.userType = 'host'; // Keep 'host' for backward compatibility
      return next();
    }

    // If not provider, try legacy Host model (for backward compatibility)
    const host = await Host.findById(decoded.userId);
    if (host) {
      req.user = host;
      req.userType = 'host';
      return next();
    }

    return res.status(401).json({ message: 'Invalid token.' });
  } catch (error) {
    console.error('Authentication error:', error.message);
    console.error('Error name:', error.name);
    console.error('Token provided:', !!token);
    
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error - Token is malformed or invalid');
      return res.status(401).json({ 
        message: 'Invalid token. Token is malformed. Please log in again.',
        error: 'JsonWebTokenError',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      console.error('Token has expired');
      return res.status(401).json({ 
        message: 'Invalid token. Token has expired. Please log in again.',
        error: 'TokenExpiredError',
        code: 'TOKEN_EXPIRED'
      });
    }
    console.error('Unknown authentication error');
    res.status(401).json({ 
      message: 'Invalid token. Please log in again.',
      error: error.message || 'Unknown error',
      code: 'AUTH_ERROR'
    });
  }
};

const requireUser = (req, res, next) => {
  if (req.userType !== 'user') {
    return res.status(403).json({ message: 'Access denied. User account required.' });
  }
  next();
};

const requireHost = (req, res, next) => {
  if (req.userType !== 'host') {
    return res.status(403).json({ message: 'Access denied. Host account required.' });
  }
  next();
};

module.exports = { authenticate, requireUser, requireHost };

