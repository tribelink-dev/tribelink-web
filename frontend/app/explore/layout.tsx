import type { Metadata } from 'next';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import { fetchInitialListings } from '@/lib/fetchListings';
import { generateFAQPageSchema, generateItemListSchema } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kerala Homestays & Cultural Experiences',
  description:
    'Live with a Keralite family. Browse verified Kerala homestays and book traditional cultural experiences guided by local hosts on Triberoutes.',
  keywords: [
    'Kerala homestay',
    'stay with local family Kerala',
    'Kerala cultural experiences',
    'live like a Keralite',
    'traditional Kerala activities',
    'authentic Kerala homestay',
  ],
  openGraph: {
    title: 'Kerala Homestays & Cultural Experiences | Triberoutes',
    description:
      'Live with a Keralite family. Browse verified Kerala homestays and traditional cultural experiences guided by local hosts.',
    url: `${getBaseUrl()}/explore`,
    siteName: 'Triberoutes',
    images: [
      {
        url: getDefaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'Triberoutes - Kerala Homestays & Cultural Experiences',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kerala Homestays & Cultural Experiences | Triberoutes',
    description:
      'Live with a Keralite family. Browse verified Kerala homestays and traditional cultural experiences guided by local hosts.',
    images: [getDefaultOgImage()],
  },
  alternates: {
    canonical: `${getBaseUrl()}/explore`,
  },
};

export default async function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { abodes, experiences } = await fetchInitialListings();
  const baseUrl = getBaseUrl();

  const itemListItems = [
    ...abodes.slice(0, 6).map((abode) => ({
      name: abode.abodeDetails?.title || 'Kerala Homestay',
      url: `${baseUrl}/adobes/${abode._id}`,
      description: abode.abodeDetails?.description,
    })),
    ...experiences.slice(0, 6).map((exp) => ({
      name: exp.title || 'Kerala Cultural Experience',
      url: `${baseUrl}/experiences/${exp._id}`,
      description: exp.description,
    })),
  ];

  const itemListSchema = itemListItems.length > 0 ? generateItemListSchema(itemListItems) : null;
  const faqSchema = generateFAQPageSchema();

  return (
    <>
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
