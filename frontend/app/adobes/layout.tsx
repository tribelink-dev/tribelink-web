import type { Metadata } from 'next';
import { getBaseUrl, validateImageUrl } from '@/lib/seo';

export const metadata: Metadata = {
  title: "Discover Authentic Local Stays | Triberoutes",
  description: "Discover authentic local stays, homestays, and cultural accommodations. Experience real local living with Triberoutes.",
  keywords: [
    "authentic stays",
    "local homestays",
    "cultural accommodations",
    "local hosts",
    "authentic travel stays",
  ],
  openGraph: {
    title: "Discover Authentic Local Stays | Triberoutes",
    description: "Discover authentic local stays, homestays, and cultural accommodations. Experience real local living.",
    url: `${getBaseUrl()}/adobes`,
    siteName: "Triberoutes",
    images: [
      {
        url: validateImageUrl('/assets/logo.jpg') || `${getBaseUrl()}/assets/logo.jpg`,
        width: 1200,
        height: 630,
        alt: "Discover Authentic Stays - Triberoutes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Authentic Local Stays | Triberoutes",
    description: "Discover authentic local stays, homestays, and cultural accommodations.",
    images: [validateImageUrl('/assets/logo.jpg') || `${getBaseUrl()}/assets/logo.jpg`],
  },
  alternates: {
    canonical: `${getBaseUrl()}/adobes`,
  },
};

export default function AbodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

