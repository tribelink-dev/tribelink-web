# 📱 OTP Setup Guide

This guide explains how to configure OTP (One-Time Password) sending for SMS and Email in the Tribelink platform.

## 🎯 Overview

The OTP system supports:
- **SMS OTP** via Twilio
- **Email OTP** via SMTP (Gmail, SendGrid, etc.)

Both services are **optional**. If not configured, OTPs will be logged to console (development) or server logs (production).

---

## 📱 SMS OTP Setup (Twilio)

### Step 1: Create Twilio Account

1. Go to [Twilio](https://www.twilio.com/)
2. Sign up for a free account (includes trial credits)
3. Verify your phone number

### Step 2: Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get a **Phone Number**:
   - Go to Phone Numbers → Manage → Buy a number
   - Or use the trial number provided (limited to verified numbers)

### Step 3: Set Environment Variables

Add to your `.env` file (or Render environment variables):

```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Example:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15551234567
```

### Step 4: Install Twilio Package

```bash
cd backend
npm install twilio
```

---

## 📧 Email OTP Setup (SMTP)

### Option 1: Gmail (Easiest for Testing)

#### Step 1: Enable App Password

1. Go to [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification (enable if not already)
3. Security → App passwords
4. Generate a new app password for "Mail"
5. Copy the 16-character password

#### Step 2: Set Environment Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myapp@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### Option 2: SendGrid (Recommended for Production)

#### Step 1: Create SendGrid Account

1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for free account (100 emails/day free)
3. Verify your email

#### Step 2: Create API Key

1. Go to Settings → API Keys
2. Create API Key with "Mail Send" permissions
3. Copy the API key

#### Step 3: Set Environment Variables

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key_here
```

**Example:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Option 3: Other SMTP Providers

Any SMTP provider works. Common ones:

**Outlook/Hotmail:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

**Yahoo:**
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
```

**Custom SMTP:**
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

### Step 4: Install Nodemailer Package

```bash
cd backend
npm install nodemailer
```

---

## 🚀 Quick Start (Development)

### Without Services (Console Logging)

**No setup needed!** OTPs will be logged to console:

```bash
📱 [DEV] SMS OTP for +1234567890: 123456
📧 [DEV] Email OTP for user@example.com: 123456
```

### With Services

1. **Install packages:**
   ```bash
   cd backend
   npm install twilio nodemailer
   ```

2. **Set environment variables** (see above)

3. **Restart server:**
   ```bash
   npm run dev
   ```

---

## 🔧 Environment Variables Summary

### Required for SMS
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Required for Email
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

### Optional
```env
NODE_ENV=production  # Set to production to hide OTPs from API responses
```

---

## 📋 Testing OTP

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

### Expected Response

**Development (OTP in response):**
```json
{
  "message": "OTP sent successfully via SMS",
  "otp": "123456"
}
```

**Production (OTP NOT in response):**
```json
{
  "message": "OTP sent successfully via SMS"
}
```

---

## 🚨 Troubleshooting

### SMS Not Sending

1. **Check Twilio credentials:**
   - Verify Account SID and Auth Token
   - Check phone number format: `+1234567890` (with country code)

2. **Check Twilio Console:**
   - Go to Twilio Console → Logs → Messaging
   - Look for error messages

3. **Trial Account Limitations:**
   - Can only send to verified phone numbers
   - Upgrade to full account for production

### Email Not Sending

1. **Check SMTP credentials:**
   - Verify host, port, username, password
   - For Gmail: Use App Password (not regular password)

2. **Check server logs:**
   - Look for SMTP connection errors
   - Check firewall/network restrictions

3. **Test SMTP connection:**
   ```bash
   # Test with telnet
   telnet smtp.gmail.com 587
   ```

### OTP Not Appearing

1. **Development mode:**
   - OTP is returned in API response
   - Check console logs

2. **Production mode:**
   - OTP is NOT returned in API response
   - Check server logs or email/SMS inbox

---

## 🔒 Security Best Practices

1. **Never commit credentials:**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **Use App Passwords:**
   - For Gmail, use App Passwords (not regular password)
   - For other services, use API keys when possible

3. **Rate Limiting:**
   - Consider adding rate limiting to OTP endpoints
   - Prevent abuse/spam

4. **OTP Expiration:**
   - OTPs expire after 10 minutes (configurable)
   - Expired OTPs are auto-deleted from database

---

## 📚 Additional Resources

- [Twilio Documentation](https://www.twilio.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

## ✅ Checklist

- [ ] Twilio account created (for SMS)
- [ ] Twilio credentials added to environment
- [ ] SMTP credentials added to environment (for Email)
- [ ] `twilio` package installed
- [ ] `nodemailer` package installed
- [ ] Server restarted
- [ ] Tested SMS OTP sending
- [ ] Tested Email OTP sending
- [ ] Verified OTPs are received

---

## 🎉 You're Done!

Once configured, OTPs will be automatically sent when users:
- Sign up (phone and email verification)
- Request password reset (if implemented)
- Any other OTP-required actions

The system gracefully falls back to console logging if services are not configured, making it easy to develop and test without setting up services immediately.

