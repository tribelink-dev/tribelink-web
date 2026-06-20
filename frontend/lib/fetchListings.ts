/**
 * Shared server-side data fetching for SEO and SSR pages.
 * Uses React cache() so layout + page dedupe requests per render.
 */

import { cache } from 'react';
import { isValidObjectId } from './seo';
import { getServerFetchHeaders } from './serverApi';

export const SERVER_FETCH_TIMEOUT_MS = 15000;
const SITEMAP_PAGE_LIMIT = 50;
const MAX_SITEMAP_PAGES = 100;

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

function isProductionApiUrl(apiUrl: string): boolean {
  return Boolean(apiUrl) && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');
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
  updatedAt?: string;
  createdAt?: string;
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
  updatedAt?: string;
  createdAt?: string;
}

async function fetchPublicAbodesUncached(limit = 12): Promise<ListingAbode[]> {
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/abodes?limit=${limit}&page=1`, {
      headers: getServerFetchHeaders(),
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
      headers: getServerFetchHeaders(),
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

async function fetchAllPublicAbodesPaginated(): Promise<ListingAbode[]> {
  const apiUrl = getApiUrl();
  if (!isProductionApiUrl(apiUrl)) {
    return [];
  }

  const all: ListingAbode[] = [];
  let page = 1;

  try {
    while (page <= MAX_SITEMAP_PAGES) {
      const response = await fetch(
        `${apiUrl}/abodes?limit=${SITEMAP_PAGE_LIMIT}&page=${page}`,
        {
          headers: getServerFetchHeaders(),
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
        }
      );

      if (!response.ok) break;

      const data = await response.json();
      const batch = (data.localHosts || []).filter((a: ListingAbode) => !a.isArchived);
      if (batch.length === 0) break;

      all.push(...batch);

      const totalPages = data.pagination?.pages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }
  } catch {
    return all;
  }

  return all;
}

async function fetchAllPublicExperiencesPaginated(): Promise<ListingExperience[]> {
  const apiUrl = getApiUrl();
  if (!isProductionApiUrl(apiUrl)) {
    return [];
  }

  const all: ListingExperience[] = [];
  let page = 1;

  try {
    while (page <= MAX_SITEMAP_PAGES) {
      const params = new URLSearchParams({
        limit: String(SITEMAP_PAGE_LIMIT),
        page: String(page),
      });
      const response = await fetch(`${apiUrl}/experiences?${params}`, {
        headers: getServerFetchHeaders(),
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) break;

      const data = await response.json();
      const batch = (data.experiences || []).filter((e: ListingExperience) => !e.isArchived);
      if (batch.length === 0) break;

      all.push(...batch);

      const totalPages = data.pagination?.pages ?? 1;
      if (page >= totalPages) break;
      page += 1;
    }
  } catch {
    return all;
  }

  return all;
}

export const fetchInitialListings = cache(async () => {
  const [abodes, experiences] = await Promise.all([
    fetchPublicAbodesUncached(12),
    fetchPublicExperiencesUncached(12),
  ]);
  return { abodes, experiences };
});

export async function fetchAllPublicAbodesForSitemap(): Promise<
  Array<{ id: string; updatedAt?: string }>
> {
  const abodes = await fetchAllPublicAbodesPaginated();

  return abodes
    .filter((abode) => abode._id && isValidObjectId(abode._id))
    .map((abode) => ({
      id: abode._id,
      updatedAt: abode.updatedAt || abode.createdAt,
    }));
}

export async function fetchAllPublicExperiencesForSitemap(): Promise<
  Array<{ id: string; updatedAt?: string }>
> {
  const experiences = await fetchAllPublicExperiencesPaginated();

  return experiences
    .filter((exp) => exp._id && isValidObjectId(exp._id))
    .map((exp) => ({
      id: exp._id,
      updatedAt: exp.updatedAt || exp.createdAt,
    }));
}
