const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Host = require('../models/Host');
const jwt = require('jsonwebtoken');

/**
 * IMPORTANT: Google OAuth and Private IPs
 * 
 * Google OAuth does NOT allow redirect URIs to private IP addresses 
 * (172.16.x.x, 192.168.x.x, 10.x.x.x, etc.) without special device credentials.
 * 
 * If you need to test OAuth from other devices on your network:
 * 1. Use localhost on the server machine itself
 * 2. Use a public URL (e.g., ngrok, localtunnel, or a deployed URL)
 * 3. Set GOOGLE_CALLBACK_URL_USER and GOOGLE_CALLBACK_URL_HOST to public URLs
 * 
 * This code automatically converts private IPs to localhost to prevent OAuth errors.
 */

// Helper function to check if URL is a private IP
const isPrivateIP = (url) => {
  if (!url) return false;
  const privateIPPatterns = [
    /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^https?:\/\/192\.168\./,
    /^https?:\/\/10\./,
    /^https?:\/\/127\./,
    /^https?:\/\/169\.254\./,
  ];
  return privateIPPatterns.some(pattern => pattern.test(url));
};

// Helper function to convert private IP to localhost
const convertToLocalhost = (url) => {
  if (!url) return 'http://localhost:5000';
  try {
    const urlObj = new URL(url);
    urlObj.hostname = 'localhost';
    return urlObj.toString();
  } catch (e) {
    return 'http://localhost:5000';
  }
};

// Log OAuth configuration for debugging
console.log('[OAuth] Environment:', process.env.NODE_ENV || 'development');
console.log('[OAuth] BACKEND_URL:', process.env.BACKEND_URL || 'not set');

// Configure Google OAuth Strategy for Users
// Determine callback URL based on environment
const getUserCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL_USER) {
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL_USER;
    // Google OAuth doesn't allow private IPs - convert to localhost
    if (isPrivateIP(callbackUrl)) {
      console.warn('[OAuth] Private IP detected in GOOGLE_CALLBACK_URL_USER, converting to localhost');
      return convertToLocalhost(callbackUrl);
    }
    return callbackUrl;
  }
  // Production: Use Render backend URL
  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    const callbackUrl = `${process.env.BACKEND_URL}/api/auth/google/callback`;
    if (isPrivateIP(callbackUrl)) {
      console.warn('[OAuth] Private IP detected in BACKEND_URL, using localhost for OAuth callback');
      return 'http://localhost:5000/api/auth/google/callback';
    }
    return callbackUrl;
  }
  // Development: Use localhost (only works in development)
  // Always use localhost in development to avoid private IP issues
  return 'http://localhost:5000/api/auth/google/callback';
};

const userCallbackURL = getUserCallbackURL();
console.log('[OAuth] User callback URL:', userCallbackURL);

passport.use('google-user', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: userCallbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName || profile.name.givenName + ' ' + profile.name.familyName;
    const googleId = profile.id;

    // Check if user exists by email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update Google ID if not already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      return done(null, { user, type: 'user' });
    }

    // User doesn't exist - return profile info for registration
    return done(null, {
      email,
      name,
      googleId,
      type: 'user',
      needsPhoneNumber: true
    });
  } catch (error) {
    return done(error, null);
  }
}));

// Configure Google OAuth Strategy for Hosts
// Determine callback URL based on environment
const getHostCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL_HOST) {
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL_HOST;
    // Google OAuth doesn't allow private IPs - convert to localhost
    if (isPrivateIP(callbackUrl)) {
      console.warn('[OAuth] Private IP detected in GOOGLE_CALLBACK_URL_HOST, converting to localhost');
      return convertToLocalhost(callbackUrl);
    }
    return callbackUrl;
  }
  // Production: Use Render backend URL
  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    const callbackUrl = `${process.env.BACKEND_URL}/api/auth/google/host/callback`;
    if (isPrivateIP(callbackUrl)) {
      console.warn('[OAuth] Private IP detected in BACKEND_URL, using localhost for OAuth callback');
      return 'http://localhost:5000/api/auth/google/host/callback';
    }
    return callbackUrl;
  }
  // Development: Use localhost (only works in development)
  // Always use localhost in development to avoid private IP issues
  return 'http://localhost:5000/api/auth/google/host/callback';
};

const hostCallbackURL = getHostCallbackURL();
console.log('[OAuth] Host callback URL:', hostCallbackURL);

passport.use('google-host', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: hostCallbackURL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName || profile.name.givenName + ' ' + profile.name.familyName;
    const googleId = profile.id;

    // Check if host exists by email
    let host = await Host.findOne({ email: email.toLowerCase() });

    if (host) {
      // Update Google ID if not already set
      if (!host.googleId) {
        host.googleId = googleId;
        await host.save();
      }
      return done(null, { host, type: 'host' });
    }

    // Host doesn't exist - return profile info for registration
    return done(null, {
      email,
      name,
      googleId,
      type: 'host',
      needsPhoneNumber: true
    });
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport;

