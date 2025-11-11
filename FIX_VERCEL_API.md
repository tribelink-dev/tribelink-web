# 🔧 Fix "Route not found" - Vercel Frontend to Render Backend

## ✅ Backend Status
- **Backend URL**: `https://tribelink-web.onrender.com` ✅ Working
- **Health Check**: ✅ Working
- **API Routes**: ✅ Working (tested `/api/auth/login`)

## 🔍 The Problem

Your frontend on Vercel is calling the wrong URL or the environment variable isn't set.

---

## 🛠️ Solution: Set Environment Variable in Vercel

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Click on your project: **tribelink-app** (or whatever your project name is)

### Step 2: Add Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Fill in exactly:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://tribelink-web.onrender.com/api`
   - **Environment**: Select all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
4. Click **Save**

### Step 3: Redeploy

**Important**: After adding the environment variable, you MUST redeploy:

1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** (three dots) menu
4. Click **Redeploy**
5. Wait for deployment to complete

---

## 🧪 Verify It's Working

### Test 1: Check Browser Console

1. Visit: https://tribelink-app.vercel.app/login
2. Open **Developer Tools** (F12)
3. Go to **Console** tab
4. Look for any logs showing the API URL
5. The code logs: `console.log('Login request:', ...)` - check what URL it shows

### Test 2: Check Network Tab

1. Open **Network** tab in DevTools
2. Try to login
3. Look for the request to `/auth/login`
4. Check the **Request URL** - it should be:
   ```
   https://tribelink-web.onrender.com/api/auth/login
   ```
   
   **NOT:**
   - `http://localhost:5000/api/auth/login` ❌
   - `https://tribelink-web.onrender.com/auth/login` ❌ (missing `/api`)

### Test 3: Check Environment Variable

Add this temporary debug code to see what URL is being used:

In `frontend/lib/api.ts`, the `API_URL` is:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
```

If `NEXT_PUBLIC_API_URL` is not set, it defaults to `localhost:5000/api` which won't work on Vercel.

---

## 🚨 Common Mistakes

### Mistake 1: Forgot to Redeploy
- ✅ Added environment variable
- ❌ Forgot to redeploy
- **Fix**: Redeploy after adding env var!

### Mistake 2: Wrong Value Format
- ❌ `https://tribelink-web.onrender.com` (missing `/api`)
- ✅ `https://tribelink-web.onrender.com/api` (correct)

### Mistake 3: Used Secret Reference
- ❌ `@next_public_api_url` (secret reference)
- ✅ `https://tribelink-web.onrender.com/api` (direct value)

### Mistake 4: Only Set for Production
- ❌ Only selected "Production"
- ✅ Select all: Production, Preview, Development

---

## 📋 Quick Checklist

- [ ] Backend working: `https://tribelink-web.onrender.com` ✅
- [ ] Vercel env var added: `NEXT_PUBLIC_API_URL`
- [ ] Value correct: `https://tribelink-web.onrender.com/api`
- [ ] All environments selected: Production, Preview, Development
- [ ] **Redeployed after adding env var** ⚠️ CRITICAL
- [ ] Tested from browser - check Network tab
- [ ] No more "Route not found" errors

---

## 🎯 Expected Behavior After Fix

1. **Browser Network Tab** shows requests to:
   ```
   https://tribelink-web.onrender.com/api/auth/login
   ```

2. **Login works** or shows validation errors (not "Route not found")

3. **Console logs** show the correct API URL

---

## 🔍 Still Not Working?

If you've set the environment variable and redeployed but still getting "Route not found":

1. **Check the actual request URL** in browser Network tab
2. **Share the exact URL** from Network tab
3. **Check Vercel build logs** - does it show the env var being used?
4. **Verify backend CORS** - is `FRONTEND_URL` set in Render?

The backend is working, so this is definitely a frontend configuration issue! 🎯

