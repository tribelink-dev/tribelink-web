# ⚡ OTP Quick Start

## 🎯 What's Implemented

✅ **OTP Service** - Sends OTPs via SMS (Twilio) and Email (SMTP)  
✅ **Automatic Fallback** - Logs to console if services not configured  
✅ **Development Mode** - Returns OTP in API response for testing  
✅ **Production Mode** - Hides OTP from API response  

---

## 🚀 Quick Setup (Choose One)

### Option 1: Development (No Setup - Console Logging)

**Nothing to do!** OTPs will appear in server console/logs:

```bash
📱 [DEV] SMS OTP for +1234567890: 123456
📧 [DEV] Email OTP for user@example.com: 123456
```

### Option 2: SMS via Twilio

1. **Get Twilio credentials** from [Twilio Console](https://console.twilio.com/)
2. **Add to `.env` or Render:**
   ```env
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Option 3: Email via Gmail

1. **Create Gmail App Password** ([Guide](https://support.google.com/accounts/answer/185833))
2. **Add to `.env` or Render:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

---

## 📝 How It Works

### Frontend Flow

1. User enters phone number → Frontend calls `/api/auth/otp/generate/phone`
2. User enters email → Frontend calls `/api/auth/otp/generate/email`
3. User enters OTP → Frontend calls `/api/auth/otp/verify`
4. OTP verified → User can proceed with signup

### Backend Flow

1. **Generate OTP:**
   - Creates 6-digit code
   - Saves to database (expires in 10 minutes)
   - Sends via SMS/Email (if configured)
   - Returns OTP in dev mode only

2. **Verify OTP:**
   - Checks if OTP exists and not expired
   - Validates code
   - Marks as verified

---

## 🧪 Test It

### Test SMS OTP

```bash
curl -X POST http://localhost:5000/api/auth/otp/generate/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Test Email OTP

```bash
curl -X POST http://localhost:5000/api/auth/otp/generate/email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "+1234567890"}'
```

---

## 📚 Full Documentation

See `OTP_SETUP.md` for:
- Detailed setup instructions
- Multiple email provider options
- Troubleshooting guide
- Security best practices

---

## ✅ Status

- ✅ Packages installed (`twilio`, `nodemailer`)
- ✅ OTP service created
- ✅ Auth routes updated
- ✅ Documentation created

**Next Step:** Configure environment variables (optional - works without them!)

