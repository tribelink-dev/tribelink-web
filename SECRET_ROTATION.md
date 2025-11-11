# 🔐 CRITICAL: Rotate Exposed Secrets

## ⚠️ Secrets Found in Git History

The following secrets were found in `backend/.env.backup` that was committed to git:

### Exposed Secrets:

1. **MongoDB Connection String:**
   ```
   mongodb+srv://dbuser:dbuser123@cluster0.abantak.mongodb.net/...
   ```
   - Username: `dbuser`
   - Password: `dbuser123`

2. **Google OAuth Credentials:**
   - Client ID: `885060193181-486rp61qpa9rak72vrvknee17lpi2sn2.apps.googleusercontent.com`
   - Client Secret: `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`

3. **JWT Secret:**
   - `dev-secret-key-change-in-production`

4. **Session Secret:**
   - `linkthetribe`

---

## 🚨 IMMEDIATE ACTIONS REQUIRED

### 1. Rotate MongoDB Credentials

**MongoDB Atlas:**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Navigate to **Database Access**
3. Find user `dbuser`
4. Click **Edit** → **Edit Password**
5. Generate new password
6. **Update in Render.com environment variables:**
   ```env
   MONGODB_URI=mongodb+srv://dbuser:NEW_PASSWORD@cluster0.abantak.mongodb.net/aitourism?retryWrites=true&w=majority
   ```

### 2. Rotate Google OAuth Credentials

**Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find OAuth 2.0 Client ID: `885060193181-486rp61qpa9rak72vrvknee17lpi2sn2`
4. Click **Delete** or **Reset Secret**
5. Create new OAuth credentials
6. **Update in Render.com environment variables:**
   ```env
   GOOGLE_CLIENT_ID=new-client-id
   GOOGLE_CLIENT_SECRET=new-client-secret
   ```

### 3. Update JWT Secret

**Generate new JWT secret:**
```bash
# Generate a secure random string
openssl rand -base64 32
```

**Update in Render.com:**
```env
JWT_SECRET=your-new-generated-secret-here
```

### 4. Update Session Secret

**Generate new session secret:**
```bash
openssl rand -base64 32
```

**Update in Render.com:**
```env
SESSION_SECRET=your-new-generated-secret-here
```

---

## 📋 Complete Rotation Checklist

### MongoDB Atlas
- [ ] Changed password for `dbuser`
- [ ] Updated `MONGODB_URI` in Render.com
- [ ] Tested database connection

### Google OAuth
- [ ] Deleted/reset old OAuth credentials
- [ ] Created new OAuth 2.0 credentials
- [ ] Updated `GOOGLE_CLIENT_ID` in Render.com
- [ ] Updated `GOOGLE_CLIENT_SECRET` in Render.com
- [ ] Updated OAuth redirect URIs if needed
- [ ] Tested Google sign-in

### JWT & Session Secrets
- [ ] Generated new JWT secret
- [ ] Updated `JWT_SECRET` in Render.com
- [ ] Generated new session secret
- [ ] Updated `SESSION_SECRET` in Render.com
- [ ] Redeployed backend

### Verification
- [ ] All users logged out (old tokens invalid)
- [ ] Tested login flow
- [ ] Tested Google OAuth
- [ ] Verified database connection
- [ ] Checked Render logs for errors

---

## 🔍 Monitor for Unauthorized Access

### MongoDB Atlas
1. Go to **Monitoring** → **Real-Time Performance**
2. Check for unusual activity
3. Review **Database Access** logs

### Google Cloud Console
1. Go to **APIs & Services** → **Dashboard**
2. Check OAuth usage
3. Review API access logs

### Render.com
1. Check **Logs** for suspicious activity
2. Monitor resource usage
3. Review deployment history

---

## 🛡️ Security Best Practices

### Going Forward:

1. **Never commit secrets:**
   - ✅ `.env` files are now in `.gitignore`
   - ✅ Use environment variables only
   - ✅ Never commit `.env.backup` files

2. **Use secret management:**
   - Consider AWS Secrets Manager
   - Or HashiCorp Vault
   - Or platform-native secret management (Render, Vercel)

3. **Regular audits:**
   - Scan repository for secrets
   - Rotate secrets periodically
   - Review access logs

4. **Pre-commit hooks:**
   - Install `git-secrets` or similar
   - Prevent accidental commits

---

## ⚠️ Important Notes

- **All existing user sessions will be invalidated** after JWT secret rotation
- **Users will need to log in again** after secrets are rotated
- **Google OAuth will break** until new credentials are configured
- **Database connection will fail** until MongoDB password is updated

**Coordinate rotation** to minimize downtime!

---

## 📞 Need Help?

If you need assistance:
1. Check `REMOVE_SECRETS.md` for git history cleanup
2. Review service-specific documentation
3. Test each service after rotation
4. Monitor logs for errors

---

## ✅ After Rotation

Once all secrets are rotated:

1. **Force push cleaned history** (see `REMOVE_SECRETS.md`)
2. **Verify no secrets in git history**
3. **Test all functionality**
4. **Monitor for 24-48 hours** for any issues
5. **Document the incident** (if required by policy)

