'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ExploreSection = 'abodes' | 'experiences';

export type ExploreSearchParams = {
  location: string;
  checkIn: Date | undefined;
  checkOut: Date | undefined;
  guests: number;
};

export type ExploreNavHandlers = {
  activeSection: ExploreSection;
  onSectionChange: (section: ExploreSection) => void;
};

type ExploreNavContextValue = {
  handlers: ExploreNavHandlers | null;
  setHandlers: (handlers: ExploreNavHandlers | null) => void;
};

const ExploreNavContext = createContext<ExploreNavContextValue | null>(null);

export function ExploreNavProvider({ children }: { children: ReactNode }) {
  const [handlers, setHandlersState] = useState<ExploreNavHandlers | null>(null);

  const setHandlers = useCallback((next: ExploreNavHandlers | null) => {
    setHandlersState(next);
  }, []);

  const value = useMemo(
    () => ({ handlers, setHandlers }),
    [handlers, setHandlers]
  );

  return <ExploreNavContext.Provider value={value}>{children}</ExploreNavContext.Provider>;
}

export function useExploreNavOptional() {
  const ctx = useContext(ExploreNavContext);
  return ctx?.handlers ?? null;
}

export function useExploreNavRegistration() {
  const ctx = useContext(ExploreNavContext);
  if (!ctx) {
    throw new Error('useExploreNavRegistration must be used within ExploreNavProvider');
  }
  return ctx.setHandlers;
}
