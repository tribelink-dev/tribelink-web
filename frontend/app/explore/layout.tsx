import type { Metadata } from 'next';
import { getBaseUrl, validateImageUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: "Explore Authentic Experiences & Stays | Triberoutes",
  description: "Explore and discover authentic local experiences, cultural stays, and unique accommodations. Find your perfect travel experience with Triberoutes.",
  keywords: [
    "explore experiences",
    "authentic travel",
    "cultural stays",
    "local accommodations",
    "travel experiences",
  ],
  openGraph: {
    title: "Explore Authentic Experiences & Stays | Triberoutes",
    description: "Explore and discover authentic local experiences, cultural stays, and unique accommodations.",
    url: `${getBaseUrl()}/explore`,
    siteName: "Triberoutes",
    images: [
      {
        url: validateImageUrl('/assets/logo.jpg') || `${getBaseUrl()}/assets/logo.jpg`,
        width: 1200,
        height: 630,
        alt: "Explore Triberoutes - Authentic Travel Experiences",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Authentic Experiences & Stays | Triberoutes",
    description: "Explore and discover authentic local experiences, cultural stays, and unique accommodations.",
    images: [validateImageUrl('/assets/logo.jpg') || `${getBaseUrl()}/assets/logo.jpg`],
  },
  alternates: {
    canonical: `${getBaseUrl()}/explore`,
  },
};

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

