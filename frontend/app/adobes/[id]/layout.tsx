import type { Metadata } from 'next';
import {
  getBaseUrl,
  validateImageUrl,
  sanitizeMetadata,
  generateMetadataTitle,
  generateMetadataDescription,
  isValidObjectId,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { fetchAbodeById } from '@/lib/fetchAbode';

function generateLodgingBusinessSchema(
  abode: NonNullable<Awaited<ReturnType<typeof fetchAbodeById>>>['abode'],
  baseUrl: string
) {
  const mainImage = abode.images?.find((img) => img.isMain) || abode.images?.[0];
  const imageUrl = mainImage ? validateImageUrl(mainImage.url) : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: sanitizeMetadata(abode.abodeDetails?.title || 'Kerala Homestay'),
    description: sanitizeMetadata(abode.abodeDetails?.description, 500),
    image: imageUrl ? [imageUrl] : undefined,
    address: {
      '@type': 'PostalAddress',
      addressCountry: abode.location?.country || 'India',
      addressRegion: abode.location?.state || 'Kerala',
      addressLocality: abode.location?.district || '',
      streetAddress: abode.location?.address || '',
    },
    aggregateRating:
      abode.ratingCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: abode.rating || 0,
            reviewCount: abode.ratingCount || 0,
          }
        : undefined,
    priceRange: abode.pricing?.pricePerNight
      ? `${abode.pricing.currency}${abode.pricing.pricePerNight}`
      : undefined,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getBaseUrl();

  if (!id || !isValidObjectId(id)) {
    return {
      title: 'Abode Not Found',
      description: 'The requested abode could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const result = await fetchAbodeById(id);

  if (!result) {
    return {
      title: 'Kerala Homestay',
      description: 'View homestay details on Triberoutes.',
      alternates: { canonical: `${baseUrl}/adobes/${id}` },
    };
  }

  const { abode } = result;
  const title = abode.abodeDetails?.title || 'Kerala Homestay';
  const location = [abode.location?.district, abode.location?.state || 'Kerala', abode.location?.country || 'India']
    .filter(Boolean)
    .join(', ');

  const metadataTitle = generateMetadataTitle(
    `${sanitizeMetadata(title)} - Kerala Homestay in ${sanitizeMetadata(location)}`,
    'Triberoutes'
  );

  const description = generateMetadataDescription(
    abode.abodeDetails?.description,
    `Live with a Keralite family in ${location}. Book this verified Kerala homestay on Triberoutes.`
  );

  const mainImage = abode.images?.find((img) => img.isMain) || abode.images?.[0];
  const ogImage =
    mainImage ? validateImageUrl(mainImage.url) : `${baseUrl}/opengraph-image`;
  const canonicalUrl = `${baseUrl}/adobes/${id}`;

  return {
    title: metadataTitle,
    description,
    keywords: [
      'Kerala homestay',
      'stay with local family',
      abode.location?.district,
      'live like a Keralite',
      'authentic Kerala homestay',
    ].filter(Boolean) as string[],
    openGraph: {
      title: metadataTitle,
      description,
      url: canonicalUrl,
      siteName: 'Triberoutes',
      images: [
        {
          url: ogImage || `${baseUrl}/opengraph-image`,
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
      images: [ogImage || `${baseUrl}/opengraph-image`],
    },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
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

  let lodgingSchema: object | null = null;
  let breadcrumbSchema: object | null = null;

  if (isValidObjectId(id)) {
    const result = await fetchAbodeById(id);
    if (result) {
      lodgingSchema = generateLodgingBusinessSchema(result.abode, baseUrl);
      breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Explore', path: '/explore' },
        { name: 'Kerala Homestays', path: '/explore?section=abodes' },
        {
          name: sanitizeMetadata(result.abode.abodeDetails?.title || 'Kerala Homestay'),
          path: `/adobes/${id}`,
        },
      ]);
    }
  }

  return (
    <>
      {lodgingSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {children}
    </>
  );
}
