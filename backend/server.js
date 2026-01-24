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

// Connect to database
connectDB();

const app = express();

// Middleware
// Allow multiple origins for development
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://172.16.68.100:3000',
  process.env.FRONTEND_URL,
  'https://tribelink-app.vercel.app', // Explicitly allow Vercel frontend
  // Allow Render frontend deployments
  process.env.FRONTEND_RENDER_URL,
].filter(Boolean);

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
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
        return callback(null, true);
      }
      // In development, allow all origins for easier debugging
      console.log('[CORS] Allowing origin in development:', origin);
      return callback(null, true);
    }
    
    // Production: check allowed origins
      // Check exact match first
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
        return;
      }
      
      // Allow Vercel preview deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }
      
      // Allow Render deployments (*.onrender.com)
      if (origin.endsWith('.onrender.com')) {
        callback(null, true);
        return;
      }
      
      // Log blocked origin for debugging
    console.log('[CORS] Blocked origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);
    console.log('[CORS] NODE_ENV:', process.env.NODE_ENV);
    console.log('[CORS] FRONTEND_URL env:', process.env.FRONTEND_URL);
      callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tribelink Platform API is running' });
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
  console.log(`AI Tourism Platform running on http://${HOST}:${PORT}`);
  console.log(`Accessible at http://localhost:${PORT} or http://172.16.68.100:${PORT}`);
});

module.exports = app;

