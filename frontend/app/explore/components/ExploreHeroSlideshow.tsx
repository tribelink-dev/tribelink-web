'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPLORE_HERO_SLIDES } from '@/lib/brand';
import { cn } from '@/lib/utils';

const SLIDE_INTERVAL_MS = 5500;

interface ExploreHeroSlideshowProps {
  compact?: boolean;
  immersive?: boolean;
  onOurStoryClick?: () => void;
}

export default function ExploreHeroSlideshow({
  compact = false,
  immersive = false,
  onOurStoryClick,
}: ExploreHeroSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef(0);
  const slides = EXPLORE_HERO_SLIDES;
  const activeSlide = slides[index];

  const goTo = useCallback(
    (next: number) => {
      if (!slides.length) return;
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (!immersive || slides.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [immersive, paused, slides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 40) return;
    goTo(index + (diff > 0 ? 1 : -1));
  };

  if (!slides.length) return null;

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-deep-jungle',
        compact && 'h-24',
        !compact && !immersive && 'h-36 sm:h-40 md:h-44',
        immersive && 'h-[min(58vw,320px)] sm:h-[min(48vw,400px)] md:h-[min(42vh,480px)] lg:h-[min(44vh,520px)]'
      )}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Kerala homestay and cultural life"
    >
      {slides.map((slide, i) => (
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: immersive ? 0.9 : 0.7, ease: 'easeInOut' }}
          aria-hidden={i !== index}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            className="object-cover"
            sizes={immersive ? '100vw' : '(max-width: 768px) 100vw, 896px'}
            priority={i === 0}
          />
        </motion.div>
      ))}

      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          immersive
            ? 'bg-gradient-to-t from-black/80 via-black/35 to-black/15'
            : 'bg-gradient-to-t from-black/55 via-black/20 to-transparent'
        )}
      />

      {immersive && activeSlide && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end px-page lg:px-page-lg pb-10 sm:pb-11 md:pb-12 pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide.src}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl text-left"
            >
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-tight">
                {activeSlide.title}{' '}
                {activeSlide.titleEmphasis ? (
                  <span className="text-brand-light">{activeSlide.titleEmphasis}</span>
                ) : null}
              </h2>
              {activeSlide.subline ? (
                <p className="mt-2 text-sm sm:text-base text-white/90 leading-relaxed">
                  {activeSlide.subline}
                </p>
              ) : null}
              {'showOurStory' in activeSlide && activeSlide.showOurStory ? (
                <Link
                  href="/about"
                  onClick={onOurStoryClick}
                  className="mt-3 inline-block text-sm font-medium text-white/90 hover:text-white underline-offset-2 hover:underline pointer-events-auto"
                >
                  Our story
                </Link>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {slides.length > 1 && (
        <div
          className={cn(
            'absolute left-1/2 z-20 flex -translate-x-1/2 gap-2',
            immersive ? 'bottom-3 sm:bottom-4' : 'bottom-2'
          )}
        >
          {slides.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                'rounded-full transition-all',
                immersive ? 'h-1 sm:h-1.5' : 'h-1.5',
                i === index
                  ? immersive
                    ? 'w-8 sm:w-10 bg-white'
                    : 'w-4 bg-white'
                  : immersive
                    ? 'w-1.5 sm:w-2 bg-white/40 hover:bg-white/65'
                    : 'w-1.5 bg-white/45 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
