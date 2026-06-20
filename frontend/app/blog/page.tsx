import type { Metadata } from 'next';
import Link from 'next/link';
import { getBaseUrl, getDefaultOgImage } from '@/lib/seo';
import SeoContentPage from '@/components/seo/SeoContentPage';

export const metadata: Metadata = {
  title: 'Blog — Kerala Cultural Travel',
  description:
    'Guides and insights on Kerala homestays, cultural experiences, and authentic travel from the Triberoutes team.',
  alternates: { canonical: `${getBaseUrl()}/blog` },
  openGraph: {
    title: 'Blog | Triberoutes',
    url: `${getBaseUrl()}/blog`,
    images: [{ url: getDefaultOgImage(), width: 1200, height: 630 }],
  },
};

const posts = [
  {
    slug: 'what-is-a-kerala-homestay',
    title: 'What is a Kerala Homestay?',
    excerpt:
      'Learn how staying with a Keralite family differs from hotels and Airbnb — and why it matters for cultural travel.',
    href: '/kerala/homestays',
  },
  {
    slug: 'live-like-a-keralite',
    title: "What Does 'Live Like a Keralite' Mean?",
    excerpt:
      'A practical guide to cultural immersion — meals, customs, language, and daily life with your host family.',
    href: '/kerala',
  },
  {
    slug: 'kerala-cultural-experiences-guide',
    title: 'Top Kerala Cultural Experiences for First-Time Visitors',
    excerpt:
      'Cooking classes, Kathakali, spice gardens, and festival experiences — all guided by local hosts.',
    href: '/kerala/experiences',
  },
];

export default function BlogPage() {
  return (
    <SeoContentPage
      title="Kerala Cultural Travel Blog"
      description="Guides and stories to help you plan an authentic Kerala journey."
    >
      <div className="space-y-8">
        {posts.map((post) => (
          <article key={post.slug} className="border-b border-border pb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              <Link href={post.href} className="hover:text-brand transition-colors">
                {post.title}
              </Link>
            </h2>
            <p className="text-text-secondary">{post.excerpt}</p>
            <Link href={post.href} className="inline-block mt-3 text-sm text-brand hover:underline">
              Read more →
            </Link>
          </article>
        ))}
      </div>
      <p className="text-sm text-text-secondary">
        More articles coming soon. Subscribe to updates at{' '}
        <a href="mailto:info@triberoutes.com" className="text-brand hover:underline">
          info@triberoutes.com
        </a>
      </p>
    </SeoContentPage>
  );
}
