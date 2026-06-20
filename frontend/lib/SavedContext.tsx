'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

const LOCAL_SAVED_ABODES_KEY = 'tribelink_saved_abodes';

interface SavedContextValue {
  savedAbodeIds: Set<string>;
  savedExperienceIds: Set<string>;
  isAbodeSaved: (id: string) => boolean;
  isExperienceSaved: (id: string) => boolean;
  toggleAbode: (id: string) => Promise<void>;
  toggleExperience: (id: string, onAddToBucketlist?: (id: string) => void) => Promise<void>;
  loading: boolean;
}

const SavedContext = createContext<SavedContextValue | null>(null);

function loadLocalAbodes(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LOCAL_SAVED_ABODES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveLocalAbodes(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_SAVED_ABODES_KEY, JSON.stringify(Array.from(ids)));
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedAbodeIds, setSavedAbodeIds] = useState<Set<string>>(new Set());
  const [savedExperienceIds, setSavedExperienceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        if (user) {
          const [abodesRes, bucketRes] = await Promise.all([
            api.get('/user/saved-abodes').catch(() => ({ data: { savedAbodes: [] } })),
            api.get('/user/bucketlist').catch(() => ({ data: { bucketlist: [] } })),
          ]);
          setSavedAbodeIds(new Set(abodesRes.data.savedAbodes || []));
          const bucketlist = bucketRes.data.bucketlist || [];
          const expIds = bucketlist.map((e: string | { _id: string }) =>
            typeof e === 'string' ? e : e._id
          );
          setSavedExperienceIds(new Set(expIds));
        } else {
          setSavedAbodeIds(loadLocalAbodes());
          setSavedExperienceIds(new Set());
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [user]);

  const isAbodeSaved = useCallback((id: string) => savedAbodeIds.has(id), [savedAbodeIds]);
  const isExperienceSaved = useCallback(
    (id: string) => savedExperienceIds.has(id),
    [savedExperienceIds]
  );

  const toggleAbode = useCallback(
    async (id: string) => {
      const wasSaved = savedAbodeIds.has(id);
      const next = new Set(savedAbodeIds);
      if (wasSaved) next.delete(id);
      else next.add(id);
      setSavedAbodeIds(next);

      if (user) {
        try {
          if (wasSaved) {
            await api.delete(`/user/saved-abodes/${id}`);
          } else {
            await api.post('/user/saved-abodes', { abodeId: id });
          }
        } catch {
          setSavedAbodeIds(savedAbodeIds);
        }
      } else {
        saveLocalAbodes(next);
      }
    },
    [savedAbodeIds, user]
  );

  const toggleExperience = useCallback(
    async (id: string, onAddToBucketlist?: (id: string) => void) => {
      const wasSaved = savedExperienceIds.has(id);
      const next = new Set(savedExperienceIds);
      if (wasSaved) next.delete(id);
      else next.add(id);
      setSavedExperienceIds(next);

      if (user) {
        try {
          if (wasSaved) {
            await api.delete(`/user/bucketlist/${id}`);
          } else {
            await api.post('/user/bucketlist', { experienceId: id });
          }
        } catch {
          setSavedExperienceIds(savedExperienceIds);
        }
      } else if (onAddToBucketlist) {
        onAddToBucketlist(id);
      }
    },
    [savedExperienceIds, user]
  );

  return (
    <SavedContext.Provider
      value={{
        savedAbodeIds,
        savedExperienceIds,
        isAbodeSaved,
        isExperienceSaved,
        toggleAbode,
        toggleExperience,
        loading,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error('useSaved must be used within SavedProvider');
  }
  return ctx;
}
