'use client';

import { useCurrency } from '@/lib/CurrencyContext';
import { useSaved } from '@/lib/SavedContext';
import { ListingCardShell } from './ListingCard';

interface ExperienceListingCardProps {
  experience: {
    _id: string;
    title: string;
    price: number;
    currency?: string;
    averageRating?: number;
    reviewCount?: number;
    category?: string;
    location?: {
      district: string;
      state: string;
    };
    duration?: number;
    culturalMetadata?: {
      traditions?: string[];
    };
  };
  imageUrl: string | null;
  onClick?: () => void;
  onAddToBucketlist?: (experienceId: string) => void;
  isInBucketlist?: boolean;
  index?: number;
}

export default function ExperienceListingCard({
  experience,
  imageUrl,
  onClick,
  onAddToBucketlist,
  isInBucketlist = false,
}: ExperienceListingCardProps) {
  const { formatPrice } = useCurrency();
  const { isExperienceSaved, toggleExperience } = useSaved();

  const location = experience.location
    ? `${experience.location.district}, ${experience.location.state}`
    : 'Location not specified';

  const tradition = experience.culturalMetadata?.traditions?.[0];
  const subtitleParts = [
    experience.category || 'Cultural experience',
    experience.duration
      ? `${experience.duration % 1 === 0 ? experience.duration : experience.duration} hr${experience.duration !== 1 ? 's' : ''}`
      : null,
    tradition,
  ].filter(Boolean);

  const saved = isInBucketlist || isExperienceSaved(experience._id);

  return (
    <ListingCardShell
      id={experience._id}
      imageUrl={imageUrl}
      imageAlt={experience.title}
      location={location}
      title={experience.title}
      subtitle={subtitleParts.join(' · ')}
      rating={experience.averageRating || 0}
      ratingCount={experience.reviewCount || 0}
      price={formatPrice(experience.price || 0, experience.currency || 'INR')}
      priceLabel="person"
      isFavorite={saved}
      onFavoriteClick={(e) => {
        e.stopPropagation();
        toggleExperience(experience._id, onAddToBucketlist);
      }}
      onClick={onClick}
    />
  );
}
