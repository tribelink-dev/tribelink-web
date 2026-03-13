/**
 * Lightweight environment validation for production/staging.
 * Logs clear warnings for missing recommended variables but does NOT crash the app.
 */

const REQUIRED_FOR_AUTH = ['JWT_SECRET', 'SESSION_SECRET'];
const RECOMMENDED_FOR_PROD = [
  'MONGODB_URI',
  'FRONTEND_URL',
  'BACKEND_URL',
  'NEXT_PUBLIC_API_URL',
];

function checkEnv() {
  const missingAuth = REQUIRED_FOR_AUTH.filter((key) => !process.env[key]);
  if (missingAuth.length > 0) {
    // Auth secrets are already enforced elsewhere (middleware/auth, server.js),
    // so we just log here for visibility.
    // eslint-disable-next-line no-console
    console.warn(
      '[envCheck] Missing required auth secrets (also enforced elsewhere):',
      missingAuth.join(', ')
    );
  }

  const missingRecommended = RECOMMENDED_FOR_PROD.filter((key) => !process.env[key]);
  if (missingRecommended.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      '[envCheck] Recommended env vars are missing. For production, set:',
      missingRecommended.join(', ')
    );
  }
}

module.exports = { checkEnv };

