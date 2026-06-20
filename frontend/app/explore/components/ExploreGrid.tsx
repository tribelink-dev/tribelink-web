'use client';

import { Home } from 'lucide-react';
import AbodeListingCard from '@/components/listing/AbodeListingCard';
import ExperienceListingCard from '@/components/listing/ExperienceListingCard';
import { ListingGridSkeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

interface ExploreGridProps {
  type: 'abodes' | 'experiences';
  loading: boolean;
  abodes?: any[];
  experiences?: any[];
  getAbodeImageUrl: (abode: any) => string | null;
  getExperienceImageUrl: (exp: any) => string | null;
  onAbodeClick: (abode: any) => void;
  onExperienceClick: (id: string) => void;
  onAddToBucketlist?: (id: string) => void;
  bucketlistIds?: Set<string>;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  onEmptyAction: () => void;
}

export default function ExploreGrid({
  type,
  loading,
  abodes = [],
  experiences = [],
  getAbodeImageUrl,
  getExperienceImageUrl,
  onAbodeClick,
  onExperienceClick,
  onAddToBucketlist,
  bucketlistIds = new Set(),
  hasMore,
  onLoadMore,
  loadingMore,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
}: ExploreGridProps) {
  if (loading) {
    return <ListingGridSkeleton count={12} />;
  }

  const items = type === 'abodes' ? abodes : experiences;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Home className="w-12 h-12 text-text-secondary opacity-40 mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">{emptyTitle}</h3>
        <p className="text-sm text-text-secondary mb-6 max-w-md">{emptyDescription}</p>
        <Button onClick={onEmptyAction}>{emptyActionLabel}</Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6 mb-8">
        {type === 'abodes'
          ? abodes.map((abode) => (
              <AbodeListingCard
                key={abode._id}
                abode={abode}
                imageUrl={getAbodeImageUrl(abode)}
                onClick={() => onAbodeClick(abode)}
              />
            ))
          : experiences.map((exp) => (
              <ExperienceListingCard
                key={exp._id}
                experience={exp}
                imageUrl={getExperienceImageUrl(exp)}
                onClick={() => onExperienceClick(exp._id)}
                onAddToBucketlist={onAddToBucketlist}
                isInBucketlist={bucketlistIds.has(exp._id)}
              />
            ))}
      </div>

      {hasMore && onLoadMore && (
        <div className="flex justify-center mb-8">
          <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Show more'}
          </Button>
        </div>
      )}
    </>
  );
}
