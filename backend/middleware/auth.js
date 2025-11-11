const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    
    // Try to find user first
    const user = await User.findById(decoded.userId);
    if (user) {
      req.user = user;
      req.userType = 'user';
      return next();
    }

    // If not user, try host
    const host = await Host.findById(decoded.userId);
    if (host) {
      req.user = host;
      req.userType = 'host';
      return next();
    }

    return res.status(401).json({ message: 'Invalid token.' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
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

