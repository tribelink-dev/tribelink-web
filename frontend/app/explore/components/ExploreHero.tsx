'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import ExploreDifferentiator from './ExploreDifferentiator';
import { EXPLORE_SECTION_COPY } from '@/lib/brand';
import { trackExploreEvent } from '@/lib/explore-analytics';

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

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  const searchBarHeroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const searchBarHeroY = useTransform(scrollY, [0, 200], [0, -20]);
  const searchBarHeroScale = useTransform(scrollY, [0, 200], [1, 0.95]);

  const stickySearchBarOpacity = useTransform(scrollY, [150, 250], [0, 1]);
  const stickySearchBarY = useTransform(scrollY, [150, 250], [-10, 0]);
  const stickySearchBarScale = useTransform(scrollY, [150, 400], [0.88, 0.95]);

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
        className="bg-background border-b border-border pt-24 lg:pt-below-nav pb-5"
      >
        <div className="w-full px-page lg:px-page-lg pt-4 flex flex-col items-center text-center">
          <ExploreDifferentiator />

          {activeSection === 'experiences' && (
            <>
              <h1 className="text-xl md:text-2xl font-semibold text-text-primary max-w-2xl">
                {sectionCopy.title}
              </h1>
              <p className="text-sm text-text-secondary mt-1 max-w-xl hidden sm:block">
                {sectionCopy.subtitle}
              </p>
            </>
          )}

          <motion.div
            className="w-full max-w-3xl mx-auto mt-4 sm:mt-6"
            style={{
              opacity: searchBarHeroOpacity,
              y: searchBarHeroY,
              scale: searchBarHeroScale,
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
          scale: stickySearchBarScale,
        }}
        data-analytics="explore-search-sticky"
      >
        <div className="w-full max-w-3xl mx-auto px-page lg:px-page-lg pt-3 pb-2">
          <div className="pointer-events-auto">
            <SearchBar variant="navbar" onSearch={handleSearch} />
          </div>
        </div>
      </motion.div>
    </>
  );
}
