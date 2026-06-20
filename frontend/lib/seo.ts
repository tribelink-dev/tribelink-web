/**
 * SEO Utility Functions
 * Security-focused sanitization, validation, and safe metadata generators
 */

// Allowed domains for images and external resources
const ALLOWED_IMAGE_DOMAINS = [
  'triberoutes.com',
  'www.triberoutes.com',
  'triberoutes-app.vercel.app',
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
          !hostname.includes('triberoutes-app.vercel.app') &&
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

/** Default OG image path (generated by app/opengraph-image.tsx) */
export function getDefaultOgImage(): string {
  return `${getBaseUrl()}/opengraph-image`;
}

/** Kerala-focused FAQ content for AEO and FAQPage schema */
export const KERALA_FAQ_ITEMS = [
  {
    question: 'What is a Kerala homestay?',
    answer:
      'A Kerala homestay is an authentic stay with a verified local family in Kerala, India. On Triberoutes, you live with a Keralite host, share meals, and experience daily life — not a hotel or generic rental.',
  },
  {
    question: 'How is Triberoutes different from other homestay platforms?',
    answer:
      'Triberoutes focuses on cultural immersion in Kerala. Every homestay is a family home verified for authenticity, and cultural experiences are curated and guided by your local host — not self-guided tourist activities.',
  },
  {
    question: 'Can international travelers book Kerala cultural experiences?',
    answer:
      'Yes. Triberoutes welcomes both international and Indian travelers. You can book Kerala homestays and traditional cultural experiences guided by local hosts directly on triberoutes.com.',
  },
  {
    question: "What does 'live like a Keralite' mean?",
    answer:
      'Living like a Keralite means staying with a local family, eating home-cooked Kerala food, learning regional customs, and joining traditional activities — from temple visits and spice gardens to music, crafts, and festivals.',
  },
  {
    question: 'What cultural experiences can I book in Kerala?',
    answer:
      'Triberoutes offers traditional Kerala experiences including cooking classes, Kathakali and music performances, handicraft workshops, backwater village tours, spice plantation visits, and festival celebrations — all guided by local hosts.',
  },
  {
    question: 'Are Triberoutes homestays verified?',
    answer:
      'Yes. Every homestay (abode) on Triberoutes is verified before listing. Hosts are local Kerala families who welcome travelers seeking genuine cultural understanding.',
  },
] as const;

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
    alternateName: ['Triberoutes', 'Tribe Routes'],
    url: `${baseUrl}/explore`,
    logo: getDefaultOgImage(),
    description:
      'Kerala cultural homestays and local-guided traditional experiences. Live with a Keralite family and travel for cultural understanding.',
    foundingLocation: {
      '@type': 'Place',
      name: 'Kerala, India',
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Kerala, India',
    },
    knowsAbout: [
      'Kerala homestays',
      'cultural tourism',
      'traditional Kerala experiences',
      'living with a Keralite family',
      'authentic cultural travel',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'info@triberoutes.com',
      contactType: 'customer support',
      availableLanguage: ['English', 'Malayalam', 'Hindi'],
    },
    sameAs: [
      'https://www.instagram.com/triberoutes',
      'https://www.facebook.com/triberoutes',
      'https://www.linkedin.com/company/triberoutes',
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
    url: `${baseUrl}/explore`,
    description:
      'Book Kerala homestays and cultural experiences guided by local hosts.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/explore?location={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; path: string }>
) {
  const baseUrl = getBaseUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: validateCanonicalUrl(item.path),
    })),
  };
}

/**
 * Generate FAQPage structured data from Kerala FAQ items
 */
export function generateFAQPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: KERALA_FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate ItemList structured data for explore page listings
 */
export function generateItemListSchema(
  items: Array<{ name: string; url: string; description?: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
      description: item.description ? sanitizeMetadata(item.description, 200) : undefined,
    })),
  };
}

/**
 * Generate TouristAttraction schema for experience detail pages
 */
export function generateTouristAttractionSchema(experience: {
  title: string;
  description: string;
  imageUrl?: string | null;
  location?: { district?: string; state?: string; country?: string };
  price?: number;
  currency?: string;
  averageRating?: number;
  reviewCount?: number;
  provider?: { name?: string };
}) {
  const baseUrl = getBaseUrl();
  const location = [
    experience.location?.district,
    experience.location?.state,
    experience.location?.country,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: sanitizeMetadata(experience.title),
    description: sanitizeMetadata(experience.description, 500),
    image: experience.imageUrl ? validateImageUrl(experience.imageUrl) : getDefaultOgImage(),
    touristType: 'Cultural tourism',
    address: experience.location
      ? {
          '@type': 'PostalAddress',
          addressLocality: experience.location.district || '',
          addressRegion: experience.location.state || 'Kerala',
          addressCountry: experience.location.country || 'India',
        }
      : undefined,
    aggregateRating:
      experience.reviewCount && experience.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: experience.averageRating || 0,
            reviewCount: experience.reviewCount,
          }
        : undefined,
    offers: experience.price
      ? {
          '@type': 'Offer',
          price: experience.price,
          priceCurrency: experience.currency || 'INR',
          url: baseUrl,
        }
      : undefined,
    provider: experience.provider?.name
      ? { '@type': 'Person', name: sanitizeMetadata(experience.provider.name) }
      : undefined,
    ...(location ? { containedInPlace: { '@type': 'Place', name: location } } : {}),
  };
}

