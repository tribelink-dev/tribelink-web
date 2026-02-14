require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');
const connectDB = require('./config/database');

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

// Middleware
// CORS Configuration - Allow multiple origins for development and production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://172.16.68.100:3000',
  process.env.FRONTEND_URL,
  'https://tribelink-app.vercel.app', // Explicitly allow Vercel frontend
  process.env.FRONTEND_RENDER_URL,
  // Add any additional frontend URLs from environment
  process.env.NEXT_PUBLIC_FRONTEND_URL,
].filter(Boolean);

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Enhanced CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, Postman, etc.)
    if (!origin) {
      console.log('[CORS] Allowing request with no origin');
      return callback(null, true);
    }
    
    // In development, always allow localhost and common development origins
    if (isDevelopment) {
      // Allow localhost, 127.0.0.1, and common development IPs
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://172.16.') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        allowedOrigins.indexOf(origin) !== -1
      ) {
        console.log('[CORS] Allowing origin in development:', origin);
        return callback(null, true);
      }
      // In development, allow all origins for easier debugging
      console.log('[CORS] Allowing origin in development (catch-all):', origin);
      return callback(null, true);
    }
    
    // Production: check allowed origins with more flexible matching
    console.log('[CORS] Checking origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);
    console.log('[CORS] NODE_ENV:', process.env.NODE_ENV);
    
    // Check exact match first
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('[CORS] Allowed: exact match');
      callback(null, true);
      return;
    }
    
    // Allow Vercel deployments (*.vercel.app)
    if (origin.endsWith('.vercel.app') || origin.includes('vercel.app')) {
      console.log('[CORS] Allowed: Vercel deployment');
      callback(null, true);
      return;
    }
    
    // Allow Render deployments (*.onrender.com)
    if (origin.endsWith('.onrender.com') || origin.includes('onrender.com')) {
      console.log('[CORS] Allowed: Render deployment');
      callback(null, true);
      return;
    }
    
    // Allow Netlify deployments (*.netlify.app)
    if (origin.endsWith('.netlify.app') || origin.includes('netlify.app')) {
      console.log('[CORS] Allowed: Netlify deployment');
      callback(null, true);
      return;
    }
    
    // Allow Railway deployments (*.railway.app)
    if (origin.endsWith('.railway.app') || origin.includes('railway.app')) {
      console.log('[CORS] Allowed: Railway deployment');
      callback(null, true);
      return;
    }
    
    // Allow Heroku deployments (*.herokuapp.com)
    if (origin.endsWith('.herokuapp.com') || origin.includes('herokuapp.com')) {
      console.log('[CORS] Allowed: Heroku deployment');
      callback(null, true);
      return;
    }
    
    // Allow any HTTPS origin in production (more permissive for deployment flexibility)
    // This is safer than blocking everything, but you can restrict this if needed
    if (origin.startsWith('https://')) {
      console.log('[CORS] Allowed: HTTPS origin (production permissive mode)');
      callback(null, true);
      return;
    }
    
    // Log blocked origin for debugging
    console.error('[CORS] ❌ Blocked origin:', origin);
    console.error('[CORS] Allowed origins:', allowedOrigins);
    console.error('[CORS] NODE_ENV:', process.env.NODE_ENV);
    console.error('[CORS] FRONTEND_URL env:', process.env.FRONTEND_URL);
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
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

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Tribelink Platform API is running',
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
app.use('/api/events', require('./routes/events')); // Events/concerts
app.use('/api/bookings', require('./routes/bookings')); // Unified bookings
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

