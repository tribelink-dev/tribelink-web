'use client';

import { useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ExploreDifferentiator from './ExploreDifferentiator';
import { EXPLORE_SECTION_COPY } from '@/lib/brand';
import { trackExploreEvent } from '@/lib/explore-analytics';
import { cn } from '@/lib/utils';

interface ExploreHeroProps {
  activeSection: 'abodes' | 'experiences';
  onSearch: (params: {
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
  }) => void;
}

export default function ExploreHero({ activeSection, onSearch }: ExploreHeroProps) {
  const { scrollY } = useScroll();
  const sectionCopy = EXPLORE_SECTION_COPY[activeSection];
  const [stickySearchActive, setStickySearchActive] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setStickySearchActive(latest > 110);
  });

  const heroOpacity = useTransform(scrollY, [0, 280], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 280], [1, 0.98]);

  const searchBarHeroOpacity = useTransform(scrollY, [0, 160], [1, 0]);
  const searchBarHeroY = useTransform(scrollY, [0, 160], [0, -12]);

  const stickySearchBarOpacity = useTransform(scrollY, [120, 200], [0, 1]);
  const stickySearchBarY = useTransform(scrollY, [120, 200], [-6, 0]);

  const handleSearch = (params: {
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
  }) => {
    trackExploreEvent('explore_search_submit', {
      section: activeSection,
      has_location: Boolean(params.location),
      has_dates: Boolean(params.checkIn && params.checkOut),
      guests: params.guests,
    });
    onSearch(params);
  };

  return (
    <>
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="bg-background border-b border-border pt-below-nav-explore lg:pt-below-nav pb-3 lg:pb-5"
      >
        <div className="w-full px-page lg:px-page-lg pt-2 lg:pt-4 flex flex-col items-center text-center">
          <ExploreDifferentiator />

          {activeSection === 'experiences' && (
            <div className="hidden md:block">
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary max-w-2xl">
                {sectionCopy.title}
              </h1>
              <p className="text-sm text-text-secondary mt-1 max-w-xl">{sectionCopy.subtitle}</p>
            </div>
          )}

          <motion.div
            className="w-full max-w-3xl mx-auto mt-3 lg:mt-6"
            style={{
              opacity: searchBarHeroOpacity,
              y: searchBarHeroY,
            }}
            data-analytics="explore-search-hero"
          >
            <SearchBar variant="homepage" onSearch={handleSearch} />
          </motion.div>
        </div>
      </motion.section>

      <motion.div
        className="fixed top-below-nav-explore lg:top-below-nav left-0 right-0 z-40 pointer-events-none"
        style={{
          opacity: stickySearchBarOpacity,
          y: stickySearchBarY,
        }}
        data-analytics="explore-search-sticky"
      >
        <div
          className={cn(
            'bg-background/95 backdrop-blur-md border-b border-border shadow-sm lg:bg-transparent lg:backdrop-blur-none lg:border-b-0 lg:shadow-none',
            stickySearchActive ? 'pointer-events-auto' : 'pointer-events-none'
          )}
        >
          <div className="w-full max-w-3xl mx-auto px-page lg:px-page-lg py-2 lg:pt-3 lg:pb-2">
            <SearchBar variant="navbar" onSearch={handleSearch} />
          </div>
        </div>
      </motion.div>
    </>
  );
}
