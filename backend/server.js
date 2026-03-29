require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');
const { checkEnv } = require('./config/envCheck');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const hostRoutes = require('./routes/hosts');
const reviewRoutes = require('./routes/reviews');
// const hotelRoutes = require('./routes/hotels'); // Deprecated - will be replaced by abode stays
const safetyRoutes = require('./routes/safety');
// const driverRoutes = require('./routes/drivers'); // Removed - no longer needed
const ticketRoutes = require('./routes/tickets');

const app = express();

// Connect to database (async, but don't block server startup)
// The server will start even if DB connection fails, but DB features won't work
(async () => {
  await connectDB();
})();

// Basic env sanity check (logs warnings, does not crash)
checkEnv();

// Middleware
// CORS Configuration - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://172.16.68.100:3000',
  process.env.FRONTEND_URL,
  'https://triberoutes-app.vercel.app', // Explicitly allow Vercel frontend
  'https://triberoutes.com', // Custom domain
  'https://www.triberoutes.com', // Custom domain with www
  process.env.FRONTEND_RENDER_URL,
  // Add any additional frontend URLs from environment
  process.env.NEXT_PUBLIC_FRONTEND_URL,
].filter(Boolean);

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

/** Single source of truth for browser Origin checks (preflight + cors package). */
function isOriginAllowed(origin) {
  if (!origin) return false;
  if (isDevelopment) return true;
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  if (origin.includes('triberoutes.com')) return true;
  if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) return true;
  if (origin.endsWith('.onrender.com') || origin.includes('onrender.com')) return true;
  if (origin.endsWith('.netlify.app') || origin.includes('netlify.app')) return true;
  if (origin.endsWith('.railway.app') || origin.includes('railway.app')) return true;
  if (origin.endsWith('.herokuapp.com') || origin.includes('herokuapp.com')) return true;
  return false;
}

// Preflight before cors(): always send Allow-Headers (some browsers omit Access-Control-Request-Headers;
// the cors package then omits Allow-Headers and preflight fails). Reflect requested headers when present.
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next();
  const origin = req.headers.origin;
  if (!isOriginAllowed(origin)) return next();
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  const requested = req.headers['access-control-request-headers'];
  res.setHeader(
    'Access-Control-Allow-Headers',
    requested ||
      'Content-Type, Authorization, Accept, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
  );
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD'
  );
  res.setHeader('Access-Control-Max-Age', '7200');
  res.setHeader('Vary', 'Origin, Access-Control-Request-Headers');
  return res.status(204).end();
});

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      return callback(null, origin);
    }
    console.error('[CORS] ❌ Blocked origin:', origin);
    console.error('[CORS] Allowed origins:', allowedOrigins);
    console.error('[CORS] NODE_ENV:', process.env.NODE_ENV);
    console.error('[CORS] FRONTEND_URL env:', process.env.FRONTEND_URL);
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  // Omit allowedHeaders: the cors package then echoes Access-Control-Request-Headers from the
  // browser. A fixed list breaks preflight when clients add headers (Sentry, APM, extensions).
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Payment webhooks must receive raw body for signature verification (before express.json)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), require('./routes/stripeWebhooks'));
app.use('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), require('./routes/razorpayWebhooks'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable is required but not set.');
}

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Triberoutes Platform API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/hosts', hostRoutes);
app.use('/api/reviews', reviewRoutes); // Moved from /api/experiences
app.use('/api/experiences', require('./routes/experiences')); // New experiences endpoint
// app.use('/api/hotels', hotelRoutes); // Deprecated - will be replaced by abode stays
app.use('/api/abodes', require('./routes/adobes')); // Local hosts (abode stays)
app.use('/api/planner', require('./routes/plannerAbodes')); // Abodes-first trip planner APIs
app.use('/api/events', require('./routes/events')); // Events/concerts
app.use('/api/bookings', require('./routes/bookings')); // Unified bookings
app.use('/api/cart', require('./routes/cart')); // Shopping cart
app.use('/api/safety', safetyRoutes);
// app.use('/api/drivers', driverRoutes); // Removed - no longer needed
app.use('/api/tickets', ticketRoutes);
app.use('/api/routes', require('./routes/routes'));
app.use('/api/currency', require('./routes/currency')); // Currency conversion

// Test routes (development only)
if (process.env.NODE_ENV === 'development') {
  const testEmailRoutes = require('./routes/test-email');
  app.use('/api/test/email', testEmailRoutes);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    console.error('[CORS Error]', {
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      message: err.message
    });
    return res.status(403).json({
      message: 'CORS policy violation: Origin not allowed',
      error: err.message,
      origin: req.headers.origin,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        allowedOrigins: allowedOrigins 
      })
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

app.listen(PORT, HOST, () => {
  console.log('='.repeat(60));
  console.log('🚀 AI Tourism Platform API Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on http://${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📡 API base URL: http://${HOST}:${PORT}/api`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.length} configured origins`);
  if (process.env.FRONTEND_URL) {
    console.log(`🎯 Frontend URL: ${process.env.FRONTEND_URL}`);
  }
  console.log('='.repeat(60));
});

module.exports = app;

