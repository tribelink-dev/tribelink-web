/**
 * Headers for server-side fetches to the Triberoutes API.
 * Matches the browser client fingerprint in lib/api.ts.
 */
export const TRIBEROUTES_CLIENT_HEADER = 'web';

export function getServerFetchHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Triberoutes-Client': TRIBEROUTES_CLIENT_HEADER,
  };
}
