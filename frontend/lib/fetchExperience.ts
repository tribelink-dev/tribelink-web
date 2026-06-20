/**
 * Shared server-side experience fetching for SEO, metadata, and SSR
 */

import { isValidObjectId } from './seo';

const SERVER_FETCH_TIMEOUT_MS = 15000;

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export interface ExperienceData {
  _id: string;
  title: string;
  description: string;
  location?: {
    country?: string;
    state?: string;
    district?: string;
    address?: string;
  };
  imageUrl?: string;
  price: number;
  currency?: string;
  duration?: number;
  maxParticipants?: number;
  averageRating?: number;
  reviewCount?: number;
  category?: string;
  isArchived?: boolean;
  provider?: {
    _id?: string;
    name: string;
    rating?: number;
    ratingCount?: number;
    profilePicture?: string;
  };
}

export async function fetchExperienceById(id: string): Promise<ExperienceData | null> {
  if (!id || !isValidObjectId(id)) {
    return null;
  }

  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/experiences/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const experience = data.experience;

    if (!experience || experience.isArchived) {
      return null;
    }

    return experience;
  } catch {
    return null;
  }
}
