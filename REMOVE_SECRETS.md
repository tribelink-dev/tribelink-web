# 🔒 Remove Secrets from Git History

## ⚠️ Important Security Notice

If you've accidentally committed secrets (API keys, passwords, tokens) to git, they remain in the git history even after deleting the files. This guide will help you remove them completely.

---

## 🎯 Step 1: Remove Files from Git Tracking

### Files Already Removed:
- ✅ `backend/.env.backup` - Removed from tracking
- ✅ `.gitignore` - Updated to ignore all `.env*` files

### Verify No Secrets Are Tracked:

```bash
# Check for any .env files still tracked
git ls-files | grep -E "\.env|secret|password|token" -i

# Should return empty (or only documentation files)
```

---

## 🧹 Step 2: Clean Git History (Remove Secrets)

### Option A: Using git-filter-repo (Recommended)

```bash
# Install git-filter-repo (if not installed)
pip install git-filter-repo

# Remove .env.backup from entire history
git filter-repo --path backend/.env.backup --invert-paths

# Remove any other secret files
git filter-repo --path-glob '*.env*' --invert-paths
```

### Option B: Using BFG Repo-Cleaner (Alternative)

```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env.backup from history
java -jar bfg.jar --delete-files .env.backup

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Option C: Manual git-filter-branch (If above tools unavailable)

```bash
# Remove .env.backup from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env.backup" \
  --prune-empty --tag-name-filter cat -- --all

# Clean up
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## 🔄 Step 3: Force Push to Remote

**⚠️ WARNING: This rewrites history. Coordinate with your team!**

```bash
# Force push to update remote (destructive operation)
git push origin --force --all
git push origin --force --tags
```

**If working with a team:**
1. **Coordinate** - Everyone needs to re-clone or reset their local repos
2. **Backup** - Make sure you have a backup before force pushing
3. **Communicate** - Let team know about the history rewrite

---

## ✅ Step 4: Verify Secrets Are Removed

### Check Git History:

```bash
# Search for secrets in git history
git log --all --full-history -p | grep -iE "(password|secret|api_key|token)" | head -20

# Should only show documentation examples, not actual secrets
```

### Check Current Files:

```bash
# Verify .env files are ignored
git status

# Should not show any .env files
```

---

## 🛡️ Step 5: Rotate All Exposed Secrets

**CRITICAL:** Even after removing from git, if secrets were exposed:

1. **Rotate all API keys:**
   - Twilio credentials
   - MongoDB connection strings
   - JWT secrets
   - OpenAI API keys
   - SMTP credentials
   - Google OAuth credentials

2. **Update environment variables:**
   - Render.com (backend)
   - Vercel (frontend)
   - Local `.env` files

3. **Check service logs:**
   - Review access logs for unauthorized usage
   - Monitor for suspicious activity

---

## 📋 Checklist

- [ ] Removed `.env.backup` from git tracking
- [ ] Updated `.gitignore` to ignore all `.env*` files
- [ ] Cleaned git history (removed secrets from all commits)
- [ ] Force pushed to remote (if needed)
- [ ] Verified no secrets in git history
- [ ] Rotated all exposed API keys/tokens
- [ ] Updated environment variables in deployment platforms
- [ ] Notified team (if working with others)

---

## 🔐 Best Practices Going Forward

1. **Never commit secrets:**
   - Use `.env` files (already in `.gitignore`)
   - Use environment variables in deployment platforms
   - Use secret management services (AWS Secrets Manager, etc.)

2. **Use git-secrets or similar:**
   ```bash
   # Install git-secrets
   git secrets --install
   git secrets --register-aws
   ```

3. **Pre-commit hooks:**
   - Add hooks to scan for secrets before commits
   - Use tools like `truffleHog` or `git-secrets`

4. **Regular audits:**
   - Periodically scan repository for secrets
   - Use GitHub's secret scanning (if using GitHub)

---

## 🚨 If Secrets Were Publicly Exposed

If your repository is public or was public:

1. **Immediately rotate all secrets**
2. **Check service logs** for unauthorized access
3. **Consider making repository private** (if it was public)
4. **Review GitHub security advisories** for your account
5. **Monitor for suspicious activity** on all services

---

## 📚 Additional Resources

- [GitHub: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)

---

## ⚠️ Important Notes

- **History rewrite is destructive** - Make backups
- **Coordinate with team** - Everyone needs to re-clone
- **Rotate secrets** - Even if removed from git, they may have been exposed
- **Monitor services** - Check for unauthorized access

