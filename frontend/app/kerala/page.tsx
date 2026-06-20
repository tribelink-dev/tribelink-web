import type { Metadata } from 'next';
import Link from 'next/link';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Kerala Cultural Travel',
  description:
    'Discover Kerala through homestays and cultural experiences. Live with a Keralite family, learn traditions, and travel for cultural understanding with Triberoutes.',
  alternates: { canonical: `${getBaseUrl()}/kerala` },
  openGraph: {
    title: 'Kerala Cultural Travel | Triberoutes',
    description:
      'Live with a Keralite family. Book verified Kerala homestays and traditional experiences guided by local hosts.',
    url: `${getBaseUrl()}/kerala`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

export default function KeralaPage() {
  return (
    <SeoContentPage
      title="Kerala Cultural Travel"
      description="Triberoutes is your gateway to authentic Kerala — stay with local families, live like a Keralite, and join traditional experiences guided by your host."
    >
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Why Kerala with Triberoutes?</h2>
        <p>
          Kerala is one of India&apos;s richest cultural landscapes — backwaters, spice gardens,
          classical arts, and centuries-old traditions. Triberoutes connects you with verified
          Kerala families who welcome travelers seeking genuine cultural understanding, not
          checklist tourism.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">What you can book</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <Link href="/kerala/homestays" className="text-brand hover:underline">
              Kerala homestays
            </Link>{' '}
            — live with a local family
          </li>
          <li>
            <Link href="/kerala/experiences" className="text-brand hover:underline">
              Kerala cultural experiences
            </Link>{' '}
            — cooking, crafts, music, festivals, and more
          </li>
          <li>
            <Link href="/explore" className="text-brand hover:underline">
              Browse all listings
            </Link>{' '}
            — homestays and experiences across Kerala
          </li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Who is this for?</h2>
        <p>
          International and Indian travelers who want to understand Kerala culture deeply — through
          daily life with a host family, home-cooked meals, regional customs, and activities curated
          by locals who know their community.
        </p>
      </section>
    </SeoContentPage>
  );
}
