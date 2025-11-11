# 🌍 Tribelink - AI Tourism Platform

**A comprehensive tourism platform connecting travelers with authentic local experiences, accommodations, guides, and transportation services powered by AI-driven trip planning.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features Implemented](#features-implemented)
- [Feature Implementation Details](#feature-implementation-details)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [User Flows](#user-flows)
- [Test Users](#test-users)
- [Architecture Overview](#architecture-overview)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

Tribelink is a full-stack tourism platform that enables:
- **Travelers** to discover and book unique experiences, accommodations, guided tours, and transportation
- **Service Providers** (Hosts, Guides, Hotel Owners, Drivers) to list and manage their services
- **AI-powered trip planning** with personalized recommendations and intelligent scheduling
- **Seamless trip execution** with chauffeur schedule management and real-time itinerary tracking

The platform supports multiple user types with dedicated dashboards, authentication systems, and role-based access control.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React Hooks (useState, useEffect, Context API)
- **HTTP Client**: Axios with interceptors
- **Maps**: Leaflet & React Leaflet
- **Calendar**: react-day-picker (v9)
- **Date Utilities**: date-fns
- **Authentication**: JWT tokens stored in localStorage

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (with Mongoose ODM)
- **Authentication**: JWT, bcryptjs for password hashing
- **OAuth**: Passport.js with Google OAuth 2.0
- **File Upload**: Multer
- **Session Management**: express-session
- **AI Integration**: OpenAI API (GPT-4o-mini) for intelligent scheduling

### Development Tools
- **Package Manager**: npm
- **Process Manager**: concurrently (for running both servers)
- **Hot Reload**: nodemon (backend), Next.js Fast Refresh (frontend)

---

## ✨ Features Implemented

### 🔐 Authentication & Authorization

#### For Travelers (Regular Users)
- ✅ **Email/Phone Login**: Flexible login using either email or phone number
- ✅ **Multi-step Signup**: 
  - Phone number verification with OTP
  - Email verification with OTP
  - Password creation
- ✅ **Google OAuth**: Sign in with Google account
- ✅ **JWT-based Authentication**: Secure token-based sessions (7-day expiry)
- ✅ **Password Security**: Bcrypt hashing (10 rounds) for password storage

#### For Service Providers (Hosts)
- ✅ **Email/Phone Login**: Same flexible login as travelers
- ✅ **Provider Signup**: Registration with provider type selection
- ✅ **Provider Types Supported**:
  - Experience Hosts
  - Tour Guides
  - Hotel Owners (Accommodation Providers)
  - Driver Partners
- ✅ **Google OAuth for Providers**: Sign in with Google
- ✅ **Sign Out Functionality**: Logout button on all provider dashboards
- ✅ **Role-based Access Control**: Each provider type has dedicated dashboard

### 👤 User Management

#### Traveler Features
- ✅ **User Dashboard**: Overview of trips, preferences, wallet balance, and statistics
- ✅ **KYT (Know Your Traveler) Questionnaire**: 
  - Travel Style (Flexible vs Fixed)
  - Travel Pace (Fast vs Slow)
  - Transport Preference (Native vs Luxury)
  - Preferences stored and used for AI recommendations
- ✅ **Profile Management**: View and update user information
- ✅ **Trip Wallet**: 
  - Multi-currency support (USD default)
  - Fund wallet functionality
  - Currency conversion (if API key provided)
  - Balance tracking
- ✅ **Token System**: 
  - Users receive 2 tokens on signup
  - 1 token deducted per trip creation
  - Tokens earned after trip payment completion
- ✅ **Bucketlist Management**: 
  - Save experiences to bucketlist
  - Add/remove experiences
  - Used for trip planning

#### Provider Features
- ✅ **Provider-Specific Dashboards**:
  - Experience Host Dashboard (`/provider/experiences`)
  - Guide Dashboard (`/provider/guides`)
  - Hotel Owner Dashboard (`/provider/hotels`)
  - Driver Partner Dashboard (`/provider/drivers`)
- ✅ **Provider Management**: View provider information and ratings
- ✅ **Availability Management**: Set availability schedules with time slots
- ✅ **Rating System**: Track average ratings and review counts

### 🎯 Trip Planning & Booking

#### Trip Selection
- ✅ **Modern Calendar Interface**: 
  - Using react-day-picker for date range selection
  - Responsive design (2 months desktop, 1 month mobile)
  - Past dates disabled
  - Visual feedback for selected dates
- ✅ **Location Selection**: 
  - Country selection (currently India)
  - State selection from Indian states list
  - District selection based on state
  - Multi-location support for multi-city trips
- ✅ **Professional UI/UX**: 
  - Gradient headers with decorative elements
  - Color-coded form sections
  - Clear visual hierarchy
  - Step indicators

#### Experience Browsing
- ✅ **Experience Discovery**: 
  - Filter by location (state, district)
  - Filter by available dates
  - View experience details with images/videos
  - Provider information and ratings
  - Price and duration display
- ✅ **Bucketlist Management**: 
  - Add experiences to bucketlist
  - Remove from bucketlist
  - View bucketlist count
- ✅ **Experience Cards**: 
  - Image preview
  - Title and description
  - Price and rating
  - Location information
  - Quick add to bucketlist

#### AI-Powered Smart Scheduling
- ✅ **Gumo.ai-like AI Scheduler**: 
  - OpenAI GPT-4o-mini integration
  - Intelligent trip optimization
  - Context-aware scheduling
  - Preference-based recommendations
- ✅ **Day-by-Day Itinerary Generation**: 
  - Automatic activity scheduling
  - Time slot optimization
  - Location-based clustering
  - Activity duration consideration
- ✅ **Schedule Features**:
  - Activities with start/end times
  - Hotel integration per day
  - Chauffeur service selection
  - Guide assignment
  - Cab service options
  - Free day detection
- ✅ **Intelligent Recommendations**: 
  - AI-powered suggestions for free days
  - Context-aware experience recommendations
  - Fallback to rule-based recommendations
  - Top 6 recommendations with reasons
- ✅ **Schedule Display**: 
  - Professional day-by-day cards
  - Activity details with times
  - Hotel selection interface
  - Price breakdown
  - Trip statistics
  - AI insights and optimization score

#### Payment System
- ✅ **Wallet-based Payments**: 
  - Fund wallet before payment
  - Multi-currency support
  - Currency conversion
  - Payment processing for trips
- ✅ **Payment Status Tracking**: 
  - Pending
  - Completed
  - Failed
- ✅ **Price Calculation**: 
  - Activity prices
  - Hotel prices
  - Chauffeur costs ($50/day)
  - Guide fees
  - Total price breakdown

### 🏨 Accommodation Management

#### Hotel Listing
- ✅ **Hotel Creation**: 
  - Create hotel listings
  - Upload multiple images
  - Set amenities and pricing
  - Location and contact information
  - Room capacity and types
- ✅ **Hotel Management**: 
  - View all hotels
  - Edit hotel details
  - Delete hotels
  - Image management

#### Hotel Browsing & Booking
- ✅ **Hotel Discovery**: 
  - Search and filter hotels
  - View hotel details with images
  - Check availability
  - View amenities
  - See ratings and reviews
- ✅ **Hotel Booking**: 
  - Integration with trip scheduling
  - Select hotel per day
  - Price calculation
  - Hotel selection UI with images

### 🎨 Experience Management

#### Experience Creation
- ✅ **Professional Creation Interface**: 
  - Modern UI with color-coded sections
  - Step-by-step form
  - Image upload with preview
  - Location selection
- ✅ **Time Slot Management**: 
  - Select multiple dates using modern calendar
  - Set start and end times for each date
  - Default time slots (9 AM - 5 PM)
  - Time validation (start before end)
  - Visual time slot display
- ✅ **Experience Details**: 
  - Title and description
  - Pricing (per person)
  - Duration (hours)
  - Max participants
  - Content URL (video links)
  - Image upload
- ✅ **Availability Management**: 
  - Multiple date selection
  - Time slot configuration per date
  - Available/unavailable toggle
  - Date removal

#### Experience Editing
- ✅ **Update Existing Experiences**: 
  - Edit all experience details
  - Update availability
  - Modify pricing
  - Change images

#### Experience Listing
- ✅ **Provider Experience View**: 
  - View all experiences by provider
  - Edit/delete options
  - Quick access to management

### 🚗 Driver & Chauffeur Management

#### Driver Onboarding
- ✅ **Uber-style Onboarding Interface**: 
  - Step-by-step onboarding process
  - Progress tracking with completion percentage
  - Status indicators (pending, completed, recommended)
  - Required vs optional steps
- ✅ **Onboarding Steps**:
  - Driving License (Required)
  - Profile Picture (Optional)
  - Vehicle Registration - RC (Required)
  - Vehicle Insurance (Required)
  - Vehicle Details (Required)
  - Preferred Language (Optional)
- ✅ **Professional UI**: 
  - Clean, modern design
  - Visual progress bar
  - Recommended next step highlighting
  - Completion celebration

#### Chauffeur Schedule Viewing
- ✅ **Assigned Trips Interface**: 
  - List of all assigned trips
  - Trip selection sidebar
  - Detailed itinerary view
- ✅ **Trip Details Display**:
  - Traveler contact information (phone, email)
  - Day-by-day schedule
  - Activity times and locations
  - Hotel information
  - Guide information (if applicable)
  - Chauffeur instructions per day
- ✅ **Schedule Features**:
  - Clear day-by-day breakdown
  - Activity start/end times
  - Pickup and drop-off locations
  - Service requirements highlighting
  - Professional card-based layout

#### Driver Profile Management
- ✅ **Driver Profile**: 
  - Vehicle type selection
  - License information
  - Document uploads
  - Availability management
  - Pricing configuration
  - Vehicle details
  - Languages spoken

### 🛡️ Safety Features

#### Emergency Management
- ✅ **SOS Emergency System**: 
  - Emergency SOS button
  - Quick access to emergency contacts
  - Emergency event logging
- ✅ **Emergency Contacts**: 
  - Add/edit emergency contacts
  - Primary contact designation
  - Contact information (name, phone, email, relationship)
- ✅ **Emergency Information**: 
  - Medical information
  - Blood type
  - Allergies
  - Medications
  - Insurance information
- ✅ **Safety Settings**: 
  - Location sharing toggle
  - Check-in reminders
  - Auto-share location during trips
- ✅ **Emergency History**: 
  - View past emergency events
  - Event details and timestamps

### 🗺️ Additional Features

- ✅ **Responsive Design**: Mobile-friendly UI with breakpoints
- ✅ **Modern UI/UX**: 
  - Clean, intuitive interface with Tailwind CSS
  - Gradient backgrounds
  - Shadow effects
  - Hover states
  - Professional color scheme
- ✅ **Error Handling**: Comprehensive error messages with icons
- ✅ **Loading States**: User-friendly loading indicators
- ✅ **Form Validation**: Client and server-side validation
- ✅ **Phone Number Normalization**: Consistent phone format handling (E.164)
- ✅ **CORS Configuration**: Secure cross-origin requests
- ✅ **File Upload**: Image upload with size validation (5MB limit)
- ✅ **Map Integration**: Leaflet maps for location visualization

---

## 📖 Feature Implementation Details

### 1. Authentication System

#### How It Works
The authentication system uses JWT (JSON Web Tokens) for secure session management. When a user logs in, the backend generates a JWT token that contains the user's ID. This token is stored in the browser's localStorage and sent with every API request.

**Implementation Files:**
- `backend/middleware/auth.js` - Authentication middleware
- `backend/routes/auth.js` - Authentication routes
- `frontend/lib/auth.tsx` - Frontend auth context
- `frontend/lib/api.ts` - API client with token injection

**Key Features:**
- **Dual Login**: Users can login with either email OR phone number
- **OTP Verification**: Two-step verification for signup (phone + email)
- **Google OAuth**: Social login using Passport.js
- **Token Expiry**: 7-day token validity
- **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

**For Beginners:**
1. User enters credentials → Frontend sends to `/api/auth/login`
2. Backend validates credentials → Generates JWT token
3. Token stored in localStorage → Used for all future requests
4. Middleware checks token on protected routes → Grants or denies access

### 2. AI-Powered Trip Scheduler

#### How It Works
The AI scheduler uses OpenAI's GPT-4o-mini model to create optimized trip schedules. It considers user preferences, experience availability, location proximity, and time constraints to generate intelligent day-by-day itineraries.

**Implementation Files:**
- `backend/services/aiScheduler.js` - AI scheduling logic
- `backend/services/scheduler.js` - Rule-based fallback scheduler
- `backend/routes/trips.js` - Trip scheduling endpoint

**Key Features:**
- **AI Integration**: OpenAI API for intelligent scheduling
- **Fallback System**: Rule-based scheduler if AI unavailable
- **Optimization**: Activity clustering by location proximity
- **Time Management**: Respects experience time slots and durations
- **Recommendations**: AI-powered suggestions for free days

**For Beginners:**
1. User selects experiences → Added to bucketlist
2. User selects dates and location → Trip creation initiated
3. Backend calls AI scheduler → Analyzes preferences and experiences
4. AI generates optimized schedule → Day-by-day itinerary created
5. Schedule displayed → User can review and modify

**AI Prompt Structure:**
```
- User preferences (travel style, pace, transport)
- Available experiences with details
- Date range and locations
- Constraints (time slots, durations)
→ AI returns optimized JSON schedule
```

### 3. Experience Management with Time Slots

#### How It Works
Hosts can create experiences and set specific availability dates with time slots. Each date can have different start and end times, allowing flexible scheduling.

**Implementation Files:**
- `frontend/app/host/experiences/add/page.tsx` - Experience creation UI
- `backend/models/Experience.js` - Experience schema with time slots
- `backend/routes/hosts.js` - Experience creation endpoint

**Key Features:**
- **Multiple Date Selection**: Modern calendar for date picking
- **Time Slot Configuration**: Start and end times per date
- **Default Values**: 9 AM - 5 PM default time slots
- **Validation**: Ensures start time is before end time
- **Visual Display**: Card-based UI showing dates and times

**For Beginners:**
1. Host clicks "Create Experience" → Opens creation form
2. Fills basic info → Title, description, location, price
3. Selects dates in calendar → Multiple dates can be selected
4. Sets time slots → Start and end time for each date
5. Submits form → Experience saved with availability data

**Data Structure:**
```javascript
availableDates: [
  {
    date: "2024-12-25",
    startTime: "09:00",
    endTime: "17:00",
    available: true
  }
]
```

### 4. Driver Onboarding System

#### How It Works
Drivers go through a step-by-step onboarding process similar to Uber's system. Each step tracks completion status and guides drivers through required documentation and profile setup.

**Implementation Files:**
- `frontend/app/driver/onboarding/page.tsx` - Onboarding interface
- `backend/models/DriverProvider.js` - Driver profile schema
- `backend/routes/drivers.js` - Driver profile routes

**Key Features:**
- **Step Tracking**: Each step has status (pending, completed, in_progress)
- **Progress Bar**: Visual completion percentage
- **Recommended Steps**: Highlights next required step
- **Required vs Optional**: Clear distinction between required and optional steps
- **Completion Celebration**: Visual feedback when all steps complete

**For Beginners:**
1. Driver signs up as DRIVER_PARTNER → Account created
2. Accesses onboarding page → Sees list of required steps
3. Clicks on step → Navigates to step-specific page
4. Completes step → Status updates to "completed"
5. Progress bar updates → Shows completion percentage
6. All steps complete → Can start accepting trips

### 5. Chauffeur Schedule Viewing

#### How It Works
When a traveler books a trip with chauffeur service, the assigned driver can view the complete itinerary with all activities, times, and locations. This enables seamless trip execution.

**Implementation Files:**
- `frontend/app/driver/schedule/page.tsx` - Schedule viewing interface
- `backend/routes/drivers.js` - Assigned trips endpoint
- `backend/models/Trip.js` - Trip schema with assignedDriver field

**Key Features:**
- **Trip List**: Sidebar showing all assigned trips
- **Detailed Itinerary**: Day-by-day breakdown
- **Traveler Contact**: Phone and email for communication
- **Activity Times**: Start and end times for each activity
- **Instructions**: Clear instructions for chauffeur service
- **Hotel Information**: Pickup and drop-off locations

**For Beginners:**
1. Traveler books trip with chauffeur → Driver assigned to trip
2. Driver logs into dashboard → Sees "My Schedule" option
3. Views assigned trips → List of all trips requiring service
4. Selects trip → Detailed itinerary displayed
5. Sees daily schedule → Activities, times, locations
6. Follows itinerary → Picks up traveler, drives to activities, drops off

**Trip Assignment Flow:**
```
Traveler selects chauffeur → Backend assigns driver → 
Trip saved with assignedDriver field → 
Driver can view trip in schedule interface
```

### 6. Safety Features

#### How It Works
The safety system allows travelers to manage emergency contacts, medical information, and safety settings. An SOS button provides quick access to emergency services.

**Implementation Files:**
- `frontend/app/dashboard/safety/` - Safety management pages
- `frontend/components/EmergencySOS.tsx` - SOS button component
- `backend/routes/safety.js` - Safety data routes
- `backend/models/EmergencyEvent.js` - Emergency event logging

**Key Features:**
- **Emergency Contacts**: Multiple contacts with primary designation
- **Medical Information**: Blood type, allergies, medications
- **Insurance Info**: Provider and policy details
- **Safety Settings**: Location sharing, check-in reminders
- **SOS Button**: Quick emergency access
- **Event History**: Log of emergency events

**For Beginners:**
1. User navigates to Safety section → Dashboard safety menu
2. Adds emergency contacts → Name, phone, email, relationship
3. Fills medical information → Blood type, allergies, medications
4. Configures safety settings → Location sharing preferences
5. In emergency → Clicks SOS button → Emergency contacts notified

### 7. Modern Calendar Implementation

#### How It Works
The platform uses `react-day-picker` (v9) for all date selection interfaces. This provides a modern, accessible calendar with range selection, multiple selection, and custom styling.

**Implementation Files:**
- `frontend/app/trips/select/page.tsx` - Trip date selection
- `frontend/app/host/experiences/add/page.tsx` - Experience date selection
- `frontend/app/globals.css` - Calendar styling

**Key Features:**
- **Range Selection**: Select start and end dates
- **Multiple Selection**: Select multiple individual dates
- **Past Date Disabling**: Cannot select past dates
- **Responsive Design**: 2 months on desktop, 1 on mobile
- **Custom Styling**: Matches platform design system
- **Client-side Rendering**: Prevents hydration errors

**For Beginners:**
1. Calendar component imported → `react-day-picker`
2. Mode set → "range" for trip dates, "multiple" for experience dates
3. Selected dates tracked → State management with useState
4. onSelect handler → Updates state when dates clicked
5. Styled with Tailwind → Custom classes for branding

---

## 📁 Project Structure

```
PoC/
├── frontend/                    # Next.js frontend application
│   ├── app/                    # App Router pages
│   │   ├── auth/              # OAuth callback pages
│   │   ├── dashboard/         # User dashboard and wallet
│   │   │   ├── safety/        # Safety features (contacts, info, history, settings)
│   │   │   └── wallet/        # Wallet management
│   │   ├── driver/            # Driver-specific pages
│   │   │   ├── onboarding/   # Driver onboarding interface
│   │   │   └── schedule/     # Chauffeur schedule viewing
│   │   ├── host/              # Host/provider pages
│   │   │   ├── dashboard/     # Main host dashboard
│   │   │   ├── experiences/   # Experience management
│   │   │   │   ├── add/      # Create experience (with time slots)
│   │   │   │   └── edit/     # Edit experience
│   │   │   ├── hotels/       # Hotel management
│   │   │   ├── login/        # Host login
│   │   │   └── signup/       # Host signup
│   │   ├── kyt/              # Know Your Traveler questionnaire
│   │   ├── login/            # User login
│   │   ├── provider/          # Provider-specific dashboards
│   │   │   ├── drivers/      # Driver partner dashboard
│   │   │   ├── experiences/  # Experience host dashboard
│   │   │   ├── guides/       # Guide dashboard
│   │   │   └── hotels/       # Hotel owner dashboard
│   │   ├── signup/           # User signup
│   │   └── trips/            # Trip planning pages
│   │       ├── experiences/  # Browse experiences
│   │       ├── payment/      # Payment page
│   │       ├── schedule/      # Trip schedule (AI-powered)
│   │       └── select/       # Trip selection (modern calendar)
│   ├── components/            # Reusable React components
│   │   ├── EmergencySOS.tsx  # SOS emergency button
│   │   ├── Navbar.tsx        # Navigation bar
│   │   ├── SOSModal.tsx      # Emergency modal
│   │   └── TripMap.tsx       # Map component for trips
│   ├── lib/                   # Utility functions and configurations
│   │   ├── api.ts            # Axios API client with interceptors
│   │   ├── auth.tsx          # Authentication context
│   │   ├── indianStates.ts   # Indian states and districts data
│   │   ├── providerUtils.ts  # Provider utility functions
│   │   └── safetyUtils.ts    # Safety utility functions
│   └── public/                # Static assets
│       └── tribelink-logo.svg
│
├── backend/                    # Express.js backend application
│   ├── config/                # Configuration files
│   │   ├── database.js       # MongoDB connection
│   │   └── passport.js       # Passport OAuth configuration
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # Authentication middleware
│   │   └── upload.js         # File upload middleware (Multer)
│   ├── models/                # Mongoose schemas
│   │   ├── User.js           # User model (travelers)
│   │   ├── Provider.js       # Provider model (unified)
│   │   ├── Host.js           # Host model (alias for Provider)
│   │   ├── Experience.js     # Experience model (with time slots)
│   │   ├── Hotel.js          # Hotel model
│   │   ├── Trip.js           # Trip model (with assignedDriver)
│   │   ├── Review.js         # Review model
│   │   ├── OTP.js            # OTP model (for verification)
│   │   ├── DriverProvider.js # Driver provider model
│   │   ├── EmergencyEvent.js # Emergency event logging
│   │   └── EmergencyNumbers.js # Emergency contact numbers
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User routes
│   │   ├── hosts.js          # Host/provider routes
│   │   ├── hotels.js         # Hotel routes
│   │   ├── trips.js          # Trip routes (scheduling, payment)
│   │   ├── reviews.js        # Review routes
│   │   ├── drivers.js        # Driver routes (onboarding, trips)
│   │   └── safety.js         # Safety routes (emergency, contacts)
│   ├── services/              # Business logic services
│   │   ├── scheduler.js      # Rule-based trip scheduling (fallback)
│   │   ├── aiScheduler.js    # AI-powered scheduling (OpenAI)
│   │   └── currency.js       # Currency conversion
│   ├── scripts/               # Utility scripts
│   │   └── createTestUsers.js # Test user creation script
│   ├── uploads/               # Uploaded files (images)
│   └── server.js              # Express server entry point
│
└── package.json               # Root workspace configuration
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher, recommended: v20+)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas account)
- **OpenAI API Key** (optional, for AI scheduling - fallback available)

### Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd /path/to/PoC
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
   
   This will install dependencies for:
   - Root workspace
   - Frontend application
   - Backend application

3. **Set up environment variables** (see [Environment Setup](#environment-setup))

---

## ⚙️ Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/aitourism
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aitourism

# JWT Secret (use a strong random string in production)
JWT_SECRET=your-secret-jwt-key-change-in-production

# Server Port
PORT=5000

# Frontend URL (for OAuth redirects)
FRONTEND_URL=http://localhost:3000

# Google OAuth (optional - for Google sign-in)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session Secret (for OAuth sessions)
SESSION_SECRET=your-session-secret-key

# Currency Exchange API (optional - for currency conversion)
EXCHANGE_RATE_API_KEY=your-api-key-here

# OpenAI API Key (for AI-powered scheduling)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🏃 Running the Application

### Option 1: Run Both Servers Together (Recommended)

From the root directory:

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000) servers simultaneously.

### Option 2: Run Servers Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

---

## 📡 API Endpoints

### Authentication

#### User Authentication
- `POST /api/auth/signup` - User registration (requires OTP verification)
- `POST /api/auth/login` - User login (email OR phone)
- `GET /api/auth/google` - Google OAuth for users
- `GET /api/auth/google/callback` - Google OAuth callback

#### Provider Authentication
- `POST /api/auth/host/signup` - Provider registration
- `POST /api/auth/host/login` - Provider login (email OR phone)
- `GET /api/auth/google/host` - Google OAuth for providers
- `GET /api/auth/google/host/callback` - Google OAuth callback for providers

#### OTP Verification
- `POST /api/auth/otp/send-phone` - Send phone OTP
- `POST /api/auth/otp/verify-phone` - Verify phone OTP
- `POST /api/auth/otp/send-email` - Send email OTP
- `POST /api/auth/otp/verify-email` - Verify email OTP

### User Management

- `GET /api/user/me` - Get current user profile
- `POST /api/user/kyt` - Submit/update KYT preferences
- `GET /api/user/cart` - Get user's bucketlist
- `POST /api/user/cart` - Add experience to bucketlist
- `DELETE /api/user/cart/:id` - Remove experience from bucketlist
- `POST /api/user/wallet/fund` - Fund user wallet

### Trips

- `GET /api/trips/search` - Search experiences by location and date
- `GET /api/trips/experiences/:district` - Get experiences by district
- `POST /api/trips/schedule` - Create trip schedule (AI-powered)
- `GET /api/trips/:tripId` - Get trip details
- `PUT /api/trips/:tripId/hotels` - Update hotels and chauffeur options
- `POST /api/trips/:tripId/pay` - Pay for trip
- `POST /api/trips/recommendations` - Get AI recommendations for free days

### Providers/Hosts

- `GET /api/hosts/experiences` - Get host's experiences (authenticated)
- `POST /api/hosts/experience` - Create new experience (with time slots)
- `PUT /api/hosts/experience/:id` - Update experience
- `POST /api/hosts/availability` - Update availability
- `GET /api/hosts/available` - Get available hosts/guides
- `POST /api/hosts/:hostId/rate` - Rate a host

### Hotels

- `GET /api/hotels` - List hotels (with filters)
- `GET /api/hotels/:id` - Get hotel details
- `POST /api/hotels` - Create hotel (host/admin only)
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel

### Drivers

- `GET /api/drivers/profile/:providerId` - Get driver profile
- `PUT /api/drivers/profile/:providerId` - Update driver profile
- `GET /api/drivers/trips/:driverId` - Get assigned trips
- `POST /api/drivers/assign/:tripId` - Assign driver to trip

### Safety

- `GET /api/safety/contacts` - Get emergency contacts
- `POST /api/safety/contacts` - Add emergency contact
- `PUT /api/safety/contacts/:id` - Update emergency contact
- `DELETE /api/safety/contacts/:id` - Delete emergency contact
- `GET /api/safety/info` - Get emergency information
- `POST /api/safety/info` - Update emergency information
- `GET /api/safety/history` - Get emergency event history
- `POST /api/safety/sos` - Trigger SOS event

### Reviews

- `GET /api/experiences/:id/reviews` - Get reviews for experience
- `POST /api/experiences/:id/reviews` - Add review

---

## 🗄️ Database Models

### User Model
Stores traveler information:
- **Fields**: email, phoneNumber, password, name, preferences, tripWallet, tokens, bucketlist, bookings
- **Relations**: References to Trip (bookings), Experience (bucketlist)
- **Special Features**: Google OAuth support, emergency contacts, safety settings

### Provider Model
Unified model for all service providers:
- **Fields**: name, email, phoneNumber, password, providerType, role, rating, experiences, availability
- **Provider Types**: EXPERIENCE_HOST, GUIDE, ACCOMMODATION_PROVIDER, DRIVER_PARTNER
- **Relations**: References to Experience (for hosts)

### DriverProvider Model
Extended profile for driver partners:
- **Fields**: providerId, vehicleType, licenseNumber, documents, availability, pricing, vehicleDetails
- **Relations**: References to Provider
- **Special Features**: Verification status, years of experience, languages

### Experience Model
Stores experience listings:
- **Fields**: title, description, provider, location, availableDates (with time slots), price, duration, maxParticipants
- **Relations**: References to Provider (provider)
- **Special Features**: Time slot support, rating system, image uploads

### Trip Model
Stores trip bookings:
- **Fields**: user, fromDate, toDate, locations, preferences, schedule, totalPrice, paymentStatus, assignedDriver
- **Relations**: References to User, Provider (assignedDriver, guide), Hotel, Experience
- **Schedule Structure**: Array of days, each with activities, hotel, chauffeur, guide options

### Hotel Model
Stores hotel listings:
- **Fields**: name, description, provider, location, amenities, pricePerNight, images, capacity
- **Relations**: References to Provider (provider)

---

## 🔄 User Flows

### Traveler Flow

1. **Sign Up** (`/signup`)
   - Enter phone number → Verify OTP
   - Enter email → Verify OTP
   - Create password
   - Account created (2 tokens awarded)

2. **Login** (`/login`)
   - Choose email or phone
   - Enter credentials
   - Access dashboard

3. **Complete KYT** (`/kyt` or from dashboard)
   - Set travel preferences
   - Travel style, pace, transport
   - Preferences saved for AI recommendations

4. **Plan Trip** (`/trips/select`)
   - Select date range (modern calendar)
   - Choose location (country, state, district)
   - Multi-location support

5. **Browse Experiences** (`/trips/experiences`)
   - View available experiences
   - Filter by location and dates
   - Add to bucketlist

6. **Review Schedule** (`/trips/schedule`)
   - View AI-generated itinerary
   - See day-by-day activities with times
   - Select hotels
   - Choose chauffeur service
   - Select guide (optional)
   - View recommendations for free days

7. **Payment** (`/trips/payment`)
   - Fund wallet (if needed)
   - Complete payment
   - Trip booked!

8. **View Dashboard** (`/dashboard`)
   - See all trips
   - Manage wallet
   - Access safety features
   - View preferences

### Provider Flow

1. **Sign Up** (`/host/signup`)
   - Choose provider type
   - Enter details (name, email, phone, password)
   - Account created

2. **Login** (`/host/login`)
   - Choose email or phone
   - Enter credentials
   - Access provider dashboard

3. **Manage Services**
   - **Experience Hosts**: 
     - Add experiences with time slots (`/host/experiences/add`)
     - Select dates and set time slots
     - Upload images
     - Set pricing
   - **Guides**: Manage tours and availability
   - **Hotel Owners**: 
     - List hotels (`/host/hotels/add`)
     - Upload images
     - Set amenities
   - **Drivers**: 
     - Complete onboarding (`/driver/onboarding`)
     - View assigned trips (`/driver/schedule`)
     - Manage vehicle details

4. **View Dashboard**
   - See bookings
   - Manage availability
   - View earnings
   - Access service-specific features

### Driver/Chauffeur Flow

1. **Sign Up as Driver Partner**
   - Register with providerType: DRIVER_PARTNER
   - Account created

2. **Complete Onboarding** (`/driver/onboarding`)
   - Complete required steps:
     - Driving License
     - Vehicle Registration
     - Vehicle Insurance
     - Vehicle Details
   - Optional steps:
     - Profile Picture
     - Preferred Language
   - Progress tracked with visual indicators

3. **View Assigned Trips** (`/driver/schedule`)
   - See list of trips requiring chauffeur service
   - Select trip to view details
   - See complete itinerary:
     - Traveler contact information
     - Day-by-day schedule
     - Activity times and locations
     - Hotel information
     - Pickup/drop-off instructions

4. **Execute Trip**
   - Follow daily itinerary
   - Pick up traveler from hotel
   - Drive to activities on time
   - Drop off at hotel after activities

---

## 🏗️ Architecture Overview

### Frontend Architecture

**Framework**: Next.js 14 with App Router
- **Pages**: File-based routing in `app/` directory
- **Components**: Reusable React components in `components/`
- **State Management**: React Hooks (useState, useEffect, Context API)
- **Styling**: Tailwind CSS with custom design system
- **API Communication**: Axios with interceptors for token injection

**Key Patterns:**
- **Client Components**: Most pages are client components (`'use client'`)
- **Server Components**: Used where possible for better performance
- **Context API**: Authentication context for user state
- **Local Storage**: Token storage and user data caching

### Backend Architecture

**Framework**: Express.js
- **MVC Pattern**: Models, Routes (Controllers), Services
- **Middleware**: Authentication, file upload, error handling
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens, bcrypt for passwords
- **File Storage**: Local file system (Multer)

**Key Patterns:**
- **RESTful API**: Standard REST endpoints
- **Middleware Chain**: Authentication → Validation → Business Logic → Response
- **Service Layer**: Business logic separated into services
- **Error Handling**: Centralized error handling middleware

### Data Flow

1. **User Action** → Frontend component
2. **API Call** → Axios client (with token)
3. **Backend Route** → Authentication middleware
4. **Business Logic** → Service layer
5. **Database** → Mongoose models
6. **Response** → JSON data
7. **State Update** → React state management
8. **UI Update** → Component re-render

---

## 👥 Test Users

The project includes a script to create test users for all account types.

### Create Test Users

```bash
cd backend
node scripts/createTestUsers.js
```

### Test User Credentials

All test users use password: **password123**

#### Travelers
- `traveler1@test.com` / `+1234567890`
- `traveler2@test.com` / `+1234567891`
- `traveler3@test.com` / `+1234567892`

#### Experience Hosts
- `experience.host1@test.com` / `+1234567800`
- `experience.host2@test.com` / `+1234567801`

#### Tour Guides
- `guide1@test.com` / `+1234567810`
- `guide2@test.com` / `+1234567811`

#### Hotel Owners
- `hotel.owner1@test.com` / `+1234567820`
- `hotel.owner2@test.com` / `+1234567821`

#### Driver Partners
- `driver1@test.com` / `+1234567830`
- `driver2@test.com` / `+1234567831`

See `TEST_USERS.md` for complete list.

---

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Issues

**Problem**: "MongoDB connection error"

**Solutions**:
1. **Local MongoDB**: Ensure MongoDB is running
   ```bash
   sudo systemctl start mongod  # Linux
   # OR
   brew services start mongodb-community  # macOS
   ```

2. **MongoDB Atlas**: 
   - Verify connection string in `.env`
   - Check IP whitelist in Atlas dashboard
   - Ensure database name is included in connection string

#### Port Already in Use

**Problem**: "Port 5000/3000 already in use"

**Solutions**:
```bash
# Find process using port
lsof -i :5000  # or :3000

# Kill the process
kill -9 <PID>
```

#### CORS Errors

**Problem**: CORS errors in browser console

**Solutions**:
- Ensure backend CORS is configured for `http://localhost:3000`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Verify backend server is running

#### Calendar Not Clickable

**Problem**: Dates not selectable in calendar

**Solutions**:
- Ensure `react-day-picker` is properly imported
- Check CSS classes for pointer-events
- Verify `isClient` state is set to true
- Check browser console for JavaScript errors

#### AI Scheduler Not Working

**Problem**: AI scheduling fails or returns errors

**Solutions**:
- Verify `OPENAI_API_KEY` is set in backend `.env`
- Check API key validity
- System will fallback to rule-based scheduler if AI unavailable
- Check backend logs for OpenAI API errors

#### File Upload Issues

**Problem**: Image upload fails

**Solutions**:
- Check file size (must be < 5MB)
- Verify `uploads/` directory exists in backend
- Check file permissions
- Ensure Multer is properly configured

---

## 🤝 Contributing

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed

3. **Test your changes**
   - Test both frontend and backend
   - Verify API endpoints work correctly
   - Check for console errors

4. **Commit your changes**
   ```bash
   git commit -m "Add: Description of your feature"
   ```

### Code Style Guidelines

- **Frontend**: Use TypeScript, follow React best practices
- **Backend**: Use async/await, proper error handling
- **Naming**: Use descriptive variable and function names
- **Comments**: Add comments for complex business logic

---

## 📝 License

This project is private and proprietary.

---

## 📞 Support

For issues, questions, or suggestions:
- Check existing documentation
- Review code comments
- Check console logs for errors

---

## 🎉 Acknowledgments

Built with:
- Next.js for the amazing React framework
- Express.js for robust backend API
- MongoDB for flexible data storage
- Tailwind CSS for beautiful styling
- OpenAI for intelligent trip scheduling
- react-day-picker for modern calendar UI

---

**Last Updated**: December 2024

**Version**: 2.0.0

---

*Happy Traveling! 🌍✈️*
