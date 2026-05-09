# Engineering Context

Operational and architectural notes that aren't in the README's feature list.
Read this when onboarding, debugging production issues, or making infrastructure changes.

---

## Deployment Topology

```
                ┌────────────────────┐
   Browser ───▶ │  Vercel (Next.js)  │  triberoutes.com
                │  branch: pivot-v2  │
                └─────────┬──────────┘
                          │ XHR / fetch
            ┌─────────────┼──────────────────┐
            │             │                  │
            ▼             ▼                  ▼
   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
   │ api.triber-  │  │  Cloudinary  │  │   Mapbox /  │
   │ outes.com    │  │  (uploads &  │  │   3rd party │
   │ (Render free)│  │   delivery)  │  │   APIs      │
   └──────┬───────┘  └──────────────┘  └─────────────┘
          │
          ▼
   ┌──────────────┐
   │ MongoDB Atlas│
   └──────────────┘
```

| Tier | Service | Notes |
|------|---------|-------|
| Frontend | Vercel | Production branch is **`pivot-v2`** (not `main`/`dev`). Custom domain `triberoutes.com`. |
| Backend | Render Free | Custom domain `api.triberoutes.com`. **Idles after 15 min of no inbound HTTP** — keep-alive workflow exists for this reason. |
| Database | MongoDB Atlas | Connection string in `MONGODB_URI`. App tolerates DB-down on startup (server still listens, individual routes fail). |
| Image storage / CDN | Cloudinary | **Direct browser → Cloudinary uploads** — see [Image Uploads](#image-uploads). |
| Auth | Google OAuth + JWT | Tokens in `localStorage`. 7-day expiry. |
| Payments | Razorpay (default) / Stripe | Webhooks at `/api/webhooks/{razorpay,stripe}`. |
| Maps | Mapbox + Leaflet | `NEXT_PUBLIC_MAPBOX_TOKEN`. |

---

## Branch Strategy

- **`pivot-v2`** — production. Vercel auto-deploys this on every push.
- **`dev`** — older default branch on the GitHub repo. **Not** what production deploys from. Don't push fixes here unless you also intend them to land on `pivot-v2` later.
- The repo's GitHub default branch is `dev` for legacy reasons. Vercel's "Production Branch" setting (Project → Settings → Git) is what determines what gets deployed; that's set to `pivot-v2`.

When in doubt: **`origin/pivot-v2` is the source of truth for production**.

---

## Render Free-Tier Cold Starts

Render's free plan **suspends the dyno after 15 minutes of zero inbound HTTP**. The first request after that takes 30–60 seconds to wake the container, during which axios's default 30-second timeout would fire and the user would see "Cannot connect to server".

Two layers of mitigation are in place:

### 1. External cron via GitHub Actions

`.github/workflows/keep-alive.yml` runs every 14 minutes and pings `${RENDER_BACKEND_URL}/ping`. This is the **primary** defense — it runs even when the dyno is asleep, so it can wake it back up.

**Required setup**: GitHub repo → Settings → Secrets and variables → Actions → add `RENDER_BACKEND_URL` = `https://api.triberoutes.com`. Without this secret, the workflow runs but does nothing.

Verify it's working: Actions tab → "Keep Render Backend Awake" → manually trigger via "Run workflow", check it returns HTTP 200.

### 2. Self-ping inside the backend

`backend/server.js` starts a `setInterval` on boot in production (`NODE_ENV=production`). It hits its own `/ping` every 14 minutes, which counts as inbound traffic for Render's idle timer. This is a **belt-and-suspenders** layer; it only works while the server is awake (it can't wake itself).

Render auto-injects `RENDER_EXTERNAL_URL` for any deployed service, so no env-var configuration is needed. Override with `KEEP_ALIVE_URL` if you ever change setups.

### Endpoints

- `GET /health` — returns JSON status; intended for human/monitoring tools.
- `GET /ping` — returns plain `pong`; used by both keep-alive paths. Keep this **lightweight** (no DB, no auth) so it succeeds even mid-cold-start.

### Frontend resilience

Even with keep-alive, the *first* request after a long-idle period may still hit a cold start. Several safeguards on the frontend side:

- **Default axios timeout bumped to 60s** (`frontend/lib/api.ts`). FormData requests get 15 minutes.
- **`prewarmBackend()`** is called at the start of any flow that's about to do heavy I/O (e.g., abode register/edit). It hits `/ping` first; failure is ignored.
- **`withRetry()`** in `frontend/lib/uploadPhotoWithRetry.ts` wraps the final register/update POSTs with 3 attempts × 90s timeout × backoff. Avoids losing the user's work to a single transient blip.

---

## Image Uploads

Image-heavy flows (currently abode register/edit) use **direct browser → Cloudinary** uploads, bypassing our backend entirely. This is the standard pattern used by Airbnb / Discord / Notion, and it solved a class of free-tier-Render bottlenecks for us.

### Why not via the backend?

