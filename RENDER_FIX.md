# 🔧 Fix Render Deployment Error

## Problem
```
npm error Missing script: "start"
```

This happens because Render is looking for `package.json` in the root directory instead of the `backend` directory.

## Solution

### Option 1: Set Root Directory (Recommended)

1. Go to your Render Dashboard
2. Click on your Web Service
3. Go to **Settings** tab
4. Scroll down to **Build & Deploy**
5. Find **Root Directory** field
6. Set it to: `backend`
7. Click **Save Changes**
8. Render will automatically redeploy

### Option 2: Update Start Command (If Root Directory doesn't work)

1. Go to **Settings** → **Build & Deploy**
2. Update **Start Command** to:
   ```
   cd backend && npm start
   ```
3. Click **Save Changes**

## Verify Configuration

After fixing, your Render settings should be:

- **Root Directory**: `backend`
- **Build Command**: `npm install` (or empty)
- **Start Command**: `npm start`
- **Environment**: Node

## After Fix

Render will:
1. Look for `package.json` in the `backend/` directory ✅
2. Run `npm install` to install dependencies ✅
3. Run `npm start` which executes `node server.js` ✅

Your backend should deploy successfully! 🎉

