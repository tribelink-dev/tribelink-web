'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Grid3x3, X } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface AbodePhotoGalleryProps {
  images: Array<{ url: string; caption?: string; isMain?: boolean }>;
  title: string;
}

export default function AbodePhotoGallery({ images, title }: AbodePhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef(0);

  const goTo = useCallback(
    (index: number) => {
      if (!images.length) return;
      const next = Math.max(0, Math.min(images.length - 1, index));
      setActiveIndex(next);
    },
    [images.length]
  );

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent, onSwipe: (direction: 'prev' | 'next') => void) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    onSwipe(diff > 0 ? 'next' : 'prev');
  };

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[4/3] sm:aspect-[2/1] rounded-none sm:rounded-xl bg-surface-muted flex items-center justify-center">
        <span className="text-text-secondary">No photos available</span>
      </div>
    );
  }

  const displayImages = images.slice(0, 5);
  const mainImage = displayImages[0];
  const sideImages = displayImages.slice(1, 5);

  return (
    <>
      {/* Mobile: full-width swipeable carousel */}
      <div className="sm:hidden relative -mx-page">
        <div
          className="relative aspect-[4/3] bg-surface-muted overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) =>
            handleTouchEnd(e, (direction) =>
              goTo(activeIndex + (direction === 'next' ? 1 : -1))
            )
          }
        >
          <button
            type="button"
            onClick={() => openLightbox(activeIndex)}
            className="absolute inset-0"
            aria-label={`View photo ${activeIndex + 1} of ${images.length}`}
          >
            <Image
              src={getImageUrl(images[activeIndex]?.url) || ''}
              alt={images[activeIndex]?.caption || `${title} photo ${activeIndex + 1}`}
              fill
              className="object-cover"
              sizes="100vw"
              priority={activeIndex === 0}
            />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex - 1);
                }}
                disabled={activeIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow-md text-text-primary disabled:opacity-0 transition-opacity"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex + 1);
                }}
                disabled={activeIndex === images.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow-md text-text-primary disabled:opacity-0 transition-opacity"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/55 text-white text-xs font-medium tabular-nums">
                {activeIndex + 1} / {images.length}
              </span>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goTo(idx);
                    }}
                    className={cn(
                      'h-1.5 rounded-full transition-all p-2 -m-2',
                      activeIndex === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                    )}
                    aria-label={`Go to photo ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {images.length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 bg-white/95 shadow-md text-xs"
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(activeIndex);
              }}
            >
              <Grid3x3 className="w-4 h-4" />
              All photos
            </Button>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-page py-3 scrollbar-hide snap-x snap-mandatory">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  'relative shrink-0 w-[4.5rem] h-[4.5rem] rounded-lg overflow-hidden snap-start border-2 transition-colors',
                  activeIndex === i ? 'border-brand' : 'border-transparent opacity-80'
                )}
                aria-label={`Select photo ${i + 1}`}
              >
                <Image
                  src={getImageUrl(img.url) || ''}
                  alt={img.caption || `${title} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Airbnb-style mosaic */}
      <div className="relative hidden sm:grid grid-cols-4 grid-rows-2 gap-2 h-[400px] lg:h-[480px] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className="col-span-2 row-span-2 relative bg-surface-muted"
        >
          <Image
            src={getImageUrl(mainImage.url) || ''}
            alt={mainImage.caption || title}
            fill
            className="object-cover hover:brightness-95 transition-all"
            sizes="50vw"
            priority
          />
        </button>
        {sideImages.map((img, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openLightbox(i + 1)}
            className="relative bg-surface-muted"
          >
            <Image
              src={getImageUrl(img.url) || ''}
              alt={img.caption || `${title} photo ${i + 2}`}
              fill
              className="object-cover hover:brightness-95 transition-all"
              sizes="25vw"
            />
          </button>
        ))}
        {images.length > 1 && (
          <Button
            variant="secondary"
            size="sm"
            className="absolute bottom-4 right-4 bg-white shadow-md"
            onClick={() => openLightbox(0)}
          >
            <Grid3x3 className="w-4 h-4" />
            Show all photos
          </Button>
        )}
      </div>

      {/* Full-screen lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black flex flex-col safe-area-top safe-area-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <span className="text-white text-sm font-medium tabular-nums">
              {lightboxIndex + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="touch-target flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div
            className="relative flex-1 min-h-0"
            onTouchStart={handleTouchStart}
            onTouchEnd={(e) =>
              handleTouchEnd(e, (direction) =>
                setLightboxIndex((prev) =>
                  Math.max(0, Math.min(images.length - 1, prev + (direction === 'next' ? 1 : -1)))
                )
              )
            }
          >
            <Image
              src={getImageUrl(images[lightboxIndex]?.url) || ''}
              alt={images[lightboxIndex]?.caption || title}
              fill
              className="object-contain"
              sizes="100vw"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => Math.max(0, i - 1))}
                  disabled={lightboxIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center w-11 h-11 rounded-full bg-white/15 text-white disabled:opacity-30"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-7 h-7" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((i) => Math.min(images.length - 1, i + 1))}
                  disabled={lightboxIndex === images.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center w-11 h-11 rounded-full bg-white/15 text-white disabled:opacity-30"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-7 h-7" />
                </button>
              </>
            )}
          </div>

          {images[lightboxIndex]?.caption && (
            <p className="shrink-0 px-4 py-3 text-center text-sm text-white/80">
              {images[lightboxIndex].caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
