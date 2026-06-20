/**
 * Rate limits for public listing endpoints (abodes, experiences).
 * Tuned for SEO safety: Google crawls HTML, not bulk JSON API polling.
 */

const rateLimit = require('express-rate-limit');

const publicListingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

/** Stricter limit for requests without the web client fingerprint header */
const anonymousListingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.get('X-Triberoutes-Client') === 'web',
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

module.exports = {
  publicListingLimiter,
  anonymousListingLimiter,
};
