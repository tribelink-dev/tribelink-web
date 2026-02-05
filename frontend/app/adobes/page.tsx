'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import { DISTRICTS_BY_STATE, INDIAN_STATES } from '@/lib/indianStates';
import { motion } from 'framer-motion';
import ListingCard from '@/components/ListingCard';

interface LocalHost {
  _id: string;
  abodeDetails: {
    description: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    propertyType: string;
  };
  culturalPractices: Array<{
    practice: string;
    description?: string;
    category: string;
  }>;
  nearbyPlaces: Array<{
    name: string;
    description?: string;
    distance: number;
    significance: string;
  }>;
  pricing: {
    pricePerNight: number;
    currency: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  languages: string[];
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  providerId: {
    name: string;
    profilePicture?: string;
  };
}

export default function AbodesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [abodes, setAbodes] = useState<LocalHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    state: searchParams.get('state') || '',
    district: searchParams.get('district') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    capacity: searchParams.get('capacity') || '',
    availableFrom: searchParams.get('availableFrom') || '',
    availableTo: searchParams.get('availableTo') || '',
    sort: searchParams.get('sort') || 'rating',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchAbodes();
  }, [filters, pagination.page]);

  const fetchAbodes = async () => {
    try {
      setLoading(true);
      setError('');

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort,
      };

      if (filters.state) params.state = filters.state;
      if (filters.district) params.district = filters.district;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.minRating) params.minRating = filters.minRating;
      if (filters.capacity) params.capacity = filters.capacity;
      if (filters.availableFrom) params.availableFrom = filters.availableFrom;
      if (filters.availableTo) params.availableTo = filters.availableTo;

      const response = await api.get('/abodes', { params });
      setAbodes(response.data.localHosts || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0,
      }));
    } catch (err: any) {
      console.error('Error fetching abodes:', err);
      setError(err.response?.data?.message || 'Failed to load abodes');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      state: '',
      district: '',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      capacity: '',
      availableFrom: '',
      availableTo: '',
      sort: 'rating',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const districts = useMemo(() => {
    return filters.state ? DISTRICTS_BY_STATE[filters.state] || [] : [];
  }, [filters.state]);

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-16">
      <div className="section-container-luxury">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h1 className="text-display-lg font-serif text-charcoal-700 mb-4">
            Experience Abodes
          </h1>
          <p className="text-lg text-charcoal-600 max-w-3xl">
            Stay with local families and immerse yourself in authentic cultural experiences. 
            Discover traditional practices, explore nearby cultural sites, and create meaningful connections.
          </p>
        </motion.div>

        {/* Filters Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-luxury p-6 mb-8 border border-charcoal-100"
        >
          <div className="flex flex-wrap items-end gap-4">
            {/* State */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                State
              </label>
              <select
                value={filters.state}
                onChange={(e) => {
                  handleFilterChange('state', e.target.value);
                  handleFilterChange('district', ''); // Reset district when state changes
                }}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
              >
                <option value="">All States</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* District */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                District
              </label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                disabled={!filters.state || districts.length === 0}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all disabled:bg-charcoal-50 disabled:cursor-not-allowed"
              >
                <option value="">All Districts</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex gap-2 min-w-[200px]">
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="₹0"
                  className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="₹10000"
                  className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
                />
              </div>
            </div>

            {/* Capacity */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Guests
              </label>
              <input
                type="number"
                value={filters.capacity}
                onChange={(e) => handleFilterChange('capacity', e.target.value)}
                placeholder="2"
                min="1"
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
              />
            </div>

            {/* Sort */}
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-charcoal-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Price: Low to High</option>
                <option value="newest">Newest First</option>
              </select>
            </div>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 text-sm font-medium text-charcoal-600 hover:text-charcoal-800 border border-charcoal-200 hover:border-charcoal-300 rounded-lg transition-all"
            >
              Clear
            </button>
          </div>
        </motion.div>

        {/* Results */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden animate-pulse">
                <div className="h-64 bg-charcoal-200"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-charcoal-200 rounded w-3/4"></div>
                  <div className="h-4 bg-charcoal-200 rounded w-full"></div>
                  <div className="h-4 bg-charcoal-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : abodes.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-2xl font-semibold text-charcoal-700 mb-2">
              No abodes found
            </h3>
            <p className="text-charcoal-600 mb-6">
              Try adjusting your filters to see more results.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-heritage-gold text-white font-medium rounded-lg hover:bg-heritage-gold-dark transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 text-charcoal-600">
              Found <span className="font-semibold text-charcoal-700">{pagination.total}</span> abodes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {abodes.map((abode, index) => {
                const mainImage = abode.images.find(img => img.isMain) || abode.images[0];
                const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;

                return (
                  <ListingCard
                    key={abode._id}
                    id={abode._id}
                    imageUrl={imageUrl}
                    location={`${abode.location.district}, ${abode.location.state}`}
                    title={`${abode.providerId.name}'s Abode`}
                    subtitle={abode.abodeDetails.propertyType}
                    rating={abode.rating}
                    ratingCount={abode.ratingCount}
                    price={abode.pricing.pricePerNight}
                    priceLabel="night"
                    onClick={() => router.push(`/abodes/${abode._id}`)}
                    index={index}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-charcoal-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-charcoal-50 transition-all"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-charcoal-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              className="px-4 py-2 border border-charcoal-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-charcoal-50 transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


