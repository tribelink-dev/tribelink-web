# 🔧 Backend Troubleshooting Guide

## "Route not found" Error

### Common Causes

1. **Missing `/api` prefix** - All routes require `/api` prefix
2. **Wrong endpoint path** - Check the exact route path
3. **CORS issues** - Frontend URL not in allowed origins
4. **Backend not running** - Check if backend is actually deployed and running

---

## ✅ Testing Your Backend

### 1. Test Health Endpoint

```bash
curl https://your-backend-url.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "Tribelink Platform API is running"
}
```

### 2. Test API Endpoint

```bash
curl https://your-backend-url.onrender.com/api/auth/login
```

**Expected Response:**
- If route exists: Should return an error about missing fields (not "Route not found")
- If "Route not found": The route isn't registered correctly

---

## 📋 Available API Routes

All routes require `/api` prefix:

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `POST /api/auth/otp/send-phone`
- `POST /api/auth/otp/verify-phone`

### User
- `GET /api/user/me`
- `POST /api/user/kyt`
- `GET /api/user/cart`

### Trips
- `GET /api/trips/search`
- `POST /api/trips/schedule`
- `GET /api/trips/:tripId`

### Hotels
- `GET /api/hotels`
- `POST /api/hotels`

### Safety
- `GET /api/safety/contacts`
- `POST /api/safety/sos`

---

## 🔍 Debugging Steps

### Step 1: Verify Backend is Running

Check Render logs:
1. Go to Render Dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for: `AI Tourism Platform running on http://...`

### Step 2: Test Health Endpoint

```bash
# Replace with your actual Render URL
curl https://your-app-name.onrender.com/health
```

If this fails, the backend isn't running properly.

### Step 3: Check CORS Configuration

If health works but API calls fail, check CORS:

1. Go to Render → Environment Variables
2. Add/Update: `FRONTEND_URL` = `https://your-frontend.vercel.app`
3. Add: `NODE_ENV` = `production` (to allow CORS from your frontend)

### Step 4: Verify Route Paths

Make sure you're using the correct path:
- ✅ Correct: `https://backend.onrender.com/api/auth/login`
- ❌ Wrong: `https://backend.onrender.com/auth/login` (missing `/api`)
- ❌ Wrong: `https://backend.onrender.com/api/` (no route)

---

## 🛠️ Common Fixes

### Fix 1: Update CORS for Production

In Render Environment Variables, add:
```
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

### Fix 2: Check MongoDB Connection

Make sure `MONGODB_URI` is set correctly in Render:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aitourism
```

### Fix 3: Verify All Environment Variables

Required variables in Render:
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL` (your Vercel frontend URL)
- `SESSION_SECRET`
- `PORT` (optional, defaults to 5000)
- `OPENAI_API_KEY` (optional)

---

## 🧪 Quick Test Script

Test your backend with this:

```bash
# 1. Health check
curl https://your-backend.onrender.com/health

# 2. Test login endpoint (should return validation error, not "Route not found")
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# 3. Test hotels endpoint
curl https://your-backend.onrender.com/api/hotels
```

---

## 📞 Still Having Issues?

1. Check Render logs for errors
2. Verify MongoDB Atlas connection
3. Ensure all environment variables are set
4. Test with `curl` or Postman before testing from frontend

