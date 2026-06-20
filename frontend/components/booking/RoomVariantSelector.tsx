'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Bath, Users, Check, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';
import { cn } from '@/lib/utils';

interface RoomVariant {
  variantId: string;
  name: string;
  description?: string;
  pricePerNight: number;
  capacity: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: Array<{
    url: string;
    isMain?: boolean;
    caption?: string;
  }>;
}

interface RoomVariantSelectorProps {
  variants: RoomVariant[];
  defaultVariantId?: string | null;
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  currency?: string;
  nights?: number;
}

export default function RoomVariantSelector({
  variants,
  defaultVariantId,
  selectedVariantId,
  onSelect,
  currency = 'USD',
  nights = 0,
}: RoomVariantSelectorProps) {
  const { formatPrice } = useCurrency();
  const [imageIndexByVariant, setImageIndexByVariant] = useState<Record<string, number>>({});

  if (!variants || variants.length === 0) return null;

  const currentVariantId = selectedVariantId || defaultVariantId || variants[0]?.variantId;
  const selectedVariant = variants.find((v) => v.variantId === currentVariantId) || variants[0];

  const getImageIndex = (variantId: string) => imageIndexByVariant[variantId] || 0;

  const setImageIndex = (variantId: string, index: number) => {
    setImageIndexByVariant((prev) => ({ ...prev, [variantId]: index }));
  };

  const currentImageIndex = getImageIndex(selectedVariant.variantId);
  const currentImages = selectedVariant.images || [];
  const currentImage = currentImages[currentImageIndex] || currentImages[0];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">Choose your room</h2>
          <p className="text-sm text-text-secondary mt-1">
            {variants.length} room type{variants.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {variants.map((variant) => {
          const isSelected = variant.variantId === currentVariantId;
          const variantImage = variant.images?.find((img) => img.isMain) || variant.images?.[0];
          const photoCount = variant.images?.length ?? 0;
          const stayTotal = nights > 0 ? variant.pricePerNight * nights : null;

          return (
            <motion.button
              key={variant.variantId}
              type="button"
              onClick={() => onSelect(variant.variantId)}
              whileTap={{ scale: 0.995 }}
              className={cn(
                'w-full text-left rounded-2xl border transition-all overflow-hidden',
                isSelected
                  ? 'border-text-primary shadow-medium ring-1 ring-text-primary/10'
                  : 'border-border bg-surface hover:border-text-secondary/40 hover:shadow-soft'
              )}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Thumbnail */}
                <div className="relative sm:w-44 md:w-52 shrink-0 aspect-[4/3] sm:aspect-auto sm:min-h-[140px] bg-surface-muted">
                  {variantImage ? (
                    <img
                      src={getImageUrl(variantImage.url) ?? undefined}
                      alt={variant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  {photoCount > 1 && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-xs font-medium">
                      {photoCount} photos
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-text-primary text-base sm:text-lg leading-snug">
                        {variant.name}
                      </h3>
                      {isSelected && (
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-text-primary text-white text-xs font-semibold">
                          <Check className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>

                    {variant.description && (
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">{variant.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-text-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {variant.capacity} guest{variant.capacity !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bed className="w-4 h-4" />
                        {variant.bedrooms} bed{variant.bedrooms !== 1 ? 's' : ''}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Bath className="w-4 h-4" />
                        {variant.bathrooms} bath{variant.bathrooms !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {variant.amenities.length > 0 && (
                      <p className="text-xs text-text-secondary mt-2 line-clamp-1">
                        {variant.amenities.slice(0, 4).join(' · ')}
                        {variant.amenities.length > 4 && ` · +${variant.amenities.length - 4} more`}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="sm:text-right shrink-0 sm:pl-2 border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                    <p className="text-lg font-semibold text-text-primary">
                      {formatPrice(variant.pricePerNight, currency)}
                    </p>
                    <p className="text-xs text-text-secondary">per night</p>
                    {stayTotal !== null && (
                      <p className="text-sm font-medium text-brand mt-1">
                        {formatPrice(stayTotal, currency)} total
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected room gallery & amenities */}
      <AnimatePresence mode="wait">
        {selectedVariant && (currentImages.length > 0 || selectedVariant.amenities.length > 0) && (
          <motion.div
            key={selectedVariant.variantId}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-5">
              <h3 className="font-semibold text-text-primary">{selectedVariant.name}</h3>

              {currentImages.length > 0 && (
                <div>
                  <div className="relative w-full aspect-[16/9] max-h-72 rounded-xl overflow-hidden bg-surface-muted">
                    <img
                      src={getImageUrl(currentImage.url) ?? undefined}
                      alt={currentImage.caption || selectedVariant.name}
                      className="w-full h-full object-cover"
                    />
                    {currentImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex =
                              (currentImageIndex - 1 + currentImages.length) % currentImages.length;
                            setImageIndex(selectedVariant.variantId, newIndex);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 touch-target w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = (currentImageIndex + 1) % currentImages.length;
                            setImageIndex(selectedVariant.variantId, newIndex);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 touch-target w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center hover:scale-105 transition-transform"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {currentImages.map((_, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex(selectedVariant.variantId, idx);
                              }}
                              className={cn(
                                'h-1.5 rounded-full transition-all',
                                currentImageIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                              )}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {currentImages.length > 1 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible">
                      {currentImages.slice(0, 5).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageIndex(selectedVariant.variantId, idx);
                          }}
                          className={cn(
                            'relative shrink-0 w-16 h-16 sm:w-auto sm:h-auto aspect-square rounded-lg overflow-hidden border-2 transition-all snap-start',
                            currentImageIndex === idx
                              ? 'border-text-primary'
                              : 'border-transparent hover:border-border'
                          )}
                        >
                          <img
                            src={getImageUrl(img.url) ?? undefined}
                            alt={img.caption || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedVariant.description && (
                <p className="text-sm text-text-secondary leading-relaxed">{selectedVariant.description}</p>
              )}

              {selectedVariant.amenities.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Room amenities</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedVariant.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-brand shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
