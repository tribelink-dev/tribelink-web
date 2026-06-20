'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSaved } from '@/lib/SavedContext';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import AbodeListingCard from '@/components/listing/AbodeListingCard';
import ExperienceListingCard from '@/components/listing/ExperienceListingCard';
import { ListingGridSkeleton } from '@/components/ui/Skeleton';
import { PageContainer } from '@/components/ui/PageContainer';
import { Heart } from 'lucide-react';

export default function SavedPage() {
  const router = useRouter();
  const { savedAbodeIds, savedExperienceIds } = useSaved();
  const [abodes, setAbodes] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const abodeIds = Array.from(savedAbodeIds);
        const expIds = Array.from(savedExperienceIds);

        const abodePromises = abodeIds.map((id) =>
          api.get(`/abodes/${id}`).then((r) => r.data.localHost).catch(() => null)
        );
        const expPromises = expIds.map((id) =>
          api.get(`/experiences/${id}`).then((r) => r.data.experience).catch(() => null)
        );

        const [abodeResults, expResults] = await Promise.all([
          Promise.all(abodePromises),
          Promise.all(expPromises),
        ]);

        setAbodes(abodeResults.filter(Boolean));
        setExperiences(expResults.filter(Boolean));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [savedAbodeIds, savedExperienceIds]);

  if (loading) {
    return (
      <PageContainer className="pb-8">
        <ListingGridSkeleton count={4} />
      </PageContainer>
    );
  }

  const isEmpty = abodes.length === 0 && experiences.length === 0;

  return (
    <PageContainer className="pb-8">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Saved</h1>
      <p className="text-sm text-text-secondary mb-8">Homestays and experiences you&apos;ve saved</p>

      {isEmpty ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-text-secondary opacity-40 mx-auto mb-4" />
          <p className="text-text-secondary mb-4">Nothing saved yet</p>
          <Link href="/explore" className="text-brand-hover font-medium hover:underline">
            Start exploring
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {abodes.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Homestays</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                {abodes.map((abode) => {
                  const mainImage = abode.images?.find((img: any) => img.isMain) || abode.images?.[0];
                  return (
                    <Link key={abode._id} href={`/adobes/${abode._id}`}>
                      <AbodeListingCard
                        abode={abode}
                        imageUrl={mainImage ? getImageUrl(mainImage.url) : null}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
          {experiences.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4">Experiences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                {experiences.map((exp) => (
                  <ExperienceListingCard
                    key={exp._id}
                    experience={exp}
                    imageUrl={exp.imageUrl ? getImageUrl(exp.imageUrl) : null}
                    onClick={() => router.push(`/experiences/${exp._id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}
