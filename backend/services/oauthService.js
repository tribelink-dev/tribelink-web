/**
 * OAuth Service
 * Modern, secure OAuth implementation with proper error handling, logging, and state management
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Host = require('../models/Host');
const bcrypt = require('bcryptjs');

// In-memory state store (in production, use Redis or database)
const oauthStates = new Map();

// State expiration time (5 minutes)
const STATE_EXPIRATION = 5 * 60 * 1000;

/**
 * Generate a secure state token for CSRF protection
 * @param {Object} metadata - Additional metadata to store with state
 * @returns {string} State token
 */
function generateStateToken(metadata = {}) {
  const state = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + STATE_EXPIRATION;
  
  oauthStates.set(state, {
    ...metadata,
    expiresAt,
    createdAt: Date.now()
  });
  
  // Clean up expired states periodically
  if (oauthStates.size > 1000) {
    cleanupExpiredStates();
  }
  
  return state;
}

/**
 * Validate and consume a state token
 * @param {string} state - State token to validate
 * @returns {Object|null} Metadata if valid, null if invalid/expired
 */
function validateStateToken(state) {
  if (!state) return null;
  
  const stateData = oauthStates.get(state);
  if (!stateData) {
    return null;
  }
  
  // Check expiration
  if (Date.now() > stateData.expiresAt) {
    oauthStates.delete(state);
    return null;
  }
  
  // Consume the state (one-time use)
  oauthStates.delete(state);
  return stateData;
}

/**
 * Clean up expired states
 */
function cleanupExpiredStates() {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now > data.expiresAt) {
      oauthStates.delete(state);
    }
  }
}

/**
 * Extract user profile from Google OAuth profile
 * @param {Object} profile - Google OAuth profile
 * @returns {Object} Normalized user profile
 */
