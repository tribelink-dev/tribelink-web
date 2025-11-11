# 🔗 Connecting Frontend (Vercel) and Backend (Render)

## Architecture Overview

```
┌─────────────────┐         HTTP Requests         ┌─────────────────┐
│                 │  ───────────────────────────>  │                 │
│  Frontend       │                                │  Backend        │
│  (Vercel)       │  <───────────────────────────  │  (Render)       │
│                 │         JSON Responses         │                 │
└─────────────────┘                                └─────────────────┘
   https://your-app.vercel.app              https://your-backend.onrender.com
```

---

## How They Connect

### 1. **Frontend Makes HTTP Requests**

Your Next.js frontend (on Vercel) makes API calls to your backend (on Render) using Axios.

**Example:**
```typescript
// frontend/lib/api.ts
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // Points to Render backend
  // ...
});

// Frontend makes request:
api.get('/user/me') 
// → Actually calls: https://your-backend.onrender.com/api/user/me
```

### 2. **Backend Responds with JSON**

Your Express backend (on Render) processes the request and returns JSON data.

---

## 🔧 Configuration Steps

### Step 1: Deploy Backend on Render

1. Deploy backend → Get URL: `https://your-backend.onrender.com`
2. Your API base URL: `https://your-backend.onrender.com/api`

### Step 2: Configure Backend CORS (Render)

In Render Environment Variables, add:

```env
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

This allows your Vercel frontend to make requests to your Render backend.

### Step 3: Configure Frontend API URL (Vercel)

In Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

**Important:** 
- Include `/api` at the end
- Use `https://` (not `http://`)
- No trailing slash after `/api`

### Step 4: Deploy Frontend on Vercel

Vercel will automatically use the `NEXT_PUBLIC_API_URL` environment variable.

---

## 📋 Complete Setup Checklist

### Backend (Render) Environment Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aitourism

# Security
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret

# CORS - CRITICAL for frontend connection
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production

# Server
PORT=5000

# Optional
OPENAI_API_KEY=your-openai-key
```

### Frontend (Vercel) Environment Variables

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

---

## 🔄 Request Flow Example

### User Login Flow

1. **User visits**: `https://your-app.vercel.app/login`
2. **User enters credentials** and clicks "Login"
3. **Frontend (Vercel)** makes request:
   ```
   POST https://your-backend.onrender.com/api/auth/login
   Body: { email: "...", password: "..." }
   ```
4. **Backend (Render)** processes:
   - Validates credentials
   - Checks MongoDB
   - Generates JWT token
   - Returns: `{ token: "...", user: {...} }`
5. **Frontend (Vercel)** receives response:
   - Stores token in localStorage
   - Redirects to dashboard

---

## 🛡️ CORS Configuration

Your backend (`backend/server.js`) already has CORS configured:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL  // ← Your Vercel URL goes here
].filter(Boolean);
```

**Make sure `FRONTEND_URL` is set in Render** to allow requests from Vercel!

---

## ✅ Testing the Connection

### 1. Test Backend Health

```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "message": "Tribelink Platform API is running"
}
```

### 2. Test from Frontend

After deploying frontend, open browser console and check:
- Network tab should show requests to `your-backend.onrender.com`
- No CORS errors
- API calls return data (not "Route not found")

### 3. Test Login Flow

1. Go to your Vercel frontend
2. Try to login
3. Check browser Network tab:
   - Request URL: `https://your-backend.onrender.com/api/auth/login`
   - Status: Should be 200 (success) or 400/401 (validation error)
   - **NOT 404** (Route not found)

---

## 🚨 Common Issues

### Issue 1: CORS Error

**Error:** `Access to fetch at '...' has been blocked by CORS policy`

**Fix:**
1. Add `FRONTEND_URL` to Render environment variables
2. Value: `https://your-frontend.vercel.app` (exact URL, no trailing slash)
3. Redeploy backend

### Issue 2: "Route not found" from Frontend

**Error:** Frontend gets 404 when calling API

**Fix:**
1. Check `NEXT_PUBLIC_API_URL` in Vercel
2. Should be: `https://your-backend.onrender.com/api` (with `/api`)
3. Check browser Network tab to see actual URL being called

### Issue 3: Backend Not Responding

**Error:** Timeout or connection refused

**Fix:**
1. Check Render logs - is backend running?
2. Verify backend URL is correct
3. Test health endpoint directly: `https://your-backend.onrender.com/health`

---

## 📝 Quick Reference

| Component | Platform | URL Format |
|-----------|----------|------------|
| Frontend | Vercel | `https://your-app.vercel.app` |
| Backend | Render | `https://your-backend.onrender.com` |
| API Base | Render | `https://your-backend.onrender.com/api` |

**Vercel Environment Variable:**
```
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

**Render Environment Variable:**
```
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🎯 Summary

1. **Backend on Render** → Provides API at `https://your-backend.onrender.com/api`
2. **Frontend on Vercel** → Makes requests using `NEXT_PUBLIC_API_URL`
3. **CORS configured** → Backend allows requests from Vercel frontend
4. **They communicate** → Via HTTP/HTTPS requests (standard web protocol)

No special connection needed - they're just two separate servers talking over the internet! 🌐

