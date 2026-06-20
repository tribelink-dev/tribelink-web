import type { Metadata } from 'next';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Traveler Stories',
  description:
    'Read stories from travelers who lived with Keralite families and joined cultural experiences on Triberoutes.',
  alternates: { canonical: `${getBaseUrl()}/stories` },
  openGraph: {
    title: 'Traveler Stories | Triberoutes',
    description: 'Real stories from Kerala homestay and cultural experience travelers.',
    url: `${getBaseUrl()}/stories`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

const stories = [
  {
    name: 'Sarah M.',
    origin: 'United Kingdom',
    quote:
      'Staying with a family in Alleppey changed how I think about travel. We cooked together, visited the backwaters at dawn, and I left feeling like I had friends in Kerala.',
  },
  {
    name: 'Arjun K.',
    origin: 'Bangalore, India',
    quote:
      'I wanted to understand Kerala beyond tourist spots. My host taught me about local festivals and took me to a Kathakali performance — it felt personal, not packaged.',
  },
  {
    name: 'Marie L.',
    origin: 'France',
    quote:
      'The spice plantation experience with my homestay host was the highlight of my trip. She explained every plant and how it fits into Kerala daily life.',
  },
];

export default function StoriesPage() {
  return (
    <SeoContentPage
      title="Traveler Stories"
      description="Community stories from travelers who chose cultural immersion over checklist tourism."
    >
      <div className="space-y-8">
        {stories.map((story) => (
          <blockquote
            key={story.name}
            className="border-l-4 border-brand pl-6 py-2"
          >
            <p className="text-text-primary italic leading-relaxed">&ldquo;{story.quote}&rdquo;</p>
            <footer className="mt-3 text-sm text-text-secondary">
              — {story.name}, {story.origin}
            </footer>
          </blockquote>
        ))}
      </div>
      <p className="text-sm text-text-secondary mt-8">
        Have a story to share? Email us at{' '}
        <a href="mailto:info@triberoutes.com" className="text-brand hover:underline">
          info@triberoutes.com
        </a>
      </p>
    </SeoContentPage>
  );
}
