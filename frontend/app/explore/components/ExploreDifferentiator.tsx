'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
      // Mobile: collapsed by default so search + listings are above the fold
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
    return <div className="w-full max-w-4xl mx-auto mb-2 lg:mb-5" aria-hidden />;
  }

  if (collapsed) {
    return (
      <div
        className="relative z-10 w-full max-w-4xl mx-auto mb-2 lg:mb-5 rounded-2xl lg:rounded-xl border border-border bg-surface-muted/60 px-3 py-2.5 lg:px-4 lg:py-2.5"
        data-analytics="explore-differentiator-collapsed"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-text-primary text-left leading-snug min-w-0 flex-1">
            <span className="font-medium">{EXPLORE_HERO.headline}</span>{' '}
            <span className="text-brand">{EXPLORE_HERO.headlineEmphasis}</span>
          </p>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="shrink-0 text-xs font-medium text-text-secondary hover:text-text-primary inline-flex items-center gap-1 pt-0.5 touch-target"
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
    <div
      className="w-full max-w-4xl mx-auto mb-3 lg:mb-6"
      data-analytics="explore-differentiator"
    >
      <div className="rounded-2xl border border-border bg-surface overflow-hidden relative">
        <div className="hidden md:block">
          <ExploreHeroSlideshow />
        </div>
        <div className="md:hidden">
          <ExploreHeroSlideshow compact />
        </div>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute top-2.5 right-2.5 z-20 rounded-full bg-black/40 p-1.5 text-white/90 hover:bg-black/55 transition-colors"
          aria-label="Collapse differentiator"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <div className="px-3 sm:px-5 py-3 sm:py-4 text-center">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-semibold text-text-primary leading-snug max-w-2xl mx-auto">
            {EXPLORE_HERO.headline}{' '}
            <span className="text-brand">{EXPLORE_HERO.headlineEmphasis}</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-text-primary max-w-2xl mx-auto leading-relaxed">
            {EXPLORE_HERO.body}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {EXPLORE_HERO.tagline}
          </p>

          <Link
            href="/about"
            onClick={() => trackExploreEvent('explore_differentiator_our_story_click')}
            className="mt-3 inline-block text-sm font-medium text-brand hover:text-brand-hover underline-offset-2 hover:underline touch-target"
          >
            Our story
          </Link>
        </div>
      </div>
    </div>
  );
}
