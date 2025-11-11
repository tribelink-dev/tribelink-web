# 🐛 Debugging API Calls - "Route not found" Issue

## Your Setup
- **Frontend**: https://tribelink-app.vercel.app
- **Backend**: https://tribelink-web.onrender.com
- **Expected API URL**: https://tribelink-web.onrender.com/api

---

## 🔍 How to Debug

### Step 1: Check Browser Console

1. Open your Vercel frontend: https://tribelink-app.vercel.app/login
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Try to login
5. Look for errors or logs showing the API URL being called

### Step 2: Check Network Tab

1. Open **Network** tab in Developer Tools
2. Try to login
3. Look for the failed request
4. Check:
   - **Request URL**: What URL is it trying to call?
   - **Status Code**: Is it 404 (Route not found)?
   - **Request Headers**: Check the full URL

### Step 3: Verify Environment Variable

The frontend should be calling:
```
https://tribelink-web.onrender.com/api/auth/login
```

**NOT:**
- `https://tribelink-web.onrender.com/auth/login` (missing `/api`)
- `http://localhost:5000/api/auth/login` (wrong URL)
- `https://tribelink-web.onrender.com/api/` (wrong endpoint)

---

## 🔧 Common Issues

### Issue 1: Environment Variable Not Set

**Symptom**: Frontend calls `http://localhost:5000/api/...`

**Fix**:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add: `NEXT_PUBLIC_API_URL = https://tribelink-web.onrender.com/api`
3. Redeploy

### Issue 2: Missing `/api` Prefix

**Symptom**: Frontend calls `https://tribelink-web.onrender.com/auth/login`

**Fix**: Make sure `NEXT_PUBLIC_API_URL` includes `/api`:
```
✅ Correct: https://tribelink-web.onrender.com/api
❌ Wrong: https://tribelink-web.onrender.com
```

### Issue 3: Wrong Endpoint Path

**Symptom**: Getting 404 on specific routes

**Check**: Verify the route exists in backend:
- `POST /api/auth/login` ✅ (exists)
- `GET /api/user/me` ✅ (exists)
- `GET /api/hotels` ✅ (exists)

---

## 🧪 Test Backend Routes Directly

### Test Health:
```bash
curl https://tribelink-web.onrender.com/health
```

### Test Login Endpoint:
```bash
curl -X POST https://tribelink-web.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

**Expected**: Should return validation error (not "Route not found")

### Test Hotels:
```bash
curl https://tribelink-web.onrender.com/api/hotels
```

---

## 📋 Quick Checklist

- [ ] Backend health works: `/health` ✅
- [ ] Backend API works: `/api/auth/login` returns validation error (not 404) ✅
- [ ] Vercel env var set: `NEXT_PUBLIC_API_URL`
- [ ] Value includes `/api`: `https://tribelink-web.onrender.com/api`
- [ ] Frontend redeployed after setting env var
- [ ] Check browser Network tab to see actual URL being called
- [ ] Check browser Console for errors

---

## 🎯 Next Steps

1. **Open browser DevTools** on your Vercel frontend
2. **Check Network tab** - see what URL the frontend is actually calling
3. **Share the exact URL** from the Network tab so we can debug further

The backend routes are working (tested), so the issue is likely:
- Frontend calling wrong URL
- Environment variable not set correctly
- CORS blocking the request

