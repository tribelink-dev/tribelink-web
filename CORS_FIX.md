# 🔧 Fix CORS and Connection Issues

## Current Status

- ✅ Backend deployed: `https://tribelink-web.onrender.com`
- ✅ Backend routes working: `/api/auth/login` responds correctly
- ❌ Frontend can't connect: CORS or environment variable issue
- ❌ "Route not found" error: Likely accessing wrong endpoint

---

## 🔴 Issue 1: CORS Configuration

### Problem
Frontend on Vercel (`https://tribelink-app.vercel.app`) can't connect to backend because CORS is blocking the request.

### Solution: Update Render Environment Variables

1. Go to **Render Dashboard** → Your Service → **Environment**
2. Add/Update these variables:

```env
FRONTEND_URL=https://tribelink-app.vercel.app
NODE_ENV=production
```

**Important:**
- Use exact URL: `https://tribelink-app.vercel.app` (no trailing slash)
- Must include `https://`
- Set `NODE_ENV=production` to enable CORS checking

3. **Redeploy** the backend after adding these variables

---

## 🔴 Issue 2: "Route not found" Error

### Possible Causes

1. **Accessing root URL** (`/`) instead of `/api/...`
2. **Wrong endpoint path**
3. **Missing `/api` prefix**

### Test Your Backend Routes

```bash
# ✅ Health check (no /api needed)
curl https://tribelink-web.onrender.com/health

# ✅ Login endpoint (requires /api)
curl -X POST https://tribelink-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'

# ✅ Hotels endpoint
curl https://tribelink-web.onrender.com/api/hotels
```

All should return JSON (not "Route not found").

---

## ✅ Complete Fix Steps

### Step 1: Configure Render (Backend)

In Render Dashboard → Environment Variables:

```env
# Required
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-secret-key
FRONTEND_URL=https://tribelink-app.vercel.app
NODE_ENV=production
SESSION_SECRET=your-session-secret

# Optional
OPENAI_API_KEY=your-openai-key
PORT=5000
```

**After adding, click "Save Changes" and redeploy.**

### Step 2: Configure Vercel (Frontend)

In Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_API_URL=https://tribelink-web.onrender.com/api
```

**Important:**
- Include `/api` at the end
- Use `https://` (not `http://`)
- No trailing slash after `/api`

**After adding, redeploy the frontend.**

### Step 3: Verify Connection

1. **Test backend directly:**
   ```bash
   curl https://tribelink-web.onrender.com/health
   ```

2. **Test from browser:**
   - Open: `https://tribelink-app.vercel.app`
   - Open DevTools → Network tab
   - Try to login
   - Check if requests go to `tribelink-web.onrender.com`
   - Check for CORS errors in Console

---

## 🧪 Debugging Commands

### Test Backend CORS

```bash
# Test with Vercel origin
curl -X POST https://tribelink-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://tribelink-app.vercel.app" \
  -d '{"email":"test","password":"test"}' \
  -v
```

Look for `Access-Control-Allow-Origin` header in response.

### Check What URL Frontend is Using

1. Open browser DevTools on Vercel frontend
2. Go to Console tab
3. Type: `process.env.NEXT_PUBLIC_API_URL`
4. Should show: `https://tribelink-web.onrender.com/api`

---

## 🚨 Common Issues

### Issue: "Cannot connect to server"

**Causes:**
- CORS blocking the request
- Wrong `NEXT_PUBLIC_API_URL` in Vercel
- Backend not running (check Render logs)

**Fix:**
1. Verify `FRONTEND_URL` in Render = `https://tribelink-app.vercel.app`
2. Verify `NEXT_PUBLIC_API_URL` in Vercel = `https://tribelink-web.onrender.com/api`
3. Check Render logs to ensure backend is running
4. Redeploy both after fixing

### Issue: "Route not found"

**Causes:**
- Missing `/api` prefix in URL
- Wrong endpoint path
- Backend routes not registered

**Fix:**
1. Check browser Network tab for actual URL being called
2. Should be: `https://tribelink-web.onrender.com/api/...`
3. Test endpoint directly with curl to verify it exists

---

## 📋 Quick Checklist

- [ ] Render: `FRONTEND_URL=https://tribelink-app.vercel.app`
- [ ] Render: `NODE_ENV=production`
- [ ] Render: Backend redeployed after adding env vars
- [ ] Vercel: `NEXT_PUBLIC_API_URL=https://tribelink-web.onrender.com/api`
- [ ] Vercel: Frontend redeployed after adding env var
- [ ] Test: `curl https://tribelink-web.onrender.com/health` works
- [ ] Test: Login from Vercel frontend works
- [ ] Check: No CORS errors in browser console

---

## 🎯 Expected Behavior After Fix

1. **Backend health check:** `curl https://tribelink-web.onrender.com/health` → Returns `{"status":"OK"}`
2. **Backend API:** `curl https://tribelink-web.onrender.com/api/auth/login` → Returns validation error (not "Route not found")
3. **Frontend login:** Should connect successfully, no CORS errors
4. **Browser Network tab:** Shows requests to `tribelink-web.onrender.com/api/...`

---

## 📞 Still Not Working?

1. **Check Render logs** - Is backend actually running?
2. **Check Vercel logs** - Any build errors?
3. **Check browser console** - What's the exact error?
4. **Test with curl** - Does the endpoint work directly?
5. **Verify environment variables** - Are they set correctly in both platforms?

