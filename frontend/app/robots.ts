import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

/**
 * Robots.txt configuration
 * Security-focused: Only lists intentionally public paths
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/adobes',
          '/adobes/*', // Individual abode pages
        ],
        disallow: [
          '/host/*',      // Host dashboard and management
          '/provider/*',  // Provider dashboard
          '/dashboard/*', // User dashboard
          '/auth/*',      // Authentication routes
          '/login',       // Login pages
          '/signup',      // Signup pages
          '/admin/*',     // Admin routes (if any)
          '/api/*',       // API endpoints
          '/_next/*',     // Next.js internal
          '/static/*',    // Static files (if needed)
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

