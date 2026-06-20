import type { Metadata } from 'next';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'About Triberoutes',
  description:
    'Triberoutes connects travelers with verified Kerala families and local hosts for authentic homestays and cultural experiences. Live like a Keralite.',
  alternates: { canonical: `${getBaseUrl()}/about` },
  openGraph: {
    title: 'About Triberoutes',
    description: 'Authentic Kerala homestays and cultural experiences guided by local hosts.',
    url: `${getBaseUrl()}/about`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

export default function AboutPage() {
  return (
    <SeoContentPage
      title="About Triberoutes"
      description="High tech. Deep touch. We help travelers live with Keralite families and book cultural experiences guided by local hosts."
    >
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Our mission</h2>
        <p>
          Triberoutes exists for travelers who want cultural understanding — not staged tourism.
          We verify Kerala homestays and connect you with local hosts who share their home,
          traditions, and community with genuine warmth.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">What makes us different</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Verified family homestays, not anonymous rentals</li>
          <li>Experiences curated and guided by your local host</li>
          <li>Focus on Kerala cultural immersion</li>
          <li>Built for international and Indian travelers alike</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-text-primary">Based in Kerala, India</h2>
        <p>
          Triberoutes is rooted in Kerala — a region known for hospitality, arts, cuisine, and
          living traditions. We believe the best way to understand a place is through the people
          who call it home.
        </p>
      </section>
    </SeoContentPage>
  );
}
