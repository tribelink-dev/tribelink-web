import { Suspense } from 'react';
import { fetchInitialListings } from '@/lib/fetchListings';
import ExploreServerListings from '@/components/seo/ExploreServerListings';
import KeralaFAQ from '@/components/seo/KeralaFAQ';
import ExplorePageClient from './ExplorePageClient';

export default async function ExplorePage() {
  const { abodes, experiences } = await fetchInitialListings();

  return (
    <>
      <ExploreServerListings abodes={abodes} experiences={experiences} />
      <Suspense fallback={<div className="min-h-screen bg-background pt-below-nav" />}>
        <ExplorePageClient initialAbodes={abodes} initialExperiences={experiences} />
      </Suspense>
      <KeralaFAQ />
    </>
  );
}
