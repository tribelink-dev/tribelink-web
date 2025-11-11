# Quick Start Guide - See Your App Graphically

## Step 1: Check Prerequisites

Make sure you have:
- Node.js installed (check with: `node --version` - should be 18+)
- MongoDB running (check with: `mongod --version`)

## Step 2: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

## Step 3: Set Up Environment Variables

**Backend (.env file):**
```bash
cd backend
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/aitourism
JWT_SECRET=your-secret-jwt-key-for-development
PORT=5000
EXCHANGE_RATE_API_KEY=
EOF
cd ..
```

**Frontend (.env.local file):**
```bash
cd frontend
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
EOF
cd ..
```

## Step 4: Start MongoDB

If MongoDB is not running:
```bash
# On Linux/Mac (if installed via package manager)
sudo systemctl start mongod

# Or run manually
mongod --dbpath /path/to/data
```

## Step 5: Run the Application

**Option A: Run both servers separately (recommended for first time):**

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```
Wait for: "AI Tourism Platform running on port 5000"

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```
Wait for: "Ready on http://localhost:3000"

**Option B: Run both with concurrently (from root):**
```bash
npm run dev
```

## Step 6: Open in Browser

Open your browser and go to:
**http://localhost:3000**

You should see the login page!

## Step 7: Test the Flow

1. **Create Account**: Click "Sign up" → Fill form → Submit
2. **KYT Questionnaire**: Answer the 3 preference questions
3. **Plan Trip**: Enter dates, country, state, district
4. **Browse Experiences**: Add experiences to cart
5. **View Schedule**: See your optimized trip schedule
6. **Payment**: Fund wallet and complete payment

## Troubleshooting

**Port already in use?**
- Backend: Change PORT in backend/.env
- Frontend: Change port with `npm run dev -- -p 3001`

**MongoDB connection error?**
- Check if MongoDB is running: `mongosh --eval "db.version()"`
- Update MONGODB_URI in backend/.env

**Dependencies issues?**
- Delete node_modules and reinstall
- Check Node.js version (needs 18+)

## Visual Flow

```
Browser (localhost:3000)
    ↓
Login/Signup
    ↓
KYT Questionnaire
    ↓
Trip Selection (Dates + Location)
    ↓
Experience Browser (Add to Cart)
    ↓
Schedule Review (Optimized by AI)
    ↓
Payment (Wallet System)
    ↓
Trip Confirmed!
```

