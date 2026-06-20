'use client';

import SearchBar from '@/components/SearchBar';

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
  return (
    <section className="bg-background border-b border-border pt-24 lg:pt-below-nav pb-8">
      <div className="w-full px-page lg:px-page-lg pt-4 flex flex-col items-center text-center">
        <h1 className="text-2xl md:text-3xl font-semibold text-text-primary max-w-2xl">
          {activeSection === 'abodes'
            ? 'Discover family homestays'
            : 'Discover cultural experiences'}
        </h1>
        <p className="text-sm md:text-base text-text-secondary mt-1 max-w-xl">
          {activeSection === 'abodes'
            ? 'Stay with local families and immerse yourself in authentic traditions'
            : 'Book hands-on activities led by local hosts and communities'}
        </p>

        <div className="w-full max-w-3xl mx-auto mt-6">
          <SearchBar variant="homepage" onSearch={onSearch} />
        </div>
      </div>
    </section>
  );
}
