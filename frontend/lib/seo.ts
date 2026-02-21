/**
 * SEO Utility Functions
 * Security-focused sanitization, validation, and safe metadata generators
 */

// Allowed domains for images and external resources
const ALLOWED_IMAGE_DOMAINS = [
  'triberoutes.com',
  'www.triberoutes.com',
  'tribelink-app.vercel.app',
  'res.cloudinary.com', // Cloudinary CDN
  'localhost', // For development
];

// Base URL configuration
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: use environment variable or default
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.NEXT_PUBLIC_FRONTEND_URL || 
         'https://triberoutes.com';
}

/**
 * Sanitize metadata text content
 * Removes HTML tags, escapes special characters, and truncates to safe length
 */
export function sanitizeMetadata(text: string | undefined | null, maxLength: number = 160): string {
  if (!text) return '';
  
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');
  
  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength - 3) + '...';
  }
  
  return sanitized.trim();
}

/**
 * Validate and sanitize image URL
 * Prevents SSRF attacks by validating against whitelist
 */
export function validateImageUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  
  try {
    // If it's already a full URL, validate domain
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check if domain is in whitelist
      const isAllowed = ALLOWED_IMAGE_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        console.warn(`Image URL from disallowed domain: ${hostname}`);
        return null;
      }
      
      return url;
    }
    
    // If it's a relative path, make it absolute
    if (url.startsWith('/')) {
      return `${getBaseUrl()}${url}`;
    }
    
    // Invalid format
    return null;
  } catch (error) {
    console.warn('Invalid image URL:', url);
    return null;
  }
}

/**
 * Validate canonical URL
 * Ensures canonical URLs are from your domain only
 */
export function validateCanonicalUrl(path: string): string {
  try {
    // If it's already a full URL, validate it's from our domain
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const urlObj = new URL(path);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Only allow our domains
      if (!hostname.includes('triberoutes.com') && 
          !hostname.includes('tribelink-app.vercel.app') &&
          hostname !== 'localhost') {
        // Return base URL if external domain detected
        return getBaseUrl();
      }
      
      // Normalize: remove query params and fragments unless needed
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    }
    
    // If it's a path, make it absolute with HTTPS
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // Prevent directory traversal
    if (cleanPath.includes('..') || cleanPath.includes('//')) {
      return getBaseUrl();
    }
    
    return `${getBaseUrl()}${cleanPath}`;
  } catch (error) {
    // On error, return base URL
    return getBaseUrl();
  }
}

/**
 * Escape JSON-LD content
 * Safely escapes special characters for JSON-LD structured data
 */
export function escapeJsonLd(text: string | number | boolean | null | undefined): string {
  if (text === null || text === undefined) return '';
  if (typeof text === 'number' || typeof text === 'boolean') return String(text);
  
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Validate MongoDB ObjectId format
 * Prevents NoSQL injection by validating ID format
 */
export function isValidObjectId(id: string | undefined | null): boolean {
  if (!id || typeof id !== 'string') return false;
  
  // MongoDB ObjectId is 24 hex characters
  return /^[a-f\d]{24}$/i.test(id);
}

/**
 * Sanitize slug or path parameter
 * Validates and sanitizes URL slugs
 */
export function sanitizeSlug(slug: string | undefined | null): string | null {
  if (!slug || typeof slug !== 'string') return null;
  
  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) return null;
  
  // Limit length
  if (slug.length > 100) return null;
  
  return slug;
}

/**
 * Generate safe metadata title
 * Combines title parts safely
 */
export function generateMetadataTitle(
  title: string,
  suffix: string = 'Triberoutes'
): string {
  const sanitizedTitle = sanitizeMetadata(title, 60);
  return `${sanitizedTitle} | ${suffix}`;
}

/**
 * Generate safe metadata description
 * Creates SEO-friendly description from content
 */
export function generateMetadataDescription(
  description: string | undefined | null,
  fallback: string = 'Discover authentic local experiences and cultural stays'
): string {
  if (!description) return fallback;
  
  const sanitized = sanitizeMetadata(description, 160);
  return sanitized || fallback;
}

/**
 * Generate Organization structured data
 * Safe JSON-LD for organization schema
 */
export function generateOrganizationSchema() {
  const baseUrl = getBaseUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Triberoutes',
    alternateName: 'Tribelink',
    url: baseUrl,
    logo: `${baseUrl}/assets/logo.jpg`,
    description: 'Authentic local experiences and cultural stays for travelers',
    sameAs: [
      // Add social media links if available
    ],
  };
}

/**
 * Generate Website structured data
 * Safe JSON-LD for website schema
 */
export function generateWebsiteSchema() {
  const baseUrl = getBaseUrl();
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Triberoutes',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/explore?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

