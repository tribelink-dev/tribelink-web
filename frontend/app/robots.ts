import { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo';

/**
 * Robots.txt configuration
 * Public indexable routes + explicit AI crawler allowances for AEO
 * See also: /llms.txt for LLM discovery
 */

const PUBLIC_ALLOW = [
  '/explore',
  '/adobes',
  '/adobes/*',
  '/experiences/*',
  '/kerala',
  '/kerala/*',
  '/about',
  '/stories',
  '/contact',
  '/blog',
  '/llms.txt',
];

const PRIVATE_DISALLOW = [
  '/host/*',
  '/provider/*',
  '/dashboard/*',
  '/auth/*',
  '/login',
  '/signup',
  '/admin/*',
  '/api/*',
  '/trips/*',
  '/cart',
  '/bookings/*',
  '/kyt',
  '/_next/*',
  '/static/*',
];

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'PerplexityBot',
  'ClaudeBot',
  'Google-Extended',
  'anthropic-ai',
  'Bytespider',
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: PUBLIC_ALLOW,
        disallow: PRIVATE_DISALLOW,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl.replace(/^https?:\/\//, ''),
  };
}