function extractUserProfile(profile) {
  if (!profile || !profile.emails || !profile.emails[0]) {
    throw new Error('Invalid Google profile: missing email');
  }
  
  return {
    email: profile.emails[0].value.toLowerCase(),
    name: profile.displayName || 
          (profile.name ? `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim() : 'User'),
    googleId: profile.id,
    profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : null
  };
}

/**
 * Handle OAuth callback for users
 * @param {Object} profile - Google OAuth profile
 * @returns {Object} User data and action needed
 */
async function handleUserOAuth(profile) {
  try {
    const userProfile = extractUserProfile(profile);
    
    // Check if user exists
    let user = await User.findOne({ email: userProfile.email });
    
    if (user) {
      // Update Google ID and profile picture if not set
      const updates = {};
      if (!user.googleId) {
        updates.googleId = userProfile.googleId;
      }
      if (!user.profilePicture && userProfile.profilePicture) {
        updates.profilePicture = userProfile.profilePicture;
      }
      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates);
        await user.save();
      }
      
      // Check if user has phone number (required for full account)
      if (!user.phoneNumber) {
        return {
          action: 'complete_registration',
          needsPhoneNumber: true,
          email: userProfile.email,
          name: userProfile.name,
          googleId: userProfile.googleId
        };
      }
      
      // User is fully registered, generate token
      const token = generateJWT(user._id, 'user');
      return {
        action: 'login',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber
        }
      };
    }
    
    // New user - needs registration
    return {
      action: 'register',
      needsPhoneNumber: true,
      email: userProfile.email,
      name: userProfile.name,
      googleId: userProfile.googleId,
      profilePicture: userProfile.profilePicture
    };
  } catch (error) {
    console.error('[OAuth Service] Error handling user OAuth:', error);
    throw new Error(`OAuth processing failed: ${error.message}`);
  }
}

/**
 * Handle OAuth callback for hosts
 * @param {Object} profile - Google OAuth profile
 * @returns {Object} Host data and action needed
 */
async function handleHostOAuth(profile) {
  try {
    const userProfile = extractUserProfile(profile);
    
    // Check if host exists
    let host = await Host.findOne({ email: userProfile.email });
    
    if (host) {
      // Update Google ID and profile picture if not set
      const updates = {};
      if (!host.googleId) {
        updates.googleId = userProfile.googleId;
      }
      if (!host.profilePicture && userProfile.profilePicture) {
        updates.profilePicture = userProfile.profilePicture;
      }
      if (Object.keys(updates).length > 0) {
        Object.assign(host, updates);
        await host.save();
      }
      
      // Check if host has phone number (required for full account)
      if (!host.phoneNumber) {
        return {
          action: 'complete_registration',
          needsPhoneNumber: true,
          email: userProfile.email,
          name: userProfile.name,
          googleId: userProfile.googleId
        };
      }
      
      // Host is fully registered, generate token
      const token = generateJWT(host._id, 'host');
      return {
        action: 'login',
        token,
        host: {
          id: host._id,
          email: host.email,
          name: host.name,
          phoneNumber: host.phoneNumber,
          providerType: host.providerType
        }
      };
    }
    
    // New host - needs registration
    return {
      action: 'register',
      needsPhoneNumber: true,
      email: userProfile.email,
      name: userProfile.name,
      googleId: userProfile.googleId,
      profilePicture: userProfile.profilePicture
    };
  } catch (error) {
    console.error('[OAuth Service] Error handling host OAuth:', error);
    throw new Error(`OAuth processing failed: ${error.message}`);
  }
}

/**
 * Complete OAuth registration for users
 * @param {Object} data - Registration data
 * @returns {Object} User and token
 */
async function completeUserRegistration(data) {
  const { email, name, googleId, phoneNumber, profilePicture } = data;
  
  // Validate required fields
  if (!email || !phoneNumber || !googleId) {
    throw new Error('Email, phone number, and Google ID are required');
  }
  
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
    throw new Error('Invalid phone number format');
  }
  
  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { phoneNumber: normalizedPhone }
    ]
  });
  
  if (existingUser) {
    throw new Error('Account with this email or phone number already exists');
  }
  
  // Create user
  const user = new User({
    email: email.toLowerCase(),
    phoneNumber: normalizedPhone,
    name,
    googleId,
    password: await bcrypt.hash(googleId + Date.now(), 10), // Random password for OAuth users
    profilePicture: profilePicture || null,
    tripWallet: { balance: 0, currency: 'USD' },
    tokens: 2 // Give 2 tokens on signup
  });
  
  await user.save();
  
  const token = generateJWT(user._id, 'user');
  
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      name: user.name
    }
  };
}

/**
 * Complete OAuth registration for hosts
 * @param {Object} data - Registration data
 * @returns {Object} Host and token
 */
async function completeHostRegistration(data) {
  const { email, name, googleId, phoneNumber, providerType, profilePicture } = data;
  
  // Validate required fields
  if (!email || !phoneNumber || !googleId || !providerType) {
    throw new Error('Email, phone number, Google ID, and provider type are required');
  }
  
  // Validate provider type
  const validProviderTypes = ['EXPERIENCE_HOST', 'LOCAL_HOST'];
  if (!validProviderTypes.includes(providerType)) {
    throw new Error('Invalid provider type. Only Local Host and Experience Provider are allowed for signup.');
  }
  
  // Normalize phone number
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
    throw new Error('Invalid phone number format');
  }
  
  // Check if host already exists
  const existingHost = await Host.findOne({
    $or: [
      { email: email.toLowerCase() },
      { phoneNumber: normalizedPhone }
    ]
  });
  
  if (existingHost) {
    throw new Error('Host account with this email or phone number already exists');
  }
  
  // Create host
  const host = new Host({
    email: email.toLowerCase(),
    phoneNumber: normalizedPhone,
    name,
    googleId,
    password: await bcrypt.hash(googleId + Date.now(), 10), // Random password for OAuth users
    providerType,
    profilePicture: profilePicture || null
  });
  
  await host.save();
  
  const token = generateJWT(host._id, 'host');
  
  return {
    token,
    host: {
      id: host._id,
      email: host.email,
      phoneNumber: host.phoneNumber,
      name: host.name,
      providerType: host.providerType
    }
  };
}

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} userType - User type ('user' or 'host')
 * @returns {string} JWT token
 */
function generateJWT(userId, userType) {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET || 'fallback-secret-key',
    { expiresIn: '7d' }
  );
}

/**
 * Normalize phone number (matches auth.js implementation)
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  // Remove all whitespace, dashes, parentheses, dots, and other common separators
  return phoneNumber.replace(/[\s\-\(\)\.]/g, '').trim();
}

/**
 * Build redirect URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {string} path - Path
 * @param {Object} params - Query parameters
 * @returns {string} Full URL
 */
function buildRedirectUrl(baseUrl, path, params = {}) {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, encodeURIComponent(String(value)));
    }
  });
  return url.toString();
}

module.exports = {
  generateStateToken,
  validateStateToken,
  handleUserOAuth,
  handleHostOAuth,
  completeUserRegistration,
  completeHostRegistration,
  buildRedirectUrl,
  cleanupExpiredStates
};

