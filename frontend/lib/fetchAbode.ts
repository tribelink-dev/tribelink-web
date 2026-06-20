/**
 * Shared server-side abode fetching for SEO, metadata, and SSR
 */

import { isValidObjectId } from './seo';

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
}

export interface AbodeData {
  _id: string;
  abodeDetails: {
    title?: string;
    description: string;
    capacity?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    houseRules?: string[];
    propertyType?: string;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  rating: number;
  ratingCount: number;
  pricing: {
    pricePerNight: number;
    currency: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  isVerified: boolean;
  providerId?: {
    _id: string;
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  culturalPractices?: Array<{ practice: string; description?: string; category: string }>;
  languages?: string[];
  familyInfo?: { familySize?: number; background?: string; generations?: number };
  linkedExperiences?: unknown[];
}

export async function fetchAbodeById(id: string): Promise<{
  abode: AbodeData;
  linkedExperiences: unknown[];
} | null> {
  if (!id || !isValidObjectId(id)) {
    return null;
  }

  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/abodes/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const abode = data.localHost;

    if (!abode || !abode.isVerified) {
      return null;
    }

    return {
      abode,
      linkedExperiences: data.linkedExperiences || [],
    };
  } catch {
    return null;
  }
}
