/** Baseline tag for comparing funnel metrics before/after the philosophy-at-top experiment. */
export const EXPLORE_BASELINE_TAG = 'minimal_professional_withoutphilosophyAtTop';

export const EXPLORE_VARIANT = 'with_philosophy_at_top';

type ExploreEventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackExploreEvent(eventName: string, params: ExploreEventParams = {}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  window.gtag('event', eventName, {
    explore_variant: EXPLORE_VARIANT,
    explore_baseline_tag: EXPLORE_BASELINE_TAG,
    ...params,
  });
}
