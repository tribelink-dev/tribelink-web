import type { Metadata } from 'next';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Kerala Homestays',
  description:
    'Browse verified Kerala homestays on Triberoutes. Stay with local families and live like a Keralite.',
  openGraph: {
    title: 'Kerala Homestays | Triberoutes',
    description: 'Stay with verified Kerala families. Live like a Keralite.',
    url: `${getBaseUrl()}/explore?section=abodes`,
    siteName: 'Triberoutes',
    images: [
      {
        url: getDefaultOgImage(),
        width: 1200,
        height: 630,
        alt: 'Kerala Homestays on Triberoutes',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kerala Homestays | Triberoutes',
    description: 'Stay with verified Kerala families. Live like a Keralite.',
    images: [getDefaultOgImage()],
  },
  alternates: {
    canonical: `${getBaseUrl()}/explore?section=abodes`,
  },
};

export default function AbodesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
