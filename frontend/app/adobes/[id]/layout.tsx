import type { Metadata } from 'next';
import { getBaseUrl, validateImageUrl, sanitizeMetadata, generateMetadataTitle, generateMetadataDescription, isValidObjectId } from '@/lib/seo';

interface AbodeData {
  _id: string;
  abodeDetails: {
    title?: string;
    description: string;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
  };
  images: Array<{
    url: string;
    isMain: boolean;
  }>;
  rating: number;
  ratingCount: number;
  pricing: {
    pricePerNight: number;
    currency: string;
  };
  isVerified: boolean;
}

/**
 * Fetch abode data for metadata generation
 * Security: Validates ID before fetching
 */
async function fetchAbodeData(id: string): Promise<AbodeData | null> {
  // Validate ID format to prevent NoSQL injection
  if (!isValidObjectId(id)) {
    return null;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/abodes/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const abode = data.localHost;

    // Only return if abode is verified (published)
    if (!abode || !abode.isVerified) {
      return null;
    }

    return abode;
  } catch (error) {
    // Silently fail - return null for error cases
    return null;
  }
}

/**
 * Generate LodgingBusiness structured data
 */
function generateLodgingBusinessSchema(abode: AbodeData, baseUrl: string) {
  const mainImage = abode.images?.find(img => img.isMain) || abode.images?.[0];
  const imageUrl = mainImage ? validateImageUrl(mainImage.url) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: sanitizeMetadata(abode.abodeDetails?.title || 'Authentic Local Stay'),
    description: sanitizeMetadata(abode.abodeDetails?.description, 500),
    image: imageUrl ? [imageUrl] : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: abode.location?.country || '',
      addressRegion: abode.location?.state || '',
      addressLocality: abode.location?.district || '',
      streetAddress: abode.location?.address || '',
    },
    aggregateRating: abode.ratingCount > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: abode.rating || 0,
      reviewCount: abode.ratingCount || 0,
    } : undefined,
    priceRange: abode.pricing?.pricePerNight 
      ? `${abode.pricing.currency}${abode.pricing.pricePerNight}` 
      : undefined,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getBaseUrl();
  
  // Validate ID
  if (!params.id || !isValidObjectId(params.id)) {
    // Return generic metadata for invalid IDs
    return {
      title: 'Abode Not Found | Triberoutes',
      description: 'The requested abode could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const abode = await fetchAbodeData(params.id);

  // If abode not found or not verified, return noindex metadata
  if (!abode) {
    return {
      title: 'Abode Not Found | Triberoutes',
      description: 'The requested abode could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Generate safe metadata
  const title = abode.abodeDetails?.title || 'Authentic Local Stay';
  const location = [abode.location?.district, abode.location?.state, abode.location?.country]
    .filter(Boolean)
    .join(', ');
  
  const metadataTitle = generateMetadataTitle(
    `${sanitizeMetadata(title)} - Authentic Stay in ${sanitizeMetadata(location)}`,
    'Triberoutes'
  );
  
  const description = generateMetadataDescription(
    abode.abodeDetails?.description,
    `Experience authentic local living in ${location}. Book your stay with Triberoutes.`
  );

  const mainImage = abode.images?.find(img => img.isMain) || abode.images?.[0];
  const ogImage = mainImage ? validateImageUrl(mainImage.url) : validateImageUrl('/assets/logo.jpg') || `${baseUrl}/assets/logo.jpg`;
  const canonicalUrl = `${baseUrl}/adobes/${params.id}`;

  return {
    title: metadataTitle,
    description,
    keywords: [
      'authentic stay',
      'local homestay',
      abode.location?.district,
      abode.location?.state,
      'cultural accommodation',
    ].filter(Boolean) as string[],
    openGraph: {
      title: metadataTitle,
      description,
      url: canonicalUrl,
      siteName: 'Triberoutes',
      images: [
        {
          url: ogImage || `${baseUrl}/assets/logo.jpg`,
          width: 1200,
          height: 630,
          alt: sanitizeMetadata(title, 100),
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadataTitle,
      description,
      images: [ogImage || `${baseUrl}/assets/logo.jpg`],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function AbodeDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const baseUrl = getBaseUrl();
  
  // Generate structured data for this specific abode
  let structuredData = null;
  
  if (isValidObjectId(id)) {
    const abode = await fetchAbodeData(id);
    if (abode) {
      structuredData = generateLodgingBusinessSchema(abode, baseUrl);
    }
  }

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
      {children}
    </>
  );
}

