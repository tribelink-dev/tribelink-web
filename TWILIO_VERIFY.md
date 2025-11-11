# ✅ Twilio Setup Verification

## Environment Variables Required in Render

Make sure you've added these **exact** variable names in Render Dashboard → Environment:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Important:**
- `TWILIO_PHONE_NUMBER` must include country code (e.g., `+1` for US)
- Format: `+[country code][number]` (e.g., `+15551234567`)
- No spaces or dashes in the phone number

---

## 🔍 How to Verify It's Working

### Step 1: Check Render Logs

After redeploying, check Render logs for:

**✅ Success:**
```
[SMS] OTP sent to +1234567890. Message SID: SMxxxxx
```

**❌ Error (if credentials wrong):**
```
[SMS] Error sending OTP: [error message]
```

### Step 2: Test from Frontend

1. Go to your signup page: `https://tribelink-app.vercel.app/signup`
2. Enter a phone number (must be verified in Twilio trial account)
3. Click "Send OTP"
4. Check your phone for SMS

### Step 3: Test with API

```bash
curl -X POST https://tribelink-web.onrender.com/api/auth/otp/generate/phone \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

**Expected Response:**
```json
{
  "message": "OTP sent successfully via SMS"
}
```

---

## 🚨 Common Issues

### Issue: "SMS service not configured"

**Cause:** Environment variables not set or wrong names

**Fix:**
1. Go to Render Dashboard → Your Service → Environment
2. Verify variable names are **exact**:
   - `TWILIO_ACCOUNT_SID` (not `TWILIO_ACCOUNT_ID`)
   - `TWILIO_AUTH_TOKEN` (not `TWILIO_TOKEN`)
   - `TWILIO_PHONE_NUMBER` (not `TWILIO_NUMBER`)
3. **Redeploy** after adding variables

### Issue: "Invalid phone number"

**Cause:** Phone number format incorrect

**Fix:**
- Must start with `+` and country code
- Example: `+15551234567` (not `15551234567` or `5551234567`)
- No spaces, dashes, or parentheses

### Issue: "Trial account can only send to verified numbers"

**Cause:** Using Twilio trial account

**Fix:**
1. Go to [Twilio Console](https://console.twilio.com/)
2. Phone Numbers → Verified Caller IDs
3. Add your phone number
4. Verify via SMS/call
5. Now you can receive OTPs on that number

**OR** upgrade to paid account to send to any number

### Issue: "Message not received"

**Possible Causes:**
1. **Trial account limitation** - Can only send to verified numbers
2. **Wrong phone number format** - Must include country code
3. **Twilio account issue** - Check Twilio Console → Logs → Messaging
4. **Network/carrier issue** - Try different number

**Debug:**
1. Check Render logs for error messages
2. Check Twilio Console → Logs → Messaging for delivery status
3. Verify phone number in Twilio Console

---

## 📋 Checklist

- [ ] `TWILIO_ACCOUNT_SID` added to Render
- [ ] `TWILIO_AUTH_TOKEN` added to Render
- [ ] `TWILIO_PHONE_NUMBER` added to Render (with `+` and country code)
- [ ] Backend redeployed after adding variables
- [ ] Tested OTP generation endpoint
- [ ] Verified phone number in Twilio Console (if trial account)
- [ ] Received SMS on test phone

---

## 🎯 Next Steps

1. **Test SMS sending:**
   - Use signup page or API endpoint
   - Verify SMS is received

2. **For Production:**
   - Upgrade Twilio account (if using trial)
   - Set up email OTP as well (optional)
   - Monitor Twilio usage and costs

3. **Optional - Add Email OTP:**
   - Add SMTP credentials to Render
   - See `OTP_SETUP.md` for email setup

---

## 💡 Pro Tips

1. **Trial Account:**
   - Free credits for testing
   - Can only send to verified numbers
   - Perfect for development/testing

2. **Production:**
   - Upgrade to paid account
   - Can send to any number
   - Monitor usage in Twilio Console

3. **Cost Optimization:**
   - Twilio charges per SMS sent
   - Monitor usage in Twilio Dashboard
   - Set up usage alerts

---

## 📞 Need Help?

1. **Check Render Logs** - Look for `[SMS]` messages
2. **Check Twilio Console** - Logs → Messaging
3. **Verify Environment Variables** - Render Dashboard → Environment
4. **Test with curl** - Use the test command above

---

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Render logs show: `[SMS] OTP sent to +1234567890. Message SID: SMxxxxx`
2. ✅ API returns: `{"message": "OTP sent successfully via SMS"}`
3. ✅ SMS received on phone with 6-digit code
4. ✅ No errors in Render logs or Twilio Console

🎉 **You're all set!** OTPs will now be sent via SMS to users during signup.

