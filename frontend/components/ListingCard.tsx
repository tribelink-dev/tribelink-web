'use client';

import { useCurrency } from '@/lib/CurrencyContext';
import { useSaved } from '@/lib/SavedContext';
import { ListingCardShell } from './listing/ListingCard';

interface ListingCardProps {
  id: string;
  imageUrl: string | null;
  location: string;
  title: string;
  subtitle?: string;
  rating: number;
  ratingCount: number;
  price: number;
  priceLabel?: string;
  currency?: string;
  onClick?: () => void;
  type?: 'abode' | 'experience';
  index?: number;
}

export default function ListingCard({
  id,
  imageUrl,
  location,
  title,
  subtitle,
  rating,
  ratingCount,
  price,
  priceLabel = 'night',
  currency = 'INR',
  onClick,
  type = 'abode',
}: ListingCardProps) {
  const { formatPrice } = useCurrency();
  const { isAbodeSaved, isExperienceSaved, toggleAbode, toggleExperience } = useSaved();

  const isFavorite =
    type === 'abode' ? isAbodeSaved(id) : isExperienceSaved(id);

  return (
    <ListingCardShell
      id={id}
      imageUrl={imageUrl}
      location={location}
      title={title}
      subtitle={subtitle}
      rating={rating}
      ratingCount={ratingCount}
      price={formatPrice(price, currency)}
      priceLabel={priceLabel}
      isFavorite={isFavorite}
      onFavoriteClick={(e) => {
        e.stopPropagation();
        if (type === 'abode') {
          toggleAbode(id);
        } else {
          toggleExperience(id);
        }
      }}
      onClick={onClick}
    />
  );
}
