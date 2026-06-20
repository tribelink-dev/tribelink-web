import Link from 'next/link';
import { PageContainer } from '@/components/ui/PageContainer';

interface SeoContentPageProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function SeoContentPage({ title, description, children }: SeoContentPageProps) {
  return (
    <div className="min-h-screen bg-background pt-below-nav pb-16">
      <PageContainer width="constrained">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-text-primary mb-4">{title}</h1>
          <p className="text-lg text-text-secondary leading-relaxed">{description}</p>
        </header>
        <div className="prose prose-neutral max-w-none text-text-secondary space-y-6">{children}</div>
        <div className="mt-12 pt-8 border-t border-border">
          <Link
            href="/explore"
            className="inline-flex items-center text-brand font-medium hover:underline"
          >
            Browse Kerala homestays &amp; experiences →
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
