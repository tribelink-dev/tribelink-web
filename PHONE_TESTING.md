# Testing the App on Your Phone

## Quick Setup Guide

### Step 1: Make sure both servers are running

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# or
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 2: Find Your Computer's IP Address

Your local IP address is: **172.16.68.100**

To verify or find a different IP:
- Linux: `hostname -I` or `ip addr show`
- Mac: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Windows: `ipconfig` (look for IPv4 Address)

### Step 3: Connect Your Phone to the Same Network

Make sure your phone is connected to the **same Wi-Fi network** as your computer.

### Step 4: Access the App on Your Phone

Open your phone's browser and go to:

**Frontend (Main App):**
```
http://172.16.68.100:3000
```

**Backend API (if needed for testing):**
```
http://172.16.68.100:5000/api
```

### Step 5: Update API URL (if needed)

If the app doesn't connect to the backend, you may need to update the API URL:

1. Create a `.env.local` file in the `frontend` directory:
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://172.16.68.100:5000/api" > .env.local
```

2. Restart the frontend dev server

### Troubleshooting

**Can't access from phone?**
1. Check firewall: Make sure ports 3000 and 5000 are not blocked
   ```bash
   # Linux - Allow ports (if using ufw)
   sudo ufw allow 3000
   sudo ufw allow 5000
   ```

2. Verify IP address: Make sure you're using the correct IP
   ```bash
   hostname -I
   ```

3. Check network: Ensure phone and computer are on same Wi-Fi

**CORS errors?**
- The backend is already configured to allow requests from your local network
- If you still see CORS errors, check the browser console for the exact error

**Connection refused?**
- Make sure both servers are running
- Check that they're listening on `0.0.0.0` (all interfaces), not just `localhost`

### Alternative: Using ngrok (for external access)

If you want to test from anywhere (not just local network):

1. Install ngrok: https://ngrok.com/download

2. Expose frontend:
```bash
ngrok http 3000
```

3. Expose backend:
```bash
ngrok http 5000
```

4. Update `NEXT_PUBLIC_API_URL` in frontend with the ngrok backend URL

### Quick Test Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Phone connected to same Wi-Fi
- [ ] Can access http://172.16.68.100:3000 from phone browser
- [ ] API calls work (check browser console)

### Notes

- The app will work best on the same local network
- For production deployment, you'll need a proper domain and hosting
- Mobile browsers may cache aggressively - try incognito/private mode if issues occur
