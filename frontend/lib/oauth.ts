/** Backend origin for browser redirects (OAuth must hit the Express server, not Next.js). */
export function getBackendOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  try {
    const normalized = raw.endsWith('/api') ? raw : `${raw.replace(/\/$/, '')}/api`;
    return new URL(normalized).origin;
  } catch {
    return 'http://localhost:5000';
  }
}

export function getGoogleOAuthHref(
  type: 'user' | 'host' = 'user',
  returnUrl?: string
): string {
  const path = type === 'host' ? '/api/auth/google/host' : '/api/auth/google';
  const href = new URL(path, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  if (returnUrl) {
    href.searchParams.set('returnUrl', returnUrl);
  }
  return href.pathname + href.search;
}
