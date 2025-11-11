const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Host = require('../models/Host');
const jwt = require('jsonwebtoken');

// Log OAuth configuration for debugging
console.log('[OAuth] Environment:', process.env.NODE_ENV || 'development');
console.log('[OAuth] BACKEND_URL:', process.env.BACKEND_URL || 'not set');

// Configure Google OAuth Strategy for Users
// Determine callback URL based on environment
const getUserCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL_USER) {
    return process.env.GOOGLE_CALLBACK_URL_USER;
  }
  // Production: Use Render backend URL
  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/api/auth/google/callback`;
  }
  // Development: Use localhost (only works in development)
  return `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
};

passport.use('google-user', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  callbackURL: getUserCallbackURL()
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
    return process.env.GOOGLE_CALLBACK_URL_HOST;
  }
  // Production: Use Render backend URL
  if (process.env.NODE_ENV === 'production' && process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/api/auth/google/host/callback`;
  }
  // Development: Use localhost (only works in development)
  return `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/host/callback`;
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

