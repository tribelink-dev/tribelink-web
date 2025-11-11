# 🚀 Backend Deployment Guide

## Quick Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up**: https://railway.app (free tier available)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `tribelink-web` repository
   - Select the `dev` branch

3. **Configure Service**:
   - Root Directory: `backend`
   - Build Command: (leave empty, Railway auto-detects)
   - Start Command: `npm start`

4. **Set Environment Variables** in Railway dashboard:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-secret-key
   PORT=5000
   FRONTEND_URL=https://your-frontend.vercel.app
   OPENAI_API_KEY=your-openai-key (optional)
   ```

5. **Get Your Production URL**:
   - Railway will provide: `https://your-app-name.up.railway.app`
   - Your API URL will be: `https://your-app-name.up.railway.app/api`

---

### Option 2: Render (Free Tier Available)

1. **Sign up**: https://render.com

2. **Create New Web Service**:
   - Connect GitHub repository
   - Select `dev` branch
   - **Root Directory**: `backend` ⚠️ **IMPORTANT: Must set this!**
   - **Build Command**: `npm install` (or leave empty - Render will auto-install)
   - **Start Command**: `npm start`
   - Environment: Node
   - Instance Type: Free (or paid for better performance)

   **⚠️ Critical**: If you don't set Root Directory to `backend`, Render will look for `package.json` in the root and fail. Make sure "Root Directory" is set to `backend` in your Render service settings.

3. **Set Environment Variables**:
   - Same as Railway (see above)

4. **Get Your Production URL**:
   - Render provides: `https://your-app-name.onrender.com`
   - Your API URL: `https://your-app-name.onrender.com/api`

---

### Option 3: DigitalOcean App Platform

1. **Sign up**: https://www.digitalocean.com/products/app-platform

2. **Create App from GitHub**:
   - Connect repository
   - Select `backend` as source directory
   - Auto-detect Node.js

3. **Environment Variables**: Same as above

4. **Production URL**: `https://your-app-name.ondigitalocean.app/api`

---

## After Deployment

Once your backend is deployed, update your **Vercel environment variable**:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update: `NEXT_PUBLIC_API_URL`
3. Value: `https://your-backend-url.com/api` (from Railway/Render/etc.)
4. Redeploy your frontend

---

## Important Notes

- **CORS**: Make sure to add your Vercel frontend URL to the backend's CORS allowed origins
- **MongoDB**: Use MongoDB Atlas (cloud database) - not local MongoDB
- **File Uploads**: For production, consider using cloud storage (AWS S3, Cloudinary) instead of local `uploads/` folder
- **Environment Variables**: Never commit `.env` files - set them in your hosting platform

---

## Quick Test

After deployment, test your backend:
```bash
curl https://your-backend-url.com/api/health
```

Should return: `{ "status": "ok" }` or similar

