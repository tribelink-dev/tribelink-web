# ⚙️ Vercel Environment Variable Setup

## Your Backend URL

**Backend (Render):** `https://tribelink-web.onrender.com`  
**API Base URL:** `https://tribelink-web.onrender.com/api`

---

## 🔧 Configure Vercel Environment Variable

### Step 1: Go to Vercel Dashboard

1. Visit: https://vercel.com/dashboard
2. Select your **tribelink-web** project (or create one if not exists)

### Step 2: Add Environment Variable

1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Fill in:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://tribelink-web.onrender.com/api`
   - **Environment**: Select all three:
     - ✅ Production
     - ✅ Preview  
     - ✅ Development
4. Click **Save**

### Step 3: Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## ✅ Verify Configuration

After redeploying, test your frontend:

1. Visit your Vercel frontend URL
2. Open browser **Developer Tools** (F12)
3. Go to **Console** tab
4. Try to login or make any API call
5. Check **Network** tab:
   - Requests should go to: `https://tribelink-web.onrender.com/api/...`
   - Should NOT show CORS errors
   - Should NOT show "Route not found" (unless testing wrong endpoint)

---

## 🔧 Backend CORS Configuration

Make sure your Render backend has these environment variables:

### In Render Dashboard → Environment Variables:

```env
FRONTEND_URL=https://your-vercel-app.vercel.app
NODE_ENV=production
```

**Replace `your-vercel-app` with your actual Vercel domain!**

---

## 📋 Quick Checklist

- [ ] Backend deployed: `https://tribelink-web.onrender.com` ✅
- [ ] Backend health check works: `/health` endpoint
- [ ] Vercel environment variable set: `NEXT_PUBLIC_API_URL`
- [ ] Value: `https://tribelink-web.onrender.com/api`
- [ ] Render CORS configured: `FRONTEND_URL` set to Vercel URL
- [ ] Frontend redeployed after setting environment variable
- [ ] Test connection from browser

---

## 🧪 Test Commands

### Test Backend Health:
```bash
curl https://tribelink-web.onrender.com/health
```

### Test API Endpoint:
```bash
curl https://tribelink-web.onrender.com/api/hotels
```

### Test from Browser:
1. Open your Vercel frontend
2. Open DevTools → Network tab
3. Try to login or browse experiences
4. Check if requests go to `tribelink-web.onrender.com`

---

## 🚨 Troubleshooting

### If you see CORS errors:
- Check `FRONTEND_URL` in Render = your exact Vercel URL
- Make sure `NODE_ENV=production` in Render
- Redeploy backend after changing environment variables

### If you see "Route not found":
- Check `NEXT_PUBLIC_API_URL` includes `/api` at the end
- Verify backend routes are working: test `/health` endpoint
- Check browser Network tab to see actual URL being called

### If requests timeout:
- Check Render logs - is backend running?
- Verify backend URL is correct
- Check if Render free tier spun down (may need to wake it up)

---

## 📝 Summary

**Your Setup:**
- Frontend: Vercel → `https://your-app.vercel.app`
- Backend: Render → `https://tribelink-web.onrender.com`
- API: `https://tribelink-web.onrender.com/api`

**Vercel Environment Variable:**
```
NEXT_PUBLIC_API_URL=https://tribelink-web.onrender.com/api
```

**Render Environment Variable:**
```
FRONTEND_URL=https://your-app.vercel.app
```

That's it! They'll connect automatically once both are configured. 🚀

