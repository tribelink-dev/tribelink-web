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
 */
async function fetchPublicAbodes(): Promise<Array<{ id: string; updatedAt?: string }>> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/abodes?limit=1000&page=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.warn('Failed to fetch abodes for sitemap:', response.status);
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
  } catch (error) {
    // Silently fail - don't expose errors in sitemap
    console.warn('Error fetching abodes for sitemap:', error);
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
  try {
    const abodes = await fetchPublicAbodes();
    
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
  } catch (error) {
    // Silently continue - don't break sitemap generation
    console.warn('Error adding abodes to sitemap:', error);
  }

  return routes;
}

