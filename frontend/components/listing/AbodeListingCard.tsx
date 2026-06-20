'use client';

import { useMemo } from 'react';
import { Shield } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';
import { useSaved } from '@/lib/SavedContext';
import { ListingCardShell, ListingBadge } from './ListingCard';

interface RoomVariant {
  variantId: string;
  name: string;
  pricePerNight: number;
}

interface AbodeListingCardProps {
  abode: {
    _id: string;
    images?: Array<{ url: string; isMain?: boolean }>;
    providerId?: { name: string };
    abodeDetails?: {
      title?: string;
      propertyType: string;
      capacity: number;
    };
    location?: {
      district: string;
      state: string;
    };
    pricing?: {
      pricePerNight: number;
      currency?: string;
    };
    roomVariants?: RoomVariant[];
    rating?: number;
    ratingCount?: number;
    isVerified?: boolean;
    culturalPractices?: Array<{ practice: string }>;
    linkedExperiences?: Array<{ _id: string }>;
  };
  imageUrl: string | null;
  onClick?: () => void;
  index?: number;
}

export default function AbodeListingCard({ abode, imageUrl, onClick }: AbodeListingCardProps) {
  const { formatPrice } = useCurrency();
  const { isAbodeSaved, toggleAbode } = useSaved();

  const { displayPrice, showFromPrefix } = useMemo(() => {
    if (abode.roomVariants && abode.roomVariants.length > 0) {
      const validPrices = abode.roomVariants
        .map((v) => v.pricePerNight)
        .filter((p) => p > 0 && !isNaN(p));
      if (validPrices.length > 0) {
        const minPrice = Math.min(...validPrices);
        const maxPrice = Math.max(...validPrices);
        return {
          displayPrice: minPrice,
          showFromPrefix: minPrice !== maxPrice && abode.roomVariants.length > 1,
        };
      }
    }
    return {
      displayPrice: abode.pricing?.pricePerNight || 0,
      showFromPrefix: false,
    };
  }, [abode.roomVariants, abode.pricing?.pricePerNight]);

  const hostName = abode.providerId?.name || 'Host';
  const propertyType = abode.abodeDetails?.propertyType || 'Homestay';
  const location = abode.location
    ? `${abode.location.district}, ${abode.location.state}`
    : 'Location not specified';

  const displayTitle =
    abode.abodeDetails?.title || `${hostName}'s ${propertyType}`;

  const experienceCount = abode.linkedExperiences?.length || 0;
  const culturalHint =
    abode.culturalPractices && abode.culturalPractices.length > 0
      ? abode.culturalPractices[0].practice
      : undefined;

  const subtitleParts = [
    'Family homestay',
    experienceCount > 0 ? `+${experienceCount} experience${experienceCount !== 1 ? 's' : ''}` : null,
    culturalHint,
  ].filter(Boolean);

  const currency = abode.pricing?.currency || 'INR';
  const priceText = `${showFromPrefix ? 'from ' : ''}${formatPrice(displayPrice, currency)}`;

  return (
    <ListingCardShell
      id={abode._id}
      imageUrl={imageUrl}
      imageAlt={displayTitle}
      location={location}
      title={displayTitle}
      subtitle={subtitleParts.join(' · ')}
      rating={abode.rating || 0}
      ratingCount={abode.ratingCount || 0}
      price={priceText}
      priceLabel="night"
      isFavorite={isAbodeSaved(abode._id)}
      onFavoriteClick={(e) => {
        e.stopPropagation();
        toggleAbode(abode._id);
      }}
      onClick={onClick}
      topLeftBadge={
        abode.isVerified ? (
          <ListingBadge variant="success" className="gap-1">
            <Shield className="w-3 h-3" />
            Verified
          </ListingBadge>
        ) : undefined
      }
    />
  );
}
