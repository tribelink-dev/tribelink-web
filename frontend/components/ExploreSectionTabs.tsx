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
  const tabClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <div className={cn('flex items-center gap-1', className)} role="tablist" aria-label="Browse category">
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'abodes'}
        onClick={() => onSectionChange('abodes')}
        className={cn(
          'flex items-center gap-1.5 font-semibold rounded-full transition-colors',
          tabClass,
          activeSection === 'abodes'
            ? 'bg-surface-muted text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted/60'
        )}
      >
        <Home className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Homestays
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeSection === 'experiences'}
        onClick={() => onSectionChange('experiences')}
        className={cn(
          'flex items-center gap-1.5 font-semibold rounded-full transition-colors',
          tabClass,
          activeSection === 'experiences'
            ? 'bg-surface-muted text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted/60'
        )}
      >
        <Sparkles className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Experiences
      </button>
    </div>
  );
}
