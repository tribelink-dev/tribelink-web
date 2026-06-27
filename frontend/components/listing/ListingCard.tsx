'use client';

import Image from 'next/image';
import { Heart, Star, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export interface ListingCardShellProps {
  id: string;
  imageUrl: string | null;
  title: string;
  location: string;
  rating?: number;
  ratingCount?: number;
  price: string;
  priceLabel?: string;
  subtitle?: string;
  isFavorite?: boolean;
  onFavoriteClick?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  topLeftBadge?: React.ReactNode;
  imageAlt?: string;
  className?: string;
}

export function ListingCardShell({
  imageUrl,
  title,
  location,
  rating = 0,
  ratingCount = 0,
  price,
  priceLabel = 'night',
  subtitle,
  isFavorite = false,
  onFavoriteClick,
  onClick,
  topLeftBadge,
  imageAlt,
  className,
}: ListingCardShellProps) {
  return (
    <article
      className={cn('group cursor-pointer', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-3 bg-surface-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt || title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <Home className="w-12 h-12 opacity-40" />
          </div>
        )}

        {topLeftBadge && (
          <div className="absolute top-3 left-3 z-10">{topLeftBadge}</div>
        )}

        {onFavoriteClick && (
          <button
            type="button"
            onClick={onFavoriteClick}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm z-10 touch-target"
            aria-label={isFavorite ? 'Remove from bucketlist' : 'Add to bucketlist'}
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-colors',
                isFavorite ? 'fill-red-500 text-red-500' : 'text-text-primary'
              )}
            />
          </button>
        )}
      </div>

      <div className="space-y-1">
        <h3 className="text-[15px] sm:text-base font-semibold text-text-primary line-clamp-2 leading-snug group-hover:text-brand transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] sm:text-sm text-text-secondary truncate">{location}</p>
          {rating > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star className="w-3 h-3 fill-text-primary text-text-primary" />
              <span className="text-[13px] sm:text-sm font-medium text-text-primary">
                {rating.toFixed(1)}
              </span>
              {ratingCount > 0 && (
                <span className="text-[13px] text-text-secondary">({ratingCount})</span>
              )}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-[13px] text-text-secondary line-clamp-1">{subtitle}</p>
        )}

        <p className="text-[15px] pt-0.5">
          <span className="font-semibold text-text-primary">{price}</span>
          <span className="text-text-secondary"> {priceLabel}</span>
        </p>
      </div>
    </article>
  );
}

export { Badge as ListingBadge };
