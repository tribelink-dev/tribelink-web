'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import ExploreHeroSlideshow from './ExploreHeroSlideshow';
import {
  EXPLORE_BELIEF_COLLAPSED_KEY,
  EXPLORE_HERO,
} from '@/lib/brand';
import { trackExploreEvent } from '@/lib/explore-analytics';

export default function ExploreDifferentiator() {
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(EXPLORE_BELIEF_COLLAPSED_KEY);
    if (stored !== null) {
      setCollapsed(stored === 'true');
    } else {
      setCollapsed(window.matchMedia('(max-width: 767px)').matches);
    }
    setReady(true);
    trackExploreEvent('explore_differentiator_view');
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    window.localStorage.setItem(EXPLORE_BELIEF_COLLAPSED_KEY, String(next));
    trackExploreEvent('explore_differentiator_toggle', { collapsed: next });
  };

  if (!ready) {
    return <div className="w-full mb-2 lg:mb-3 h-[min(58vw,320px)] sm:h-[min(48vw,400px)]" aria-hidden />;
  }

  if (collapsed) {
    return (
      <div className="w-full px-page lg:px-page-lg mb-2 lg:mb-3">
        <div
          className="relative z-10 w-full max-w-4xl mx-auto flex items-center justify-between gap-2 rounded-full lg:rounded-xl border border-border bg-surface-muted/60 px-3 py-2 lg:px-4 lg:py-2.5"
          data-analytics="explore-differentiator-collapsed"
        >
          <p className="text-xs sm:text-sm text-text-primary truncate min-w-0">
            <span className="font-medium">{EXPLORE_HERO.headline}</span>{' '}
            <span className="text-brand">{EXPLORE_HERO.headlineEmphasis}</span>
          </p>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="shrink-0 text-xs font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1"
            aria-expanded={false}
          >
            Why us
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-2 lg:mb-3" data-analytics="explore-differentiator">
      <div className="relative w-full">
        <ExploreHeroSlideshow
          immersive
          onOurStoryClick={() => trackExploreEvent('explore_differentiator_our_story_click')}
        />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 rounded-full bg-black/45 backdrop-blur-sm p-2 text-white/90 hover:bg-black/60 transition-colors"
          aria-label="Collapse differentiator"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
