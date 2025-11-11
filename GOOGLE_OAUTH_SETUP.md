# Google OAuth Setup Instructions

## Backend Setup

1. **Install dependencies** (already done):
   ```bash
   npm install passport passport-google-oauth20 express-session
   ```

2. **Create Google Cloud Project**:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable Google+ API (or Google Identity API)

3. **Create OAuth 2.0 Credentials**:
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Choose "Web application"
   - Set authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (for users)
     - `http://localhost:5000/api/auth/google/host/callback` (for hosts)
   - For production, add your production URLs

4. **Set Environment Variables**:
   Create a `.env` file in the backend directory:
   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   GOOGLE_CALLBACK_URL_USER=http://localhost:5000/api/auth/google/callback
   GOOGLE_CALLBACK_URL_HOST=http://localhost:5000/api/auth/google/host/callback
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:5000
   SESSION_SECRET=your-random-session-secret
   ```

## Frontend Setup

1. **Set Environment Variable** (optional, defaults to localhost):
   Create `.env.local` in frontend directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

## How It Works

1. **User clicks "Continue with Google"** → Redirects to Google OAuth
2. **Google authenticates** → Redirects back to callback URL
3. **Backend checks if user exists**:
   - If exists and has phone number → Logs in immediately
   - If exists but no phone number → Redirects to complete registration
   - If new user → Redirects to complete registration (phone + role for hosts)
4. **User completes registration** → Account created with Google OAuth
5. **User redirected** → Dashboard or appropriate page

## Features

- ✅ Google OAuth for Users and Hosts
- ✅ Automatic account linking (if email matches existing account)
- ✅ Phone number collection for OAuth users (required for authentication)
- ✅ Seamless login for existing OAuth users
- ✅ Professional UI with Google branding

## Testing

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Click "Continue with Google" on login/signup pages
4. Complete OAuth flow
5. For new users, provide phone number (and role for hosts)