The backend route `/api/abodes/upload-photo` exists and works (it streams the file through multer-storage-cloudinary), but on Render's 0.1 vCPU / 512MB free dyno, a single 2MB phone photo can take 30–90s and often times out. Direct upload skips that hop.

### How direct upload works

1. Frontend POSTs `file` + `upload_preset` to `https://api.cloudinary.com/v1_1/{cloud_name}/auto/upload` via `XMLHttpRequest` (fetch doesn't expose upload progress).
2. Cloudinary returns `{ secure_url, public_id, ... }`.
3. Frontend sends `{ url, caption }[]` to the backend's JSON `POST /api/abodes/register` (small payload, fast).
4. Backend's `isTrustedAbodeImageUrl` (`backend/routes/adobes.js`) accepts any `*.cloudinary.com` URL, so no server change was needed to enable direct uploads.

### Activation

Set in Vercel (Production + Preview):

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloud-name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<unsigned-preset-name>
```

Create the preset in Cloudinary dashboard → Settings → Upload → Upload presets:
- **Signing Mode**: Unsigned (critical — signed presets need a server-side signature)
- **Folder**: `triberoutes/abodes` (optional)
- Optional: enable Quality `auto`, Format `auto` for WebP/AVIF delivery

If either env var is missing, the code **automatically falls back** to the legacy backend-proxied upload. Nothing breaks; it just becomes slow.

### CSP requirement

The CSP `connect-src` in `frontend/next.config.js` must include `https://api.cloudinary.com` or browsers will block the upload. The browser-level rejection surfaces as a generic XHR `onerror` ("Network error during Cloudinary upload"), which is hard to debug if you don't know to check Console for CSP violations.

### Compression before upload

`frontend/lib/compressImageForUpload.ts` resizes images to **max 1600px edge / JPEG quality 0.78** in the browser before upload. Cuts a typical 5MB phone photo down to ~250KB. Skipped automatically for files already under 250KB and for non-JPEG/PNG types.

---

## Authentication & CORS

### Allowed origins

Backend `server.js` accepts requests from:
- `localhost`/`127.0.0.1` (dev)
- `https://triberoutes.com`, `https://www.triberoutes.com` (production)
- `https://triberoutes-app.vercel.app` (Vercel default)
- Any `*.vercel.app` (preview deployments)
- Any `*.onrender.com` (Render preview)
- Plus a few other PaaS wildcards

In dev (`NODE_ENV !== 'production'`) it allows everything. In prod it logs blocked origins to stdout — first place to look if you see CORS errors.

### Required env vars at boot

`backend/server.js` **throws on startup** if these are missing:
- `SESSION_SECRET`
- `JWT_SECRET` (checked in `services/oauthService.js`)

`backend/config/envCheck.js` warns (doesn't crash) if the following aren't set in production: `FRONTEND_URL`, `BACKEND_URL`, `NEXT_PUBLIC_API_URL`. These should be set on Render.

### Frontend → Backend URL

- `NEXT_PUBLIC_API_URL` is read at **build time** by Next.js. Changing it requires a redeploy with cache cleared (Vercel: "Redeploy" → uncheck "Use existing build cache").
- If `NEXT_PUBLIC_API_URL` is missing, code falls back to `http://localhost:5000/api` and emits a console warning. In production this would manifest as every API call appearing to fail with "Cannot connect to server" — check the warning first before assuming the backend is down.

---

## CSP

The Content Security Policy in `frontend/next.config.js#headers()` is restrictive. Notable allowances:

| Directive | Allowed |
|-----------|---------|
| `connect-src` | `'self'`, `api.triberoutes.com`, `localhost:5000`, `api.cloudinary.com`, `res.cloudinary.com` |
| `img-src` | `'self'`, `data:`, `res.cloudinary.com`, `triberoutes.com`, `triberoutes-app.vercel.app` |
| `script-src` | `'self'`, `'unsafe-inline'`, `'unsafe-eval'` (Next.js requires both) |
| `style-src` | `'self'`, `'unsafe-inline'`, `fonts.googleapis.com` |
| `font-src` | `'self'`, `data:`, `fonts.gstatic.com` |
| `media-src` | `'self'`, `cdn.coverr.co` |

**When integrating a new external service that the browser talks to**, you almost certainly need to add its origin to `connect-src` (for fetch/XHR/WebSocket). CSP violations are silent in the network log — they appear only in the browser Console as "Refused to connect to '...' because it violates the following Content Security Policy directive".

---

## Recent Production Fixes (May 2026)

Reverse-chronological. Useful as a lookup table when something regresses.

| Commit | What | Why |
|--------|------|-----|
| `2b53f6a` | CSP `connect-src` allows `api.cloudinary.com` | Direct Cloudinary uploads were silently CSP-blocked |
| `9fcd6b9` | Direct browser → Cloudinary uploads, parallel × 3, real % progress, tighter compression (1600 / q=0.78) | Render dyno was bottlenecking uploads; users saw a static "Uploading…" status that looked hung |
| `83371b4` | `uploadPhotoWithRetry.ts` committed (had been working-tree-only); register/update wrapped in `withRetry` × 90s timeout; default axios timeout 60s; better error messages | Final register POST failing after image uploads succeeded; misleading "Cannot connect" message |
| `f6b01ad` | Production-readiness bundle: hardened auth/env, currency API key, budget optimizer wiring, env templates | Catch-all production hardening |
| (earlier) | `.github/workflows/keep-alive.yml`, `/ping` endpoint, `startKeepAlive()` self-ping | Render free-tier cold starts |

---

## Common Operational Gotchas

### "Cannot connect to server at https://api.triberoutes.com/api"

This exact wording is from the **old** `frontend/lib/api.ts`. If you see it, the deployed Vercel build is stale. Trigger a redeploy.

The current message reads: *"Network error talking to the server. The backend may be waking up after being idle (free hosting tier). Please wait a few seconds and try again."*

### "Network error during Cloudinary upload"

Almost always one of:
1. CSP doesn't allow `api.cloudinary.com` — check `frontend/next.config.js`.
2. Cloudinary preset is in **Signed** mode (needs Unsigned).
3. Wrong preset name in `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. Cloud name typo in `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.

Confirm by opening DevTools → Network → look for the POST to `api.cloudinary.com`. Status code tells you which.

### "Route not found" on a fresh API endpoint

Render hasn't redeployed yet. Push to `pivot-v2` and Render auto-deploys; takes ~2 minutes. The 404 comes from the catch-all in `backend/server.js`.

### Server boots locally but errors with "JWT_SECRET environment variable is required"

`services/oauthService.js` enforces it. Set `JWT_SECRET` in `backend/.env` (any string; production uses a strong random one). `SESSION_SECRET` similarly.

### "Cannot find module 'stripe'" / 'razorpay' on `node server.js` locally

Local `node_modules` is stale. Run `npm install` from the repo root. Production is unaffected because Render runs `npm install` on every deploy.

### MongoDB Atlas connection refused

The connection string in `MONGODB_URI` is right but Atlas IP allowlist doesn't include the request source. For Render: set Atlas to allow `0.0.0.0/0` (since Render's egress IPs aren't static on free tier) or use Atlas's Network Peering on a paid plan.

### Vercel deploy ignores my push

Check the Production Branch in Project → Settings → Git. Should be `pivot-v2`. If it's `dev` (the GitHub repo default), only `dev` pushes go to production.

---

## Files & Modules Worth Knowing

| File | Why it matters |
|------|----------------|
| `frontend/lib/api.ts` | Global axios instance + response interceptor that wraps network errors. The error wrapper sets `error.isNetworkError = true` — retry helpers honor this flag. |
| `frontend/lib/uploadPhotoWithRetry.ts` | Picks between direct-Cloudinary and backend upload modes. Exposes generic `withRetry<T>(fn, opts)` used by other flows for cold-start resilience. |
| `frontend/lib/cloudinaryDirectUpload.ts` | XHR-based upload to Cloudinary's unsigned-preset endpoint with progress events. |
| `frontend/lib/compressImageForUpload.ts` | Browser-side resize/JPEG re-encode. Defaults: 1600px edge, q=0.78. |
| `backend/server.js` | App entrypoint. Sets up CORS, sessions, routes, keep-alive self-ping. Throws on missing `SESSION_SECRET`. |
| `backend/routes/adobes.js` | All abode (LocalHost) endpoints. `isTrustedAbodeImageUrl()` is what gates which image URLs the JSON register/update will accept. |
| `backend/config/database.js` | Connect-with-retry + comprehensive Mongo troubleshooting output. App continues to listen even if DB is down (intentional). |
| `backend/middleware/uploadCloudinary.js` | Multer + multer-storage-cloudinary fallback for the legacy backend-proxied upload path. Falls back to local disk when `CLOUDINARY_*` env vars aren't set. |
| `frontend/next.config.js` | Image remote patterns, security headers, **CSP** — the big one when integrating new third-party origins. |
| `.github/workflows/keep-alive.yml` | External cron to keep Render dyno warm. Inert until `RENDER_BACKEND_URL` repo secret is set. |

---

## Adding a New External Origin (checklist)

When integrating a third-party service the browser talks to (analytics, payment SDK, CDN, etc.), you typically need:

1. **CSP `connect-src`** in `frontend/next.config.js` — add the origin.
2. **CSP `script-src`** if loading their JS bundle.
3. **CSP `img-src`** if loading their images directly.
4. **CSP `frame-src`** if embedding their iframes (e.g., 3DS, captcha).
5. **CORS allowlist** in `backend/server.js` — only if the service calls *back* to your API (most don't).
6. **Vercel env var** — usually `NEXT_PUBLIC_*` so it's exposed to the client.
7. **Document it** in `context.md` under [CSP](#csp) and update `frontend/.env.example`.

Forgetting (1) is the #1 source of "it works in dev, fails in prod" bugs in this codebase.
