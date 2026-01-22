'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AirbnbSearchBar from '@/components/AirbnbSearchBar';
import CategoryIcons from '@/components/CategoryIcons';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import Link from 'next/link';

export default function ExplorePage() {
  const router = useRouter();
  const [featuredAdobes, setFeaturedAdobes] = useState<any[]>([]);
  const [featuredExperiences, setFeaturedExperiences] = useState<any[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      setLoadingFeatured(true);
      
      // Fetch adobes - handle errors gracefully
      let adobesData = { localHosts: [] };
      try {
        const adobesRes = await api.get('/adobes', { params: { limit: 8, sort: 'rating' } });
        adobesData = adobesRes.data || { localHosts: [] };
      } catch (adobesError: any) {
        // Silently handle errors for public pages - don't log to console
        if (adobesError.response?.status !== 401) {
          console.warn('Could not fetch featured adobes:', adobesError.message);
        }
      }

      // Fetch experiences - note: this endpoint may require a district parameter
      // For now, we'll just show adobes if experiences fail
      let experiencesData = { experiences: [] };
      try {
        // Try to fetch experiences from a common district or use a fallback
        // Since /trips/experiences/:district requires a district, we'll skip this for now
        // and only show adobes until we have a general experiences endpoint
        experiencesData = { experiences: [] };
      } catch (experiencesError: any) {
        // Silently handle - experiences endpoint may not be available yet
        if (experiencesError.response?.status !== 401) {
          console.warn('Could not fetch featured experiences:', experiencesError.message);
        }
      }

      setFeaturedAdobes(adobesData.localHosts || []);
      setFeaturedExperiences(experiencesData.experiences || []);
    } catch (error) {
      // Final catch for any unexpected errors
      console.error('Unexpected error fetching featured listings:', error);
    } finally {
      setLoadingFeatured(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-heritage-gold/5 via-cream-50 to-off-white pb-16 pt-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Find your next cultural adventure
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Stay with local families, experience authentic traditions, and discover hidden cultural gems
            </p>
          </motion.div>

          {/* Large Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <AirbnbSearchBar variant="homepage" />
          </motion.div>
        </div>
      </div>

      {/* Category Icons */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <CategoryIcons />
      </div>

      {/* Featured Adobes */}
      {!loadingFeatured && featuredAdobes.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Live anywhere</h2>
            <Link href="/adobes" className="text-sm font-semibold text-gray-900 hover:underline">
              Show all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredAdobes.slice(0, 4).map((adobe, index) => {
              const mainImage = adobe.images?.find((img: any) => img.isMain) || adobe.images?.[0];
              const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;

              return (
                <motion.div
                  key={adobe._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/adobes/${adobe._id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={adobe.adobeDetails?.description || 'Adobe'}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-heritage-gold/20 to-cream-500/30 flex items-center justify-center">
                        <span className="text-6xl">🏠</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {adobe.providerId?.name}'s Adobe
                    </h3>
                    <p className="text-sm text-gray-500">
                      {adobe.location?.district}, {adobe.location?.state}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Experiences */}
      {!loadingFeatured && featuredExperiences.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Try something new</h2>
            <Link href="/trips/experiences" className="text-sm font-semibold text-gray-900 hover:underline">
              Show all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredExperiences.slice(0, 4).map((experience, index) => {
              const imageUrl = getImageUrl(experience.imageUrl);

              return (
                <motion.div
                  key={experience._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => router.push(`/trips/experiences?experienceId=${experience._id}`)}
                  className="cursor-pointer group"
                >
                  <div className="relative h-64 rounded-2xl overflow-hidden mb-3">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={experience.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/30 flex items-center justify-center">
                        <span className="text-6xl">🎭</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {experience.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {experience.location?.district}, {experience.location?.state}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₹{experience.price} <span className="font-normal text-gray-500">per person</span>
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Become a Host Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-heritage-gold/10 to-cream-500/20 rounded-3xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Try hosting</h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Earn extra income and unlock new opportunities by sharing your home and culture with travelers.
          </p>
          <button
            onClick={() => router.push('/host/signup')}
            className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            Learn more
          </button>
        </motion.div>
      </div>
    </div>
  );
}

