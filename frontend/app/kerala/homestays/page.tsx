import type { Metadata } from 'next';
import Link from 'next/link';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Kerala Homestays — Stay with a Local Family',
  description:
    'Book a verified Kerala homestay and live with a Keralite family. Share meals, learn customs, and experience authentic daily life — not a hotel stay.',
  keywords: [
    'Kerala homestay',
    'stay with local family Kerala',
    'live like a Keralite',
    'authentic Kerala homestay',
  ],
  alternates: { canonical: `${getBaseUrl()}/kerala/homestays` },
  openGraph: {
    title: 'Kerala Homestays — Stay with a Local Family | Triberoutes',
    description: 'Live with a Keralite family. Verified Kerala homestays for cultural immersion.',
    url: `${getBaseUrl()}/kerala/homestays`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

export default function KeralaHomestaysPage() {
  return (
    <SeoContentPage
      title="Kerala Homestays — Stay with a Local Family"
      description="A Kerala homestay on Triberoutes means living with a verified local family — sharing meals, stories, and daily routines in their home."
    >
      <section>
        <h2 className="text-xl font-semibold text-text-primary">What is a Kerala homestay?</h2>
        <p>
          Unlike hotels or generic rentals, a Triberoutes homestay (&quot;abode&quot;) is a family home
          in Kerala where you are welcomed as a guest. You eat home-cooked Kerala food, learn about
          local customs, and experience the region through the eyes of your hosts.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Live like a Keralite</h2>
        <p>
          Living like a Keralite means participating in real daily life — morning chai, regional
          cuisine, temple visits, spice gardens, backwater villages, and conversations that help you
          understand why Kerala culture is unique.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Verified hosts</h2>
        <p>
          Every homestay on Triberoutes is verified before listing. Hosts are Kerala families who
          genuinely welcome travelers interested in cultural understanding.
        </p>
        <p className="mt-4">
          <Link href="/explore?section=abodes" className="text-brand font-medium hover:underline">
            Browse Kerala homestays →
          </Link>
        </p>
      </section>
    </SeoContentPage>
  );
}
