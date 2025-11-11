# 🚀 Start Your Application - Quick Commands

## ✅ Dependencies Installed Successfully!

The warnings you saw are normal deprecation notices - your app will work fine.

## Next Steps to View Your App:

### 1. Check/Start MongoDB

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# If not running, start it:
sudo systemctl start mongod
# OR
mongod --dbpath ~/data/db
```

### 2. Start Backend Server

**Open Terminal 1:**
```bash
cd /media/adarsh/Extra/theAct/PoC/backend
npm run dev
```

**Expected output:**
```
MongoDB Connected: localhost:27017
AI Tourism Platform running on port 5000
```

### 3. Start Frontend Server

**Open Terminal 2 (new terminal window):**
```bash
cd /media/adarsh/Extra/theAct/PoC/frontend
npm run dev
```

**Expected output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in X seconds
```

### 4. Open in Browser 🌐

Open your web browser and navigate to:

## **http://localhost:3000**

You should see the **Login Page**!

---

## 🎯 What to Do Next:

1. **Sign Up** - Create a new account
2. **Complete KYT** - Answer the 3 preference questions
3. **Plan Trip** - Enter dates and location
4. **Browse Experiences** - (You may need to create test data first)
5. **View Schedule** - See your optimized trip
6. **Payment** - Test the wallet system

---

## 🔧 If MongoDB is Not Running:

**Option 1: Start MongoDB service**
```bash
sudo systemctl start mongod
```

**Option 2: Run MongoDB manually**
```bash
mongod --dbpath ~/data/db
```

**Option 3: Use MongoDB Atlas (Cloud)**
- Update `backend/.env` with your Atlas connection string:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aitourism
```

---

## 🎨 Quick Visual Test:

Once both servers are running:

1. Browser → http://localhost:3000
2. Click "Sign up"
3. Fill the form and submit
4. You'll be redirected to the KYT questionnaire
5. Answer the 3 questions
6. Continue to trip selection!

---

## 📝 Troubleshooting:

**Backend won't start?**
- Check MongoDB is running
- Check port 5000 is available
- See error messages in terminal

**Frontend won't start?**
- Make sure backend is running first
- Check Node.js version (needs 18+)
- Check port 3000 is available

**Page shows errors?**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

---

**Happy coding! 🎉**

