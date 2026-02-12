'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import SearchBar from '@/components/SearchBar';
import CategoryIcons from '@/components/CategoryIcons';
import ExperienceDetailModal from '@/components/ExperienceDetailModal';
import AbodeDetailModal from '@/components/AbodeDetailModal';
import AbodeCard from '@/components/AbodeCard';
import ExperienceCard from '@/components/ExperienceCard';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/CurrencyContext';
import { Sparkles, Home, Heart, Filter, ArrowDown, TrendingUp, Star, MapPin } from 'lucide-react';
import AuthPromptModal from '@/components/AuthPromptModal';

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
  
  // Search filters
  const [searchFilters, setSearchFilters] = useState<{
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
  }>({
    location: '',
    checkIn: undefined,
    checkOut: undefined,
    guests: 1,
  });
  
  // Experience Modal state
  const [selectedExperience, setSelectedExperience] = useState<any | null>(null);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [loadingExperienceDetails, setLoadingExperienceDetails] = useState(false);
  const [bucketlistIds, setBucketlistIds] = useState<Set<string>>(new Set());
  
  // Abode Modal state
  const [selectedAbode, setSelectedAbode] = useState<any | null>(null);
  const [isAbodeModalOpen, setIsAbodeModalOpen] = useState(false);

  // Auth Prompt Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<'save' | 'book' | 'view'>('save');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Scroll animations
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // Search bar scroll animations - smooth transitions
  const searchBarHeroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const searchBarHeroY = useTransform(scrollY, [0, 200], [0, -20]);
  const searchBarHeroScale = useTransform(scrollY, [0, 200], [1, 0.95]);
  
  // Sticky search bar animations - appears as hero fades
  const stickySearchBarOpacity = useTransform(scrollY, [150, 250], [0, 1]);
  const stickySearchBarY = useTransform(scrollY, [150, 250], [-10, 0]);
  const stickySearchBarScale = useTransform(scrollY, [150, 400], [0.88, 0.95]);
  const stickySearchBarShadow = useTransform(
    scrollY,
    [150, 400],
    ['0 2px 8px rgba(0,0,0,0.08)', '0 8px 24px rgba(0,0,0,0.12)']
  );

  // Fetch all abodes when abodes section is toggled (only if no search filters are active)
  useEffect(() => {
    if (activeSection === 'abodes' && allAbodes.length === 0 && !loadingAbodes && !searchFilters.location) {
      fetchAllAbodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  // Fetch all experiences when experiences section is toggled (only if no search filters are active)
  useEffect(() => {
    if (activeSection === 'experiences' && allExperiences.length === 0 && !loadingExperiences && !searchFilters.location) {
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
      if (error.response?.status !== 401) {
        console.warn('Could not fetch bucketlist:', error.message);
      }
    }
  };

  const handleExperienceClick = async (experienceId: string) => {
    const experience = allExperiences.find(exp => exp._id === experienceId);
    if (experience) {
      setSelectedExperience(experience);
      setIsExperienceModalOpen(true);
    }

    try {
      setLoadingExperienceDetails(true);
      const response = await api.get(`/experiences/${experienceId}`);
      setSelectedExperience(response.data.experience);
    } catch (error: any) {
      console.error('Error fetching experience details:', error);
    } finally {
      setLoadingExperienceDetails(false);
    }
  };

  const handleAbodeClick = (abode: any) => {
    setSelectedAbode(abode);
    setIsAbodeModalOpen(true);
  };

  const handleAbodeBook = () => {
    if (!user) {
      setAuthModalAction('book');
      setPendingAction(() => () => {
        if (selectedAbode) {
          router.push(`/adobes/${selectedAbode._id}`);
        }
      });
      setAuthModalOpen(true);
      return;
    }
    
    if (selectedAbode) {
      router.push(`/adobes/${selectedAbode._id}`);
    }
  };

  const handleAddToBucketlist = async (experienceId: string) => {
    if (!user) {
      setAuthModalAction('save');
      setPendingAction(() => () => {
        // Retry the action after auth - use the stored experienceId
        performAddToBucketlist(experienceId);
      });
      setAuthModalOpen(true);
      return;
    }

    await performAddToBucketlist(experienceId);
  };

  const performAddToBucketlist = async (experienceId: string) => {
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

  const handleAuthModalClose = () => {
    setAuthModalOpen(false);
    setPendingAction(null);
  };

  const handleAuthModalSignIn = () => {
    handleAuthModalClose();
  };

  const handleAuthModalSignUp = () => {
    handleAuthModalClose();
  };

  // Check if user just logged in and execute pending action
  useEffect(() => {
    if (user && pendingAction) {
      // Small delay to ensure auth state is fully updated
      const timer = setTimeout(() => {
        pendingAction();
        setPendingAction(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, pendingAction]);

  // Helper function to parse location string (e.g., "Kerala, India" -> { state: "Kerala", country: "India" })
  const parseLocation = (locationString: string) => {
    if (!locationString) return { state: undefined, district: undefined, country: undefined };
    
    const parts = locationString.split(',').map(part => part.trim());
    if (parts.length >= 2) {
      // Format: "District, State, Country" or "State, Country"
      const country = parts[parts.length - 1];
      const state = parts[parts.length - 2];
      const district = parts.length > 2 ? parts[0] : undefined;
      return { state, district, country };
    } else if (parts.length === 1) {
      // Single part - could be state or district, try state first
      // Don't set country by default - let API handle it with just state
      return { state: parts[0], district: undefined, country: undefined };
    }
    return { state: undefined, district: undefined, country: undefined };
  };

  const fetchAllAbodes = async (page = 1, filters = searchFilters) => {
    try {
      setLoadingAbodes(true);
      
      // Build query params from filters
      const params: any = { 
        limit: 50,
        sort: 'rating',
        page 
      };

      // Parse location
      if (filters.location) {
        const { state, district, country } = parseLocation(filters.location);
        // Only add parameters if they have values
        if (country) params.country = country;
        if (state) params.state = state;
        if (district) params.district = district;
      }

      // Add date filters
      if (filters.checkIn && filters.checkOut) {
        params.availableFrom = filters.checkIn.toISOString();
        params.availableTo = filters.checkOut.toISOString();
      }

      // Add guest capacity filter
      if (filters.guests > 1) {
        params.capacity = filters.guests;
      }

      const abodesRes = await api.get('/abodes', { params });
      
      const abodesData = abodesRes.data || { localHosts: [], pagination: {} };
      
      if (page === 1) {
        setAllAbodes(abodesData.localHosts || []);
      } else {
        setAllAbodes(prev => [...prev, ...(abodesData.localHosts || [])]);
      }
      
      setAbodesPagination({
        total: abodesData.pagination?.total || 0,
        pages: abodesData.pagination?.pages || 1
      });
      setAbodesPage(page);
    } catch (abodesError: any) {
      if (abodesError.response?.status !== 401) {
        console.warn('Could not fetch abodes:', abodesError.message);
      }
      setAllAbodes([]);
    } finally {
      setLoadingAbodes(false);
    }
  };

  // Handle search from SearchBar
  const handleSearch = (searchParams: {
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
  }) => {
    setSearchFilters(searchParams);
    // Clear previous results and refetch with new filters
    setAllAbodes([]);
    setAllExperiences([]);
    setAbodesPage(1);
    setExperiencesPage(1);
    
    if (activeSection === 'abodes') {
      fetchAllAbodes(1, searchParams);
    } else if (activeSection === 'experiences') {
      fetchAllExperiences(1, searchParams);
    }
    
    // Scroll to results section
    setTimeout(() => {
      const resultsSection = document.getElementById('results-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const fetchAllExperiences = async (page = 1, filters = searchFilters) => {
    try {
      setLoadingExperiences(true);
      
      // Build query params from filters
      const params: any = { 
        limit: 50,
        sort: 'rating',
        page 
      };

      // Parse location
      if (filters.location) {
        const { state, district } = parseLocation(filters.location);
        // Only add parameters if they have values
        if (state) params.state = state;
        if (district) params.district = district;
      }
      
      const experiencesRes = await api.get('/experiences', { params });
      
      const experiencesData = experiencesRes.data || { experiences: [], pagination: {} };
      
      // Ensure provider data is properly formatted
      const formattedExperiences = (experiencesData.experiences || []).map((exp: any) => ({
        ...exp,
        provider: exp.provider ? {
          ...exp.provider,
          name: exp.provider.name || 'Experience Host',
          rating: exp.provider.rating || 0,
          ratingCount: exp.provider.ratingCount || 0,
          profilePicture: exp.provider.profilePicture || null
        } : null
      }));
      
      if (page === 1) {
        setAllExperiences(formattedExperiences);
      } else {
        setAllExperiences(prev => [...prev, ...formattedExperiences]);
      }
      
      setExperiencesPagination({
        total: experiencesData.pagination?.total || 0,
        pages: experiencesData.pagination?.pages || 1
      });
      setExperiencesPage(page);
    } catch (experiencesError: any) {
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
      {/* Hero Section - Enhanced */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50/80 to-heritage-gold-light/5 pb-20 pt-32 overflow-hidden"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-20 right-10 w-96 h-96 bg-heritage-gold/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-20 left-10 w-96 h-96 bg-cream-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 z-10">
          {/* Main Heading - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-2xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Your Next
              <span className="block bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold bg-clip-text text-transparent">
                Cultural Adventure
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Immerse yourself in authentic traditions, stay with local families, and create memories that last a lifetime
            </p>
          </motion.div>

          {/* Section Toggle - Above Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center mb-8 relative z-10"
          >
            <div className="inline-flex bg-white/95 backdrop-blur-xl rounded-3xl p-2 shadow-2xl border border-gray-200/50 relative z-10">
              <button
                onClick={() => setActiveSection('abodes')}
                className={`relative px-10 py-5 rounded-2xl font-bold text-base transition-all duration-300 ${
                  activeSection === 'abodes'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {activeSection === 'abodes' && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute inset-0 bg-gradient-to-r from-heritage-gold via-heritage-gold-dark to-heritage-gold rounded-2xl shadow-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Home className="w-5 h-5" />
                  <span>Stay with Local Hosts</span>
                </span>
              </button>
              <button
                onClick={() => setActiveSection('experiences')}
                className={`relative px-10 py-5 rounded-2xl font-bold text-base transition-all duration-300 ${
                  activeSection === 'experiences'
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {activeSection === 'experiences' && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  <span>Book Experiences</span>
                </span>
              </button>
            </div>
          </motion.div>

          {/* Enhanced Search Bar - Hero Position */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-5xl mx-auto relative z-20"
            style={{
              opacity: searchBarHeroOpacity,
              y: searchBarHeroY,
              scale: searchBarHeroScale,
            }}
          >
            <SearchBar variant="homepage" onSearch={handleSearch} />
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex flex-col items-center mt-16"
          >
            <span className="text-sm text-gray-500 mb-2 font-medium">Scroll to explore</span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowDown className="w-6 h-6 text-gray-400" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Sticky Search Bar - Appears Below Navbar on Scroll */}
      <motion.div
        className="fixed top-16 left-0 right-0 z-40 pointer-events-none"
        style={{
          opacity: stickySearchBarOpacity,
          y: stickySearchBarY,
          scale: stickySearchBarScale,
        }}
      >
        <div className="max-w-5xl mx-auto px-6 pt-3 pb-2">
          <div className="pointer-events-auto">
            <SearchBar variant="navbar" onSearch={handleSearch} />
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div id="results-section" className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeSection === 'abodes' && (
            <motion.div
              key="abodes"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
            >
              {/* Header Section - Redesigned */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50/50 to-heritage-gold-light/5 rounded-3xl p-10 md:p-16 mb-12 overflow-hidden border border-heritage-gold/20"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.1),transparent_50%)]"></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                    <div className="flex items-center gap-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-2xl"
                      >
                        <Home className="w-12 h-12 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-3">
                          Stay with Local Hosts
                        </h2>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <TrendingUp className="w-4 h-4 text-heritage-gold" />
                            <span className="text-sm font-semibold text-gray-700">Cultural Immersion</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <Star className="w-4 h-4 text-heritage-gold fill-heritage-gold" />
                            <span className="text-sm font-semibold text-gray-700">Authentic Experience</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Advanced Search - Disabled */}
                    {/* <Link 
                      href="/adobes" 
                      className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-heritage-gold font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl border-2 border-heritage-gold/30 hover:border-heritage-gold"
                    >
                      <span>Advanced Search</span>
                      <motion.svg
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </motion.svg>
                    </Link> */}
                  </div>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl">
                    Experience authentic local life by staying with local families. Understand their traditions, 
                    daily routines, and way of life. Your host can take you to nearby historical and cultural places, 
                    giving you an immersive cultural experience.
                  </p>
                </div>
              </motion.div>

              {/* Category Icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <CategoryIcons section="localHosts" />
              </motion.div>

              {/* Results Section */}
              {loadingAbodes ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-32"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-20 h-20 border-4 border-heritage-gold border-t-transparent rounded-full mb-6"
                    />
                    <p className="text-xl font-semibold text-gray-700 mb-2">Discovering amazing abodes...</p>
                    <p className="text-gray-500">Please wait a moment</p>
                  </div>
                </motion.div>
              ) : allAbodes.length > 0 ? (
                <div className="w-full">
                  {/* Results Header - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4"
                  >
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        All Abodes
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Showing <span className="font-bold text-gray-900">{allAbodes.length}</span> of{' '}
                        <span className="font-bold text-gray-900">{abodesPagination.total}</span> abodes
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md">
                        <Filter className="w-4 h-4" />
                        Filters
                      </button>
                      <button className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Sort
                      </button>
                    </div>
                  </motion.div>
                  
                  {/* Abodes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
                    {allAbodes.map((abode, index) => {
                      const mainImage = abode.images?.find((img: any) => img.isMain) || abode.images?.[0];
                      const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;

                      return (
                        <AbodeCard
                          key={abode._id}
                          abode={abode}
                          imageUrl={imageUrl}
                          index={index}
                          onClick={() => handleAbodeClick(abode)}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Load More Button */}
                  {abodesPage < abodesPagination.pages && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="flex justify-center mt-16"
                    >
                      <motion.button
                        onClick={() => fetchAllAbodes(abodesPage + 1, searchFilters)}
                        disabled={loadingAbodes}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-10 py-5 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark hover:from-heritage-gold-dark hover:to-heritage-gold text-white font-bold text-lg rounded-2xl transition-all shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                      >
                        {loadingAbodes ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Abodes</span>
                            <ArrowDown className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center py-32"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-9xl mb-8 opacity-30"
                    >
                      🏠
                    </motion.div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">No abodes available yet</h3>
                    <p className="text-gray-600 text-lg mb-8">Check back soon for amazing local host stays</p>
                    <button
                      onClick={() => router.push('/adobes')}
                      className="px-8 py-4 bg-heritage-gold hover:bg-heritage-gold-dark text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Browse All Abodes
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeSection === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="w-full"
            >
              {/* Header Section - Redesigned */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative bg-gradient-to-br from-indigo-50/80 via-purple-50/50 to-pink-50/80 rounded-3xl p-10 md:p-16 mb-12 overflow-hidden border border-indigo-200/30"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.1),transparent_50%)]"></div>
                <div className="relative z-10">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
                    <div className="flex items-center gap-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl"
                      >
                        <Sparkles className="w-12 h-12 text-white" />
                      </motion.div>
                      <div>
                        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-3">
                          Book Experiences
                        </h2>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-700">Cultural Activities</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                            <Star className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                            <span className="text-sm font-semibold text-gray-700">Live Events</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Advanced Search - Disabled */}
                    {/* <Link 
                      href="/trips/experiences" 
                      className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl border-2 border-indigo-200 hover:border-indigo-400"
                    >
                      <span>Advanced Search</span>
                      <motion.svg
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </motion.svg>
                    </Link> */}
                  </div>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-4xl">
                    Discover short experiences, live performances, and cultural events organized by local experience providers. 
                    From artisan workshops to live concerts, immerse yourself in authentic cultural activities.
                  </p>
                </div>
              </motion.div>

              {/* Category Icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <CategoryIcons section="experiences" />
              </motion.div>

              {/* Experiences Grid - Optimized */}
              {loadingExperiences ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center py-32"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full mb-6"
                    />
                    <p className="text-xl font-semibold text-gray-700 mb-2">Discovering amazing experiences...</p>
                    <p className="text-gray-500">Please wait a moment</p>
                  </div>
                </motion.div>
              ) : allExperiences.length > 0 ? (
                <div className="w-full">
                  {/* Results Header - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4"
                  >
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        All Experiences
                      </h3>
                      <p className="text-gray-600 text-lg">
                        Showing <span className="font-bold text-gray-900">{allExperiences.length}</span> of{' '}
                        <span className="font-bold text-gray-900">{experiencesPagination.total}</span> experiences
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <Filter className="w-4 h-4" />
                        Filters
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Sort
                      </motion.button>
                    </div>
                  </motion.div>
                  
                  {/* Experiences Grid - Optimized Layout for Best UX */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8 mb-12">
                    {allExperiences.map((experience, index) => {
                      return (
                        <ExperienceCard
                          key={experience._id}
                          experience={experience}
                          index={index}
                          onClick={() => handleExperienceClick(experience._id)}
                          onAddToBucketlist={handleAddToBucketlist}
                          isInBucketlist={bucketlistIds.has(experience._id)}
                        />
                      );
                    })}
                  </div>
                  
                  {experiencesPage < experiencesPagination.pages && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="flex justify-center mt-16"
                    >
                      <motion.button
                        onClick={() => fetchAllExperiences(experiencesPage + 1, searchFilters)}
                        disabled={loadingExperiences}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-lg rounded-2xl transition-all shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                      >
                        {loadingExperiences ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                            />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <>
                            <span>Load More Experiences</span>
                            <ArrowDown className="w-5 h-5" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center py-32"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-9xl mb-8 opacity-30"
                    >
                      🎭
                    </motion.div>
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">No experiences available yet</h3>
                    <p className="text-gray-600 text-lg mb-8">Check back soon for amazing cultural experiences</p>
                    <button
                      onClick={() => router.push('/trips/experiences')}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Browse All Experiences
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={handleAuthModalClose}
        onSignIn={handleAuthModalSignIn}
        onSignUp={handleAuthModalSignUp}
        message={
          authModalAction === 'save'
            ? 'Sign in to save favorites'
            : authModalAction === 'book'
            ? 'Sign in to book this experience'
            : 'Sign in to continue'
        }
        actionType={authModalAction}
      />

      {/* Become a Host Section - Enhanced */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-20"
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="relative bg-gradient-to-r from-heritage-gold/10 via-cream-500/20 to-heritage-gold/10 rounded-3xl p-12 md:p-16 text-center overflow-hidden border border-heritage-gold/20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_70%)]"></div>
          <div className="relative z-10">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-heritage-gold to-heritage-gold-dark flex items-center justify-center shadow-2xl">
                <Home className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Try hosting</h2>
            <p className="text-xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              Earn extra income and unlock new opportunities by sharing your home and culture with travelers.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/host/signup')}
              className="px-10 py-5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-lg rounded-2xl transition-all shadow-2xl hover:shadow-3xl"
            >
              Learn more
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <ExperienceDetailModal
        experience={selectedExperience}
        isOpen={isExperienceModalOpen}
        onClose={() => {
          setIsExperienceModalOpen(false);
          setSelectedExperience(null);
        }}
        onAddToBucketlist={handleAddToBucketlist}
        isInBucketlist={selectedExperience ? bucketlistIds.has(selectedExperience._id) : false}
      />

      <AbodeDetailModal
        abode={selectedAbode}
        isOpen={isAbodeModalOpen}
        onClose={() => {
          setIsAbodeModalOpen(false);
          setSelectedAbode(null);
        }}
        onBook={handleAbodeBook}
      />
    </div>
  );
}
