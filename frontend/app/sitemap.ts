import { MetadataRoute } from 'next';
import { getBaseUrl, isValidObjectId } from '@/lib/seo';

/**
 * Sitemap generation with security validation
 * Only includes explicitly whitelisted public routes
 */

// Whitelist of public routes to include in sitemap
const PUBLIC_ROUTES = [
  '/',
  '/explore',
  '/adobes',
] as const;

// Blocked routes that should never appear in sitemap
const BLOCKED_ROUTES = [
  '/host',
  '/provider',
  '/dashboard',
  '/auth',
  '/login',
  '/signup',
  '/admin',
] as const;

/**
 * Check if a route should be blocked from sitemap
 */
function isBlockedRoute(path: string): boolean {
  return BLOCKED_ROUTES.some(blocked => path.startsWith(blocked));
}

/**
 * Fetch public abodes for sitemap
 * Only includes published/verified abodes
 * Gracefully handles timeouts and API unavailability during build
 */
async function fetchPublicAbodes(): Promise<Array<{ id: string; updatedAt?: string }>> {
  // Skip API call during build if API URL is not available or points to localhost
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // During build, if API is not configured or is localhost, skip fetching
  if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    // In production builds, this should be set, but gracefully handle if not
    return [];
  }

  try {
    // Use a shorter timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${apiUrl}/abodes?limit=1000&page=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      // Add cache revalidation for build time
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const abodes = data.localHosts || [];
    
    // Validate and filter abodes
    return abodes
      .filter((abode: any) => {
        // Only include if has valid ID
        if (!abode._id || !isValidObjectId(abode._id)) {
          return false;
        }
        // Only include verified/published abodes
        return abode.isVerified !== false;
      })
      .map((abode: any) => ({
        id: abode._id,
        updatedAt: abode.updatedAt || abode.createdAt,
      }));
  } catch (error: any) {
    // Silently fail - don't break build or expose errors
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sitemap: Could not fetch abodes (this is OK during build):', error?.message || 'Timeout or API unavailable');
    }
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString();
  
  // Start with static public routes
  const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'daily' : 'weekly',
    priority: route === '/' ? 1.0 : 0.8,
  }));

  // Add individual abode pages
  // This will gracefully fail if API is unavailable during build
  // The sitemap will still work with just static routes
  try {
    const abodes = await fetchPublicAbodes();
    
    // Only add abodes if we successfully fetched them
    if (abodes && abodes.length > 0) {
      for (const abode of abodes) {
        // Double-check ID is valid before adding
        if (!isValidObjectId(abode.id)) {
          continue;
        }
        
        // Ensure path doesn't contain blocked routes
        const abodePath = `/adobes/${abode.id}`;
        if (isBlockedRoute(abodePath)) {
          continue;
        }
        
        routes.push({
          url: `${baseUrl}${abodePath}`,
          lastModified: abode.updatedAt || now,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }
    }
  } catch (error: any) {
    // Silently continue - sitemap works fine with just static routes
    // This is expected during build if API is unavailable
    if (process.env.NODE_ENV === 'development') {
      console.warn('Sitemap: Skipping dynamic abode pages (API unavailable during build)');
    }
  }

  return routes;
}

