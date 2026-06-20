'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Grid3x3 } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface AbodePhotoGalleryProps {
  images: Array<{ url: string; caption?: string; isMain?: boolean }>;
  title: string;
}

export default function AbodePhotoGallery({ images, title }: AbodePhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[2/1] rounded-xl bg-surface-muted flex items-center justify-center">
        <span className="text-text-secondary">No photos available</span>
      </div>
    );
  }

  const displayImages = images.slice(0, 5);
  const mainImage = displayImages[0];
  const sideImages = displayImages.slice(1, 5);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="relative grid grid-cols-4 grid-rows-2 gap-2 h-[300px] sm:h-[400px] rounded-xl overflow-hidden">
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
            className="relative bg-surface-muted hidden sm:block"
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

      <Dialog open={lightboxOpen} onClose={() => setLightboxOpen(false)} size="full" className="max-w-5xl">
        <div className="relative aspect-[4/3] -m-6">
          <Image
            src={getImageUrl(images[lightboxIndex]?.url) || ''}
            alt={images[lightboxIndex]?.caption || title}
            fill
            className="object-contain bg-black"
            sizes="100vw"
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxIndex(idx)}
                className={`w-2 h-2 rounded-full ${lightboxIndex === idx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </div>
      </Dialog>
    </>
  );
}
