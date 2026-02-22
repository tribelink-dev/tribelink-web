'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bed, Bath, Users, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';

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
}

export default function RoomVariantSelector({
  variants,
  defaultVariantId,
  selectedVariantId,
  onSelect,
  currency = 'USD'
}: RoomVariantSelectorProps) {
  const { formatPrice } = useCurrency();
  const [selectedImageIndex, setSelectedImageIndex] = useState<{ [key: string]: number }>({});

  // If no variants, return null (backward compatibility)
  if (!variants || variants.length === 0) {
    return null;
  }

  // Determine which variant to show as selected
  const currentVariantId = selectedVariantId || defaultVariantId || variants[0]?.variantId;
  const selectedVariant = variants.find(v => v.variantId === currentVariantId) || variants[0];

  const getImageIndex = (variantId: string) => {
    return selectedImageIndex[variantId] || 0;
  };

  const setImageIndex = (variantId: string, index: number) => {
    setSelectedImageIndex(prev => ({
      ...prev,
      [variantId]: index
    }));
  };

  const currentImageIndex = getImageIndex(selectedVariant.variantId);
  const currentImages = selectedVariant.images || [];
  const currentImage = currentImages[currentImageIndex] || currentImages[0];

  return (
    <div className="space-y-6">
      {/* Variant Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
        {variants.map((variant) => {
          const isSelected = variant.variantId === currentVariantId;
          const variantImage = variant.images?.[0] || null;

          return (
            <motion.button
              key={variant.variantId}
              onClick={() => onSelect(variant.variantId)}
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className={`relative flex flex-col rounded-2xl border-2 transition-all text-left overflow-hidden h-full ${
                isSelected
                  ? 'border-heritage-gold bg-gradient-to-br from-heritage-gold/10 to-cream-500/20 shadow-xl ring-2 ring-heritage-gold/20'
                  : 'border-gray-200 bg-white hover:border-heritage-gold/50 hover:shadow-lg'
              }`}
            >
              {/* Selection Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 z-10 bg-heritage-gold text-white rounded-full p-1.5 shadow-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}

              {/* Variant Image */}
              {variantImage && (
                <div className="relative w-full h-40 rounded-t-2xl overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(variantImage.url) ?? undefined}
                    alt={variant.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                  )}
                </div>
              )}

              {/* Variant Info - Fixed height container with proper spacing */}
              <div className="flex flex-col flex-1 p-4 min-h-[200px]">
                {/* Room Name - Fixed height to prevent layout shifts */}
                <div className="mb-3 min-h-[3rem] flex items-start">
                  <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight">
                    {variant.name}
                  </h3>
                </div>

                {/* Price - Always visible with proper width */}
                <div className="mb-4 flex-shrink-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-xl font-bold text-heritage-gold break-words">
                      {formatPrice(variant.pricePerNight, currency)}
                    </span>
                    <span className="text-xs text-gray-600 whitespace-nowrap">/night</span>
                  </div>
                </div>

                {/* Description - Optional, shown if available, before features */}
                {variant.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{variant.description}</p>
                )}

                {/* Capacity & Features - Always consistent layout at bottom */}
                <div className="mt-auto pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Users className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="text-xs text-gray-600 truncate" title={`${variant.capacity} guest${variant.capacity !== 1 ? 's' : ''}`}>
                        {variant.capacity}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Bed className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="text-xs text-gray-600 truncate" title={`${variant.bedrooms} bed${variant.bedrooms !== 1 ? 's' : ''}`}>
                        {variant.bedrooms}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Bath className="w-4 h-4 flex-shrink-0 text-gray-500" />
                      <span className="text-xs text-gray-600 truncate" title={`${variant.bathrooms} bath${variant.bathrooms !== 1 ? 's' : ''}`}>
                        {variant.bathrooms}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Variant Details */}
      {selectedVariant && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedVariant.name}</h3>

          {/* Image Gallery */}
          {currentImages.length > 0 && (
            <div className="mb-6">
              <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-200 mb-3">
                <img
                  src={getImageUrl(currentImage.url) ?? undefined}
                  alt={currentImage.caption || selectedVariant.name}
                  className="w-full h-full object-cover"
                />

                {/* Image Navigation */}
                {currentImages.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const newIndex = (currentImageIndex - 1 + currentImages.length) % currentImages.length;
                        setImageIndex(selectedVariant.variantId, newIndex);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        const newIndex = (currentImageIndex + 1) % currentImages.length;
                        setImageIndex(selectedVariant.variantId, newIndex);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {currentImages.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setImageIndex(selectedVariant.variantId, idx)}
                          className={`h-2 rounded-full transition-all ${
                            currentImageIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {currentImages.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {currentImages.slice(0, 5).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageIndex(selectedVariant.variantId, idx)}
                      className={`relative h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageIndex === idx
                          ? 'border-heritage-gold shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url) ?? undefined}
                        alt={img.caption || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {selectedVariant.description && (
            <p className="text-gray-700 leading-relaxed mb-4">{selectedVariant.description}</p>
          )}

          {/* Amenities */}
          {selectedVariant.amenities && selectedVariant.amenities.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {selectedVariant.amenities.map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

