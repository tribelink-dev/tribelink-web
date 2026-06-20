/**
 * Shared server-side data fetching for SEO and SSR pages.
 * Uses React cache() so layout + page dedupe requests per render.
 */

import { cache } from 'react';
import { isValidObjectId } from './seo';

export const SERVER_FETCH_TIMEOUT_MS = 15000;

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export interface ListingAbode {
  _id: string;
  abodeDetails?: { title?: string; description?: string };
  location?: { district?: string; state?: string; country?: string };
  images?: Array<{ url: string; isMain?: boolean }>;
  rating?: number;
  ratingCount?: number;
  pricing?: { pricePerNight?: number; currency?: string };
  isVerified?: boolean;
  isArchived?: boolean;
}

export interface ListingExperience {
  _id: string;
  title?: string;
  description?: string;
  location?: { district?: string; state?: string; country?: string };
  imageUrl?: string;
  price?: number;
  currency?: string;
  averageRating?: number;
  reviewCount?: number;
  duration?: number;
  provider?: { name?: string };
  isArchived?: boolean;
}

async function fetchPublicAbodesUncached(limit = 12): Promise<ListingAbode[]> {
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/abodes?limit=${limit}&page=1`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.localHosts || []).filter((a: ListingAbode) => !a.isArchived);
  } catch {
    return [];
  }
}

async function fetchPublicExperiencesUncached(limit = 12): Promise<ListingExperience[]> {
  const apiUrl = getApiUrl();

  try {
    const params = new URLSearchParams({ limit: String(limit), page: '1' });
    const response = await fetch(`${apiUrl}/experiences?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.experiences || []).filter((e: ListingExperience) => !e.isArchived);
  } catch {
    return [];
  }
}

export const fetchInitialListings = cache(async () => {
  const [abodes, experiences] = await Promise.all([
    fetchPublicAbodesUncached(12),
    fetchPublicExperiencesUncached(12),
  ]);
  return { abodes, experiences };
});

export async function fetchAllPublicExperiencesForSitemap(): Promise<
  Array<{ id: string; updatedAt?: string }>
> {
  const apiUrl = getApiUrl();
  if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/experiences?limit=1000&page=1`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.experiences || [])
      .filter(
        (exp: { _id?: string; isArchived?: boolean }) =>
          exp._id && isValidObjectId(exp._id) && !exp.isArchived
      )
      .map((exp: { _id: string; updatedAt?: string; createdAt?: string }) => ({
        id: exp._id,
        updatedAt: exp.updatedAt || exp.createdAt,
      }));
  } catch {
    return [];
  }
}
