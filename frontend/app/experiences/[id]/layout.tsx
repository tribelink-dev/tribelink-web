import type { Metadata } from 'next';
import {
  getBaseUrl,
  validateImageUrl,
  sanitizeMetadata,
  generateMetadataTitle,
  generateMetadataDescription,
  isValidObjectId,
  generateBreadcrumbSchema,
  generateTouristAttractionSchema,
} from '@/lib/seo';
import { fetchExperienceById } from '@/lib/fetchExperience';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = getBaseUrl();

  if (!id || !isValidObjectId(id)) {
    return {
      title: 'Experience Not Found',
      description: 'The requested experience could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const experience = await fetchExperienceById(id);

  if (!experience) {
    return {
      title: 'Kerala Cultural Experience',
      description: 'View experience details on Triberoutes.',
      alternates: { canonical: `${baseUrl}/experiences/${id}` },
    };
  }

  const location = [
    experience.location?.district,
    experience.location?.state || 'Kerala',
    experience.location?.country || 'India',
  ]
    .filter(Boolean)
    .join(', ');

  const metadataTitle = generateMetadataTitle(
    `${sanitizeMetadata(experience.title)} - Kerala Cultural Experience in ${sanitizeMetadata(location)}`,
    'Triberoutes'
  );

  const description = generateMetadataDescription(
    experience.description,
    `Book ${experience.title} in ${location}. A traditional Kerala cultural experience guided by a local host on Triberoutes.`
  );

  const ogImage =
    validateImageUrl(experience.imageUrl) ||
    validateImageUrl('/opengraph-image') ||
    `${baseUrl}/opengraph-image`;
  const canonicalUrl = `${baseUrl}/experiences/${id}`;

  return {
    title: metadataTitle,
    description,
    keywords: [
      'Kerala cultural experience',
      'traditional Kerala activities',
      experience.location?.district,
      'guided by local host',
      experience.category,
      experience.title,
    ].filter(Boolean) as string[],
    openGraph: {
      title: metadataTitle,
      description,
      url: canonicalUrl,
      siteName: 'Triberoutes',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: sanitizeMetadata(experience.title, 100),
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metadataTitle,
      description,
      images: [ogImage],
    },
    alternates: { canonical: canonicalUrl },
    robots: { index: true, follow: true },
  };
}

export default async function ExperienceDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let structuredData: object | null = null;
  let breadcrumbData: object | null = null;

  if (isValidObjectId(id)) {
    const experience = await fetchExperienceById(id);
    if (experience) {
      structuredData = generateTouristAttractionSchema(experience);
      breadcrumbData = generateBreadcrumbSchema([
        { name: 'Explore', path: '/explore' },
        { name: 'Kerala Experiences', path: '/explore?section=experiences' },
        { name: sanitizeMetadata(experience.title), path: `/experiences/${id}` },
      ]);
    }
  }

  return (
    <>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      {breadcrumbData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
        />
      )}
      {children}
    </>
  );
}
