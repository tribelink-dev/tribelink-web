# 🔧 Critical: Upgrade Node.js Required

## ❌ Current Problem

You're using **Node.js v12.22.9**, but:
- **Next.js 14 requires Node.js 18+**
- **MongoDB/Mongoose requires Node.js 18+**

Both your backend and frontend are failing because Node 12 doesn't support:
- Optional chaining (`?.`)
- Nullish coalescing (`??`)

## ✅ Solution: Install Node.js 20

### Option 1: Using nvm (Recommended)

```bash
# Install nvm if not already installed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload your shell configuration
source ~/.bashrc
# OR
source ~/.zshrc

# Install Node.js 20 LTS
nvm install 20

# Use Node.js 20
nvm use 20

# Set as default (optional)
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
npm --version
```

### Option 2: Direct Download

1. Go to: https://nodejs.org/
2. Download **Node.js 20 LTS** (Long Term Support)
3. Install it
4. Restart your terminal

### Option 3: Using Package Manager (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should show v20.x.x
```

## 🚀 After Upgrading

Once you have Node.js 20:

1. **Verify version:**
   ```bash
   node --version  # Must show v18.x.x or higher
   ```

2. **Restart backend:**
   ```bash
   cd /media/adarsh/Extra/theAct/PoC/backend
   npm run dev
   ```

3. **Restart frontend:**
   ```bash
   cd /media/adarsh/Extra/theAct/PoC/frontend
   npm run dev
   ```

## ✅ Verification

After upgrading, both servers should start without syntax errors:

**Backend should show:**
```
MongoDB Connected: localhost:27017
AI Tourism Platform running on port 5000
```

**Frontend should show:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
✓ Ready in X seconds
```

## 🔍 Check Current Node Version

```bash
# Check which Node is active
which node
node --version

# If using nvm, check available versions
nvm list

# Check if multiple Node versions exist
ls -la $(which node)
```

## ⚠️ Important Notes

- **Do NOT use Node.js 12** - It's too old
- **Minimum: Node.js 18** (recommended: 20 LTS)
- **Restart terminal** after installing Node.js
- **Check version** before starting servers

Once upgraded, your application will run successfully! 🎉

