/**
 * Shared server-side data fetching for SEO and SSR pages
 */

import { isValidObjectId } from './seo';

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
}

export async function fetchPublicAbodes(limit = 12): Promise<ListingAbode[]> {
  const apiUrl = getApiUrl();

  try {
    const response = await fetch(`${apiUrl}/abodes?limit=${limit}&page=1`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.localHosts || []).filter((a: ListingAbode) => a.isVerified !== false);
  } catch {
    return [];
  }
}

export async function fetchPublicExperiences(limit = 12, state = 'Kerala'): Promise<ListingExperience[]> {
  const apiUrl = getApiUrl();

  try {
    const params = new URLSearchParams({ limit: String(limit), page: '1', state });
    const response = await fetch(`${apiUrl}/experiences?${params}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.experiences || [];
  } catch {
    return [];
  }
}

export async function fetchInitialListings() {
  const [abodes, experiences] = await Promise.all([
    fetchPublicAbodes(12),
    fetchPublicExperiences(12, 'Kerala'),
  ]);
  return { abodes, experiences };
}

export async function fetchAllPublicExperiencesForSitemap(): Promise<
  Array<{ id: string; updatedAt?: string }>
> {
  const apiUrl = getApiUrl();
  if (!apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
    return [];
  }

  try {
    const response = await fetch(`${apiUrl}/experiences?state=Kerala&limit=1000&page=1`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.experiences || [])
      .filter((exp: { _id?: string }) => exp._id && isValidObjectId(exp._id))
      .map((exp: { _id: string; updatedAt?: string; createdAt?: string }) => ({
        id: exp._id,
        updatedAt: exp.updatedAt || exp.createdAt,
      }));
  } catch {
    return [];
  }
}
