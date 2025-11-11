# 🔧 Setup MongoDB Atlas Connection

## 📋 Steps to Configure Your Atlas Connection

### 1. Get Your Connection String from MongoDB Atlas

1. Log into: https://cloud.mongodb.com
2. Go to your **Cluster** (click on it)
3. Click **"Connect"** button
4. Choose **"Connect your application"**
5. Select **"Node.js"** and version **"5.5 or later"**
6. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### 2. Update Your Connection String

**Important:** Replace these parts:
- `<username>` → Your database username
- `<password>` → Your database password
- Keep everything else as is

**Add database name** at the end:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aitourism?retryWrites=true&w=majority
```
(Notice `/aitourism` after `.net`)

### 3. Update backend/.env File

Edit `backend/.env` and update the MONGODB_URI:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/aitourism?retryWrites=true&w=majority
JWT_SECRET=dev-secret-key-change-in-production
PORT=5000
EXCHANGE_RATE_API_KEY=
```

**⚠️ Important:**
- Replace `yourusername` with your Atlas username
- Replace `yourpassword` with your Atlas password
- Replace `cluster0.xxxxx.mongodb.net` with your actual cluster address
- Make sure there's `/aitourism` before the `?`

### 4. Verify IP Whitelist

In MongoDB Atlas:
1. Go to **Network Access**
2. Make sure your IP is whitelisted, OR
3. Add `0.0.0.0/0` (allows from anywhere - OK for development)

### 5. Restart Backend

```bash
cd /media/adarsh/Extra/theAct/PoC/backend
npm run dev
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
AI Tourism Platform running on port 5000
```

## 🔍 Troubleshooting

### Error: "Authentication failed"
- Check username/password in connection string
- Make sure password is URL-encoded if it has special characters

### Error: "IP not whitelisted"
- Go to Atlas → Network Access
- Add your IP or `0.0.0.0/0` for development

### Error: "Connection timeout"
- Check your internet connection
- Verify cluster is running in Atlas dashboard

### Connection String Format
Correct format:
```
mongodb+srv://username:password@cluster.mongodb.net/aitourism?retryWrites=true&w=majority
```

Wrong formats:
```
mongodb+srv://username:password@cluster.mongodb.net/  ❌ (no database name)
mongodb://username:password@cluster.mongodb.net/...   ❌ (wrong protocol, use mongodb+srv)
```

## ✅ Success!

Once connected, you'll see:
- ✅ MongoDB Connected message
- ✅ Backend running without errors
- ✅ Frontend login/signup will work!

---

**Need help?** Share your connection string format (with passwords hidden) and I can help verify it!



