'use client';

import { Home, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExploreSection } from '@/lib/ExploreNavContext';

interface ExploreSectionTabsProps {
  activeSection: ExploreSection;
  onSectionChange: (section: ExploreSection) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export default function ExploreSectionTabs({
  activeSection,
  onSectionChange,
  className,
  size = 'md',
}: ExploreSectionTabsProps) {
  const isSmall = size === 'sm';

  return (
    <div
      className={cn(
        'flex items-center',
        isSmall
          ? 'gap-0.5 p-0.5 rounded-full bg-surface-muted w-full max-w-[280px]'
          : 'gap-1',
        className
      )}
      role="tablist"
      aria-label="Browse category"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'abodes'}
        onClick={() => onSectionChange('abodes')}
        className={cn(
          'flex items-center justify-center gap-1.5 font-semibold transition-colors touch-target',
          isSmall ? 'flex-1 px-3 py-1.5 text-xs rounded-full' : 'px-4 py-2 text-sm rounded-full',
          activeSection === 'abodes'
            ? isSmall
              ? 'bg-surface text-text-primary shadow-sm'
              : 'bg-surface-muted text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted/60'
        )}
      >
        <Home className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Abodes
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'experiences'}
        onClick={() => onSectionChange('experiences')}
        className={cn(
          'flex items-center justify-center gap-1.5 font-semibold transition-colors touch-target',
          isSmall ? 'flex-1 px-3 py-1.5 text-xs rounded-full' : 'px-4 py-2 text-sm rounded-full',
          activeSection === 'experiences'
            ? isSmall
              ? 'bg-surface text-text-primary shadow-sm'
              : 'bg-surface-muted text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted/60'
        )}
      >
        <Sparkles className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Experiences
      </button>
    </div>
  );
}
