'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AirbnbSearchBar from '@/components/AirbnbSearchBar';
import CategoryIcons from '@/components/CategoryIcons';
import ExperienceDetailModal from '@/components/ExperienceDetailModal';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/CurrencyContext';

export default function ExplorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [allAbodes, setAllAbodes] = useState<any[]>([]);
  const [allExperiences, setAllExperiences] = useState<any[]>([]);
  const [loadingAbodes, setLoadingAbodes] = useState(false);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [activeSection, setActiveSection] = useState<'abodes' | 'experiences'>('abodes');
  const [abodesPage, setAbodesPage] = useState(1);
  const [abodesPagination, setAbodesPagination] = useState({ total: 0, pages: 1 });
  const [experiencesPage, setExperiencesPage] = useState(1);
  const [experiencesPagination, setExperiencesPagination] = useState({ total: 0, pages: 1 });
  
  // Modal state
  const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingExperienceDetails, setLoadingExperienceDetails] = useState(false);
  const [bucketlistIds, setBucketlistIds] = useState<Set<string>>(new Set());

  // Fetch all abodes when abodes section is toggled
  useEffect(() => {
    if (activeSection === 'abodes' && allAbodes.length === 0 && !loadingAbodes) {
      fetchAllAbodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Fetch all experiences when experiences section is toggled
  useEffect(() => {
    if (activeSection === 'experiences' && allExperiences.length === 0 && !loadingExperiences) {
      fetchAllExperiences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Fetch bucketlist IDs if user is logged in
  useEffect(() => {
    if (user && activeSection === 'experiences') {
      fetchBucketlistIds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeSection]);

  const fetchBucketlistIds = async () => {
    try {
      const response = await api.get('/users/bucketlist');
      const bucketlist = response.data?.bucketlist || [];
      setBucketlistIds(new Set(bucketlist.map((item: any) => item.experience?._id || item.experience)));
    } catch (error: any) {
      // Silently fail - user might not be logged in
      if (error.response?.status !== 401) {
        console.warn('Could not fetch bucketlist:', error.message);
      }
    }
  };

  const handleExperienceClick = async (experienceId: string) => {
    // First, open modal with the experience from the list (if available) for instant feedback
    const experience = allExperiences.find(exp => exp._id === experienceId);
    if (experience) {
      setSelectedExperience(experience);
      setIsModalOpen(true);
    }

    // Then fetch full details in the background
    try {
      setLoadingExperienceDetails(true);
      const response = await api.get(`/experiences/${experienceId}`);
      setSelectedExperience(response.data.experience);
    } catch (error: any) {
      console.error('Error fetching experience details:', error);
      // Keep the modal open with the experience from the list
    } finally {
      setLoadingExperienceDetails(false);
    }
  };

  const handleAddToBucketlist = async (experienceId: string) => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    try {
      const isInBucketlist = bucketlistIds.has(experienceId);
      
      if (isInBucketlist) {
        await api.delete(`/users/bucketlist/${experienceId}`);
        setBucketlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(experienceId);
          return newSet;
        });
      } else {
        await api.post('/users/bucketlist', { experienceId });
        setBucketlistIds(prev => {
          const newSet = new Set(prev);
          newSet.add(experienceId);
          return newSet;
        });
      }

      // Update the selected experience in modal
      if (selectedExperience && selectedExperience._id === experienceId) {
        setSelectedExperience({
          ...selectedExperience,
          isInBucketlist: !isInBucketlist
        });
      }
    } catch (error: any) {
      console.error('Error toggling bucketlist:', error);
      alert(error.response?.data?.message || 'Failed to update bucketlist');
    }
  };

  const fetchAllAbodes = async (page = 1) => {
    try {
      setLoadingAbodes(true);
      
      // Fetch all abodes from the endpoint
      const abodesRes = await api.get('/abodes', { 
        params: { 
          limit: 50, // Load more abodes at once
          sort: 'rating',
          page 
        } 
      });
      
      const abodesData = abodesRes.data || { localHosts: [], pagination: {} };
      
      if (page === 1) {
        setAllAbodes(abodesData.localHosts || []);
      } else {
        // Append for pagination
        setAllAbodes(prev => [...prev, ...(abodesData.localHosts || [])]);
      }
      
      setAbodesPagination({
        total: abodesData.pagination?.total || 0,
        pages: abodesData.pagination?.pages || 1
      });
      setAbodesPage(page);
    } catch (abodesError: any) {
      // Silently handle errors for public pages
      if (abodesError.response?.status !== 401) {
        console.warn('Could not fetch abodes:', abodesError.message);
      }
      setAllAbodes([]);
    } finally {
      setLoadingAbodes(false);
    }
  };

  const fetchAllExperiences = async (page = 1) => {
    try {
      setLoadingExperiences(true);
      
      // Fetch all experiences from the new general endpoint (no limit or higher limit)
      const experiencesRes = await api.get('/experiences', { 
        params: { 
          limit: 50, // Load more experiences at once
          sort: 'rating',
          page 
        } 
      });
      
      const experiencesData = experiencesRes.data || { experiences: [], pagination: {} };
      
      if (page === 1) {
        setAllExperiences(experiencesData.experiences || []);
      } else {
        // Append for pagination
        setAllExperiences(prev => [...prev, ...(experiencesData.experiences || [])]);
      }
      
      setExperiencesPagination({
        total: experiencesData.pagination?.total || 0,
        pages: experiencesData.pagination?.pages || 1
      });
      setExperiencesPage(page);
    } catch (experiencesError: any) {
      // Silently handle errors for public pages
      if (experiencesError.response?.status !== 401) {
        console.warn('Could not fetch experiences:', experiencesError.message);
      }
      setAllExperiences([]);
    } finally {
      setLoadingExperiences(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section with Search */}
      <div className="relative bg-gradient-to-br from-heritage-gold/5 via-cream-50 to-off-white pb-12 pt-32">
        <div className="max-w-7xl mx-auto px-6">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
              Find your next cultural adventure
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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

      {/* Section Toggle with Modern Design */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl p-2 shadow-xl border border-gray-100">
            <button
              onClick={() => setActiveSection('abodes')}
              className={`relative px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeSection === 'abodes'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {activeSection === 'abodes' && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute inset-0 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <span>Stay with Local Hosts</span>
              </span>
            </button>
            <button
              onClick={() => setActiveSection('experiences')}
              className={`relative px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeSection === 'experiences'
                  ? 'text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {activeSection === 'experiences' && (
                <motion.div
                  layoutId="activeSection"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <span className="text-xl">🎭</span>
                <span>Book Experiences</span>
              </span>
            </button>
          </div>
        </div>

        {/* Single Active Section with Smooth Transitions */}
        <AnimatePresence mode="wait">
          {activeSection === 'abodes' && (
            <motion.div
              key="abodes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
            >
              {/* Header Section with Gradient Background */}
              <div className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50 to-heritage-gold-light/10 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-heritage-gold/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cream-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-xl">
                        <span className="text-4xl">🏠</span>
                      </div>
                      <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Stay with Local Hosts</h2>
                        <p className="text-lg text-heritage-gold font-medium">Cultural Immersion Experience</p>
                      </div>
                    </div>
                    <Link 
                      href="/abodes" 
                      className="hidden md:flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-heritage-gold font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl border border-heritage-gold/20"
                    >
                      <span>Advanced Search</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-gray-700 leading-relaxed max-w-3xl text-lg">
                    Experience authentic local life by staying with local families. Understand their traditions, 
                    daily routines, and way of life. Your host can take you to nearby historical and cultural places, 
                    giving you an immersive cultural experience.
                  </p>
                </div>
              </div>

              {/* Category Icons */}
              <div className="mb-10">
                <CategoryIcons section="localHosts" />
              </div>

              {/* All Abodes - Full Width Grid */}
              {loadingAbodes ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-heritage-gold border-t-transparent mb-6"></div>
                    <p className="text-gray-600 text-xl font-medium">Discovering amazing abodes...</p>
                    <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
                  </div>
                </div>
              ) : allAbodes.length > 0 ? (
                <div className="w-full">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">All Abodes</h3>
                      <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{allAbodes.length}</span> of{' '}
                        <span className="font-semibold text-gray-900">{abodesPagination.total}</span> abodes
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Sort
                      </button>
                    </div>
                  </div>
                  
                  {/* Abodes Grid - Full Width */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {allAbodes.map((abode, index) => {
                      const mainImage = abode.images?.find((img: any) => img.isMain) || abode.images?.[0];
                      const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;

                      return (
                        <motion.div
                          key={abode._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => router.push(`/abodes/${abode._id}`)}
                          className="cursor-pointer group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-heritage-gold/30"
                        >
                          <div className="relative h-64 overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={abode.abodeDetails?.description || 'Abode'}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-heritage-gold/20 via-cream-500/30 to-heritage-gold-light/20 flex items-center justify-center">
                                <span className="text-7xl opacity-50">🏠</span>
                              </div>
                            )}
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            
                            {/* Favorite Button */}
                            <div className="absolute top-4 right-4">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle favorite logic
                                }}
                                className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-110"
                              >
                                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </button>
                            </div>
                            
                            {/* Rating Badge */}
                            {abode.rating > 0 && (
                              <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                                <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                                <span className="text-sm font-semibold text-gray-900">{abode.rating.toFixed(1)}</span>
                                {abode.ratingCount > 0 && (
                                  <span className="text-xs text-gray-500">({abode.ratingCount})</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="p-5">
                            <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-heritage-gold transition-colors">
                              {abode.providerId?.name}'s Abode
                            </h4>
                            
                            {/* Property Type */}
                            {abode.abodeDetails?.propertyType && (
                              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-heritage-gold to-cream-500 flex items-center justify-center ring-2 ring-heritage-gold/20">
                                  <span className="text-xs text-white font-semibold">🏠</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {abode.abodeDetails.propertyType}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {abode.abodeDetails.capacity} guests · {abode.abodeDetails.bedrooms} bed · {abode.abodeDetails.bathrooms} bath
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {/* Location */}
                            <p className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span className="line-clamp-1">
                                {abode.location?.district}, {abode.location?.state}
                              </span>
                            </p>
                            
                            {/* Price */}
                            <div className="flex items-baseline justify-between">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  {formatPrice(abode.pricing?.pricePerNight || 0, 'INR')}
                                </p>
                                <p className="text-sm text-gray-500">per night</p>
                              </div>
                              {abode.isVerified && (
                                <span className="px-3 py-1 bg-heritage-gold/10 text-heritage-gold text-xs font-semibold rounded-full flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  Verified
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Load More Button (if pagination available) */}
                  {abodesPage < abodesPagination.pages && (
                    <div className="flex justify-center mt-12">
                      <button
                        onClick={() => fetchAllAbodes(abodesPage + 1)}
                        disabled={loadingAbodes}
                        className="px-8 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark hover:from-heritage-gold-dark hover:to-heritage-gold text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingAbodes ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Abodes</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="text-8xl mb-6 opacity-50">🏠</div>
                    <p className="text-gray-700 text-2xl font-semibold mb-2">No abodes available yet</p>
                    <p className="text-gray-500 text-lg">Check back soon for amazing local host stays</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeSection === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
            >
              {/* Header Section with Gradient Background */}
              <div className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 mb-8 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
                        <span className="text-4xl">🎭</span>
                      </div>
                      <div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Book Experiences</h2>
                        <p className="text-lg text-indigo-600 font-medium">Cultural Activities & Events</p>
                      </div>
                    </div>
                    <Link 
                      href="/trips/experiences" 
                      className="hidden md:flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl border border-indigo-100"
                    >
                      <span>Advanced Search</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Link>
                  </div>
                  <p className="text-gray-700 leading-relaxed max-w-3xl text-lg">
                    Discover short experiences, live performances, and cultural events organized by local experience providers. 
                    From artisan workshops to live concerts, immerse yourself in authentic cultural activities.
                  </p>
                </div>
              </div>

              {/* Category Icons */}
              <div className="mb-10">
                <CategoryIcons section="experiences" />
              </div>

              {/* All Experiences - Full Width Grid */}
              {loadingExperiences ? (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mb-6"></div>
                    <p className="text-gray-600 text-xl font-medium">Discovering amazing experiences...</p>
                    <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
                  </div>
                </div>
              ) : allExperiences.length > 0 ? (
                <div className="w-full">
                  {/* Results Header */}
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-3xl font-bold text-gray-900 mb-1">All Experiences</h3>
                      <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{allExperiences.length}</span> of{' '}
                        <span className="font-semibold text-gray-900">{experiencesPagination.total}</span> experiences
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filters
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Sort
                      </button>
                    </div>
                  </div>
                  
                  {/* Experiences Grid - Full Width */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                      {allExperiences.map((experience, index) => {
                        const imageUrl = getImageUrl(experience.imageUrl);

                        return (
                          <motion.div
                            key={experience._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleExperienceClick(experience._id)}
                            className="cursor-pointer group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200"
                          >
                            <div className="relative h-64 overflow-hidden">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={experience.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
                                  <span className="text-7xl opacity-50">🎭</span>
                                </div>
                              )}
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              {/* Favorite Button */}
                              <div className="absolute top-4 right-4">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Handle favorite logic
                                  }}
                                  className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-110"
                                >
                                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                  </svg>
                                </button>
                              </div>
                              
                              {/* Rating Badge */}
                              {experience.averageRating > 0 && (
                                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                                  <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-900">{experience.averageRating.toFixed(1)}</span>
                                  {experience.reviewCount > 0 && (
                                    <span className="text-xs text-gray-500">({experience.reviewCount})</span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="p-5">
                              <h4 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                                {experience.title}
                              </h4>
                              
                              {/* Host Information */}
                              {experience.provider && (
                                <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                  {experience.provider.profilePicture ? (
                                    <img
                                      src={getImageUrl(experience.provider.profilePicture) || ''}
                                      alt={experience.provider.name}
                                      className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-100">
                                      <span className="text-xs text-white font-semibold">
                                        {experience.provider.name?.charAt(0).toUpperCase() || 'H'}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {experience.provider.name}
                                    </p>
                                    {experience.provider.rating > 0 && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <svg className="w-3 h-3 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                        <span className="text-xs text-gray-600 font-medium">{experience.provider.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Location */}
                              <p className="text-sm text-gray-600 mb-3 flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="line-clamp-1">
                                  {experience.location?.district}, {experience.location?.state}
                                </span>
                              </p>
                              
                              {/* Price */}
                              <div className="flex items-baseline justify-between">
                                <div>
                                  <p className="text-2xl font-bold text-gray-900">
                                    {formatPrice(experience.price, 'USD')}
                                  </p>
                                  <p className="text-sm text-gray-500">per person</p>
                                </div>
                                {experience.category && (
                                  <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                                    {experience.category}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                  
                  {/* Load More Button (if pagination available) */}
                  {experiencesPage < experiencesPagination.pages && (
                    <div className="flex justify-center mt-12">
                      <button
                        onClick={() => fetchAllExperiences(experiencesPage + 1)}
                        disabled={loadingExperiences}
                        className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loadingExperiences ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Experiences</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center py-24">
                  <div className="text-center">
                    <div className="text-8xl mb-6 opacity-50">🎭</div>
                    <p className="text-gray-700 text-2xl font-semibold mb-2">No experiences available yet</p>
                    <p className="text-gray-500 text-lg">Check back soon for amazing cultural experiences</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

      {/* Experience Detail Modal */}
      <ExperienceDetailModal
        experience={selectedExperience}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedExperience(null);
        }}
        onAddToBucketlist={handleAddToBucketlist}
        isInBucketlist={selectedExperience ? bucketlistIds.has(selectedExperience._id) : false}
      />
    </div>
  );
}
