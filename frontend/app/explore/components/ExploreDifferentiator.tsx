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
    setCollapsed(stored === 'true');
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
    return <div className="w-full max-w-4xl mx-auto mb-4 sm:mb-5" aria-hidden />;
  }

  if (collapsed) {
    return (
      <div
        className="w-full max-w-4xl mx-auto mb-4 sm:mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-2.5"
        data-analytics="explore-differentiator-collapsed"
      >
        <p className="text-sm text-text-primary truncate">
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
    );
  }

  return (
    <div
      className="w-full max-w-4xl mx-auto mb-5 sm:mb-6"
      data-analytics="explore-differentiator"
    >
      <div className="rounded-2xl border border-border bg-surface overflow-hidden relative">
        <ExploreHeroSlideshow />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="absolute top-2.5 right-2.5 z-20 rounded-full bg-black/40 p-1.5 text-white/90 hover:bg-black/55 transition-colors"
          aria-label="Collapse differentiator"
        >
          <ChevronUp className="w-4 h-4" />
        </button>

        <div className="px-4 sm:px-5 py-4 sm:py-5 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-text-primary leading-tight max-w-2xl mx-auto">
            {EXPLORE_HERO.headline}{' '}
            <span className="text-brand">{EXPLORE_HERO.headlineEmphasis}</span>
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-text-primary max-w-2xl mx-auto leading-relaxed">
            {EXPLORE_HERO.subline}
          </p>
          <p className="mt-2 text-sm sm:text-base text-text-primary max-w-2xl mx-auto leading-relaxed">
            {EXPLORE_HERO.description}
          </p>
          <p className="mt-2 text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {EXPLORE_HERO.tagline}
          </p>

          <div className="mt-3 sm:mt-4 hidden sm:flex flex-wrap items-center justify-center gap-2">
            {EXPLORE_HERO.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-[11px] sm:text-xs text-text-secondary"
              >
                {chip}
              </span>
            ))}
          </div>

          <Link
            href="/about"
            onClick={() => trackExploreEvent('explore_differentiator_our_story_click')}
            className="mt-3 inline-block text-xs sm:text-sm font-medium text-brand hover:text-brand-hover underline-offset-2 hover:underline"
          >
            Our story
          </Link>
        </div>
      </div>
    </div>
  );
}
