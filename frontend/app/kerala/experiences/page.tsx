import type { Metadata } from 'next';
import Link from 'next/link';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Kerala Cultural Experiences — Guided by Local Hosts',
  description:
    'Book traditional Kerala cultural experiences — cooking classes, Kathakali, crafts, spice tours, and festivals — all guided by verified local hosts.',
  keywords: [
    'Kerala cultural experiences',
    'traditional Kerala activities',
    'guided by local host Kerala',
    'Kerala cooking class',
  ],
  alternates: { canonical: `${getBaseUrl()}/kerala/experiences` },
  openGraph: {
    title: 'Kerala Cultural Experiences | Triberoutes',
    description: 'Traditional Kerala activities guided by local hosts. Book on Triberoutes.',
    url: `${getBaseUrl()}/kerala/experiences`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

export default function KeralaExperiencesPage() {
  return (
    <SeoContentPage
      title="Kerala Cultural Experiences — Guided by Local Hosts"
      description="Every experience on Triberoutes is curated and guided by a local Kerala host — not a generic tour operator."
    >
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Traditional Kerala activities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Kerala cooking classes with local families</li>
          <li>Kathakali, classical music, and performing arts</li>
          <li>Handicraft workshops — pottery, weaving, and woodwork</li>
          <li>Spice plantation and backwater village tours</li>
          <li>Festival celebrations and temple culture</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Guided by your host</h2>
        <p>
          Your host doesn&apos;t just point the way — they share context, stories, and personal
          connections to the place. Experiences are designed for travelers who want cultural
          understanding, whether you&apos;re visiting from abroad or exploring your own country.
        </p>
        <p className="mt-4">
          <Link href="/explore?section=experiences" className="text-brand font-medium hover:underline">
            Browse Kerala experiences →
          </Link>
        </p>
      </section>
    </SeoContentPage>
  );
}
