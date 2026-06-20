import { MetadataRoute } from 'next';
import { getBaseUrl, isValidObjectId } from '@/lib/seo';
import { fetchAllPublicExperiencesForSitemap, SERVER_FETCH_TIMEOUT_MS } from '@/lib/fetchListings';

/**
 * Sitemap generation with security validation
 * Only includes explicitly whitelisted public routes
 */

const PUBLIC_ROUTES = [
  { path: '/explore', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/kerala', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/kerala/homestays', priority: 0.85, changeFrequency: 'weekly' as const },
  { path: '/kerala/experiences', priority: 0.85, changeFrequency: 'weekly' as const },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/stories', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' as const },
  { path: '/adobes', priority: 0.8, changeFrequency: 'weekly' as const },
] as const;

const BLOCKED_ROUTES = [
  '/host',
  '/provider',
  '/dashboard',
  '/auth',
  '/login',
  '/signup',
  '/admin',
  '/trips',
  '/cart',
  '/bookings',
  '/kyt',
] as const;

function isBlockedRoute(path: string): boolean {
  return BLOCKED_ROUTES.some((blocked) => path.startsWith(blocked));
}

async function fetchPublicAbodes(): Promise<Array<{ id: string; updatedAt?: string }>> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVER_FETCH_TIMEOUT_MS);

    const response = await fetch(`${apiUrl}/abodes?limit=1000&page=1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      next: { revalidate: 3600 },
    });

    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    const abodes = data.localHosts || [];

    return abodes
      .filter((abode: { _id?: string; isArchived?: boolean }) => {
        if (!abode._id || !isValidObjectId(abode._id)) return false;
        return !abode.isArchived;
      })
      .map((abode: { _id: string; updatedAt?: string; createdAt?: string }) => ({
        id: abode._id,
        updatedAt: abode.updatedAt || abode.createdAt,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString();

  const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [abodes, experiences] = await Promise.all([
      fetchPublicAbodes(),
      fetchAllPublicExperiencesForSitemap(),
    ]);

    for (const abode of abodes) {
      if (!isValidObjectId(abode.id)) continue;
      const abodePath = `/adobes/${abode.id}`;
      if (isBlockedRoute(abodePath)) continue;
      routes.push({
        url: `${baseUrl}${abodePath}`,
        lastModified: abode.updatedAt || now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    for (const experience of experiences) {
      if (!isValidObjectId(experience.id)) continue;
      const experiencePath = `/experiences/${experience.id}`;
      if (isBlockedRoute(experiencePath)) continue;
      routes.push({
        url: `${baseUrl}${experiencePath}`,
        lastModified: experience.updatedAt || now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
  } catch {
    // Sitemap works with static routes only
  }

  return routes;
}
