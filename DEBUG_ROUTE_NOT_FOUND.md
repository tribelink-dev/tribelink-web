# 🔍 Debugging "Route not found" Error

## Your Setup
- **Frontend**: https://tribelink-app.vercel.app
- **Backend**: https://tribelink-web.onrender.com
- **API Base**: https://tribelink-web.onrender.com/api

---

## ✅ Verified Working Routes

These routes are confirmed working:

```bash
# Health check (no /api needed)
curl https://tribelink-web.onrender.com/health
# ✅ Returns: {"status":"OK","message":"Tribelink Platform API is running"}

# Hotels (public)
curl https://tribelink-web.onrender.com/api/hotels
# ✅ Returns: Hotel data

# Auth login (returns validation error, not "Route not found")
curl -X POST https://tribelink-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
# ✅ Returns: {"message":"Invalid credentials..."} (route exists)

# User bucketlist (requires auth)
curl https://tribelink-web.onrender.com/api/user/bucketlist \
  -H "Authorization: Bearer invalid"
# ✅ Returns: {"message":"Invalid token."} (route exists)
```

---

## 🔍 How to Find Which Route is Failing

### Step 1: Check Browser Console

1. Open your Vercel frontend: https://tribelink-app.vercel.app
2. Open **Developer Tools** (F12)
3. Go to **Network** tab
4. Try to use the app (login, browse, etc.)
5. Look for failed requests (red status codes)
6. Check the **Request URL** column

**Look for:**
- Requests showing `404` status
- Requests with URL that doesn't match backend routes
- Requests missing `/api` prefix

### Step 2: Check Render Logs

1. Go to Render Dashboard
2. Click on your service
3. Go to **Logs** tab
4. Look for requests that return `{"message":"Route not found"}`

**Check:**
- What URL path is being requested?
- Is it missing `/api` prefix?
- Is it a route that doesn't exist?

---

## 🚨 Common Causes

### 1. Root URL Request

**If you see:** Request to `https://tribelink-web.onrender.com/`

**This is normal!** The root URL returns "Route not found" because there's no route for `/`. Only `/health` and `/api/*` routes exist.

**Fix:** Ignore this - it's expected behavior.

### 2. Missing `/api` Prefix

**If frontend calls:** `/user/me` instead of `/api/user/me`

**Check:** Your `NEXT_PUBLIC_API_URL` in Vercel should be:
```
https://tribelink-web.onrender.com/api
```

**Note:** The `/api` is already in the base URL, so frontend calls like `api.get('/user/me')` become `https://tribelink-web.onrender.com/api/user/me` ✅

### 3. Wrong Route Path

**Check if frontend is calling:**
- `/user/cart` → Should be `/user/bucketlist`
- `/trips` → Should be `/trips/search` or `/trips/:id`
- `/experiences` → Should be `/trips/experiences/:district`

### 4. CORS Blocking Request

**If you see CORS errors in browser console:**

**Fix:** Add to Render Environment Variables:
```
FRONTEND_URL=https://tribelink-app.vercel.app
NODE_ENV=production
```

Then redeploy backend.

---

## 🧪 Test Your Backend Routes

Run these commands to verify all routes exist:

```bash
# Health
curl https://tribelink-web.onrender.com/health

# Auth routes
curl -X POST https://tribelink-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'

# User routes (will fail auth, but route exists)
curl https://tribelink-web.onrender.com/api/user/me \
  -H "Authorization: Bearer test"

# Hotels (public)
curl https://tribelink-web.onrender.com/api/hotels

# Trips search
curl "https://tribelink-web.onrender.com/api/trips/search?country=India&state=Kerala&district=Idukki&from=2024-12-01&to=2024-12-05"
```

All should return JSON (either data or error message), **NOT** `{"message":"Route not found"}`.

---

## 🔧 Quick Fixes

### If Root URL Shows "Route not found"

**This is normal!** Add a root route if you want:

```javascript
// In backend/server.js, before 404 handler:
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tribelink API', 
    version: '1.0.0',
    health: '/health',
    api: '/api'
  });
});
```

### If Specific Route Shows "Route not found"

1. Check the exact URL being called
2. Verify it matches a route in `backend/routes/*.js`
3. Check if route requires authentication
4. Verify the route is registered in `backend/server.js`

---

## 📋 Route Checklist

Verify these routes exist:

- ✅ `/health` - Health check
- ✅ `/api/auth/login` - User login
- ✅ `/api/auth/signup` - User signup
- ✅ `/api/auth/host/login` - Host login
- ✅ `/api/user/me` - Get user profile
- ✅ `/api/user/bucketlist` - Get bucketlist
- ✅ `/api/user/kyt` - Update preferences
- ✅ `/api/hotels` - Get hotels
- ✅ `/api/trips/search` - Search experiences
- ✅ `/api/trips/schedule` - Create trip schedule
- ✅ `/api/hosts/available` - Get available guides
- ✅ `/api/safety/contacts` - Get emergency contacts

---

## 🎯 Next Steps

1. **Check browser Network tab** to see which exact URL is failing
2. **Check Render logs** to see the request path
3. **Share the failing URL** and I can help fix it

The backend is working - we just need to identify which specific route is being called incorrectly!

