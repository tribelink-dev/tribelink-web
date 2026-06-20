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
import { Sparkles, Home, Heart, Filter, ArrowDown, TrendingUp, Star, MapPin, X, Wand2, RotateCcw, ChevronDown } from 'lucide-react';
import AuthPromptModal from '@/components/AuthPromptModal';

/** Compact section header: one-line title + tagline, with optional "Learn more" expandable copy so listings appear sooner. */
function SectionHeaderCompact({
  icon,
  iconBgClassName,
  title,
  tagline,
  expandableTitle,
  expandableContent,
}: {
  icon: React.ReactNode;
  iconBgClassName: string;
  title: string;
  tagline: string;
  expandableTitle: string;
  expandableContent: string;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl ${iconBgClassName} flex items-center justify-center shadow-lg shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 text-sm md:text-base mt-0.5">{tagline}</p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-heritage-gold/50 hover:text-heritage-gold-dark transition-colors"
        >
          {expanded ? 'Less' : 'Learn more'}
          <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-gray-600 text-sm leading-relaxed max-w-2xl border-l-2 border-heritage-gold/40 pl-4">
              {expandableContent}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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

  // Filter and Sort state
  const [showAbodeFilterDropdown, setShowAbodeFilterDropdown] = useState(false);
  const [showAbodeSortDropdown, setShowAbodeSortDropdown] = useState(false);
  const [showExperienceFilterDropdown, setShowExperienceFilterDropdown] = useState(false);
  const [showExperienceSortDropdown, setShowExperienceSortDropdown] = useState(false);
  
  const [abodeFilters, setAbodeFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: '',
    capacity: '',
  });
  
  const [abodeSort, setAbodeSort] = useState('rating');
  
  const [experienceFilters, setExperienceFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: '',
  });
  
  const [experienceSort, setExperienceSort] = useState('rating');

  // Secondary prompt-based refinement state
  const [abodePrompt, setAbodePrompt] = useState('');
  const [abodePromptApplied, setAbodePromptApplied] = useState(false);
  const [experiencePrompt, setExperiencePrompt] = useState('');
  const [experiencePromptApplied, setExperiencePromptApplied] = useState(false);

  // Prompt panel visibility (opened via compact pill)
  const [showAbodeRefine, setShowAbodeRefine] = useState(false);
  const [showExperienceRefine, setShowExperienceRefine] = useState(false);

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
        sort: abodeSort,
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

      // Add additional filters
      if (abodeFilters.minPrice) params.minPrice = abodeFilters.minPrice;
      if (abodeFilters.maxPrice) params.maxPrice = abodeFilters.maxPrice;
      if (abodeFilters.minRating) params.minRating = abodeFilters.minRating;
      if (abodeFilters.capacity) params.capacity = abodeFilters.capacity;

      const abodesRes = await api.get('/abodes', { params });
      
      const abodesData = abodesRes.data || { localHosts: [], pagination: {} };
      
      // Debug: Log room variants in development
      if (process.env.NODE_ENV === 'development') {
        const abodesWithVariants = (abodesData.localHosts || []).filter((abode: any) => 
          abode.roomVariants && abode.roomVariants.length > 0
        );
        console.log(`[ExplorePage] Fetched ${abodesData.localHosts?.length || 0} abodes, ${abodesWithVariants.length} have room variants`);
        if (abodesWithVariants.length > 0) {
          console.log('[ExplorePage] Abodes with variants:', abodesWithVariants.map((a: any) => ({
            id: a._id,
            title: a.abodeDetails?.title,
            variants: a.roomVariants?.map((v: any) => ({ name: v.name, price: v.pricePerNight }))
          })));
        }
      }
      
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
      setAbodePromptApplied(false);
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

  // Handle filter changes for abodes (just update state, don't fetch yet)
  const handleAbodeFilterChange = (key: string, value: string) => {
    setAbodeFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply abode filters
  const applyAbodeFilters = () => {
    setAllAbodes([]);
    setAbodesPage(1);
    fetchAllAbodes(1, searchFilters);
    setShowAbodeFilterDropdown(false);
  };

  // Handle sort changes for abodes
  const handleAbodeSortChange = (sort: string) => {
    setAbodeSort(sort);
    setAllAbodes([]);
    setAbodesPage(1);
    fetchAllAbodes(1, searchFilters);
    setShowAbodeSortDropdown(false);
  };

  // Clear abode filters
  const clearAbodeFilters = () => {
    setAbodeFilters({
      minPrice: '',
      maxPrice: '',
      minRating: '',
      capacity: '',
    });
    setAllAbodes([]);
    setAbodesPage(1);
    fetchAllAbodes(1, searchFilters);
    setShowAbodeFilterDropdown(false);
  };

  // Handle filter changes for experiences (just update state, don't fetch yet)
  const handleExperienceFilterChange = (key: string, value: string) => {
    setExperienceFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply experience filters
  const applyExperienceFilters = () => {
    setAllExperiences([]);
    setExperiencesPage(1);
    fetchAllExperiences(1, searchFilters);
    setShowExperienceFilterDropdown(false);
  };

  // Handle sort changes for experiences
  const handleExperienceSortChange = (sort: string) => {
    setExperienceSort(sort);
    setAllExperiences([]);
    setExperiencesPage(1);
    fetchAllExperiences(1, searchFilters);
    setShowExperienceSortDropdown(false);
  };

  // Clear experience filters
  const clearExperienceFilters = () => {
    setExperienceFilters({
      minPrice: '',
      maxPrice: '',
      minRating: '',
    });
    setAllExperiences([]);
    setExperiencesPage(1);
    fetchAllExperiences(1, searchFilters);
    setShowExperienceFilterDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown-container') && !target.closest('.sort-dropdown-container')) {
        setShowAbodeFilterDropdown(false);
        setShowAbodeSortDropdown(false);
        setShowExperienceFilterDropdown(false);
        setShowExperienceSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllExperiences = async (page = 1, filters = searchFilters) => {
    try {
      setLoadingExperiences(true);
      
      // Build query params from filters
      const params: any = { 
        limit: 50,
        sort: experienceSort,
        page 
      };

      // Parse location
      if (filters.location) {
        const { state, district } = parseLocation(filters.location);
        // Only add parameters if they have values
        if (state) params.state = state;
        if (district) params.district = district;
      }

      // Add additional filters
      if (experienceFilters.minPrice) params.minPrice = experienceFilters.minPrice;
      if (experienceFilters.maxPrice) params.maxPrice = experienceFilters.maxPrice;
      if (experienceFilters.minRating) params.minRating = experienceFilters.minRating;
      
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
      {(showAbodeFilterDropdown || showAbodeSortDropdown || showExperienceFilterDropdown || showExperienceSortDropdown) && (
        <button
          type="button"
          aria-label="Close filters"
          className="fixed inset-0 z-[75] bg-black/40 md:hidden"
          onClick={() => {
            setShowAbodeFilterDropdown(false);
            setShowAbodeSortDropdown(false);
            setShowExperienceFilterDropdown(false);
            setShowExperienceSortDropdown(false);
          }}
        />
      )}
      {/* Hero Section - Enhanced */}
      <motion.div 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative bg-gradient-to-br from-heritage-gold/10 via-cream-50/80 to-heritage-gold-light/5 pb-12 pt-4 sm:pt-8 overflow-hidden page-offset-nav"
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

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10">
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
            <div className="inline-flex flex-col sm:flex-row w-full sm:w-auto bg-white/95 backdrop-blur-xl rounded-3xl p-2 shadow-2xl border border-gray-200/50 relative z-10">
              <button
                onClick={() => {
                  setActiveSection('abodes');
                  setShowAbodeFilterDropdown(false);
                  setShowAbodeSortDropdown(false);
                  setShowExperienceFilterDropdown(false);
                  setShowExperienceSortDropdown(false);
                }}
                className={`relative px-4 py-3 sm:px-10 sm:py-5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 ${
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
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">Stay with Local Hosts</span>
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveSection('experiences');
                  setShowAbodeFilterDropdown(false);
                  setShowAbodeSortDropdown(false);
                  setShowExperienceFilterDropdown(false);
                  setShowExperienceSortDropdown(false);
                }}
                className={`relative px-4 py-3 sm:px-10 sm:py-5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 ${
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
                <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span className="truncate">Book Experiences</span>
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
            className="flex flex-col items-center mt-10"
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
        className="fixed top-below-nav left-0 right-0 z-40 pointer-events-none"
        style={{
          opacity: stickySearchBarOpacity,
          y: stickySearchBarY,
          scale: stickySearchBarScale,
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-3 pb-2">
          <div className="pointer-events-auto">
            <SearchBar variant="navbar" onSearch={handleSearch} />
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div id="results-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-sos-clear">
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
              {/* Section Header — circle with gold Home icon (same as category style) */}
              <SectionHeaderCompact
                icon={<Home className="w-6 h-6 text-heritage-gold" />}
                iconBgClassName="bg-white border-2 border-heritage-gold/30"
                title="Abodes"
                tagline="Stay with Local Hosts"
                expandableTitle="Why stay with locals?"
                expandableContent="Experience authentic local life by staying with local families. Understand their traditions, daily routines, and way of life. Your host can take you to nearby historical and cultural places, giving you an immersive cultural experience."
              />

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
                    className="flex flex-col gap-4 mb-10"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                          All Abodes
                        </h3>
                        <p className="text-gray-600 text-lg">
                          Showing <span className="font-bold text-gray-900">{allAbodes.length}</span> of{' '}
                          <span className="font-bold text-gray-900">{abodesPagination.total}</span> abodes
                        </p>
                      </div>
                      <div className="flex items-center gap-3 relative">
                        {/* Filter Button and Dropdown */}
                        <div className="filter-dropdown-container relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowAbodeFilterDropdown(!showAbodeFilterDropdown);
                              setShowAbodeSortDropdown(false);
                            }}
                            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md touch-target"
                          >
                            <Filter className="w-4 h-4" />
                            Filters
                          </motion.button>
                          {showAbodeFilterDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mobile-dropdown-panel w-sheet bg-white rounded-xl shadow-2xl border border-gray-200 p-4 md:p-6 z-[80]"
                            >
                              <h4 className="font-bold text-gray-900 mb-4">Filter Abodes</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (₹)</label>
                                  <input
                                    type="number"
                                    value={abodeFilters.minPrice}
                                    onChange={(e) => handleAbodeFilterChange('minPrice', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₹)</label>
                                  <input
                                    type="number"
                                    value={abodeFilters.maxPrice}
                                    onChange={(e) => handleAbodeFilterChange('maxPrice', e.target.value)}
                                    placeholder="10000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={abodeFilters.minRating}
                                    onChange={(e) => handleAbodeFilterChange('minRating', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={abodeFilters.capacity}
                                    onChange={(e) => handleAbodeFilterChange('capacity', e.target.value)}
                                    placeholder="2"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-6">
                                <button
                                  onClick={clearAbodeFilters}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={applyAbodeFilters}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-heritage-gold rounded-lg hover:bg-heritage-gold-dark"
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Sort Button and Dropdown */}
                        <div className="sort-dropdown-container relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowAbodeSortDropdown(!showAbodeSortDropdown);
                              setShowAbodeFilterDropdown(false);
                            }}
                            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md touch-target"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Sort
                          </motion.button>
                          {showAbodeSortDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mobile-dropdown-panel w-sheet-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-[80]"
                            >
                              <h4 className="font-bold text-gray-900 mb-3">Sort By</h4>
                              <div className="space-y-2">
                                {[
                                  { value: 'rating', label: 'Highest Rated' },
                                  { value: 'price', label: 'Price: Low to High' },
                                  { value: 'newest', label: 'Newest First' },
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleAbodeSortChange(option.value)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                                      abodeSort === option.value
                                        ? 'bg-heritage-gold text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                        {/* Compact prompt entry pill */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAbodeRefine((open) => !open)}
                          className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            showAbodeRefine || abodePromptApplied
                              ? 'border-heritage-gold/70 bg-heritage-gold/5 text-heritage-gold-dark'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-heritage-gold/60 hover:bg-heritage-gold/5'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{abodePromptApplied ? 'Refined by prompt' : 'Refine stays'}</span>
                        </motion.button>
                      </div>
                    </div>
                    {/* Refine results — modern card, suggested chips, clear UX */}
                    {showAbodeRefine && allAbodes.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border border-gray-200/90 bg-white/90 backdrop-blur-sm shadow-lg shadow-gray-200/40 p-4 md:p-5 max-w-2xl"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-heritage-gold/10">
                              <Wand2 className="h-4 w-4 text-heritage-gold" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Refine these stays</p>
                              <p className="text-xs text-gray-500">Reorder by vibe — dates & location stay the same</p>
                            </div>
                          </div>
                          {abodePromptApplied && (
                            <AnimatePresence>
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Applied
                              </motion.span>
                            </AnimatePresence>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              value={abodePrompt}
                              onChange={(e) => setAbodePrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (abodePrompt.trim()) document.getElementById('abode-refine-apply')?.click();
                                }
                                if (e.key === 'Escape') setAbodePrompt('');
                              }}
                              placeholder="e.g. quiet, near nature, strong Wi‑Fi…"
                              aria-label="Refine stays by description"
                              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-heritage-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-heritage-gold/20"
                            />
                            {abodePrompt.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setAbodePrompt('')}
                                aria-label="Clear prompt"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <motion.button
                              id="abode-refine-apply"
                              type="button"
                              disabled={!abodePrompt.trim() || allAbodes.length === 0}
                              onClick={() => {
                                const prompt = abodePrompt.toLowerCase().trim();
                                if (!prompt) return;
                                const terms = prompt.split(/\s+/).map((t) => t.trim()).filter(Boolean);
                                const scored = allAbodes.map((abode) => {
                                  let score = 0;
                                  const title = (abode.abodeDetails?.title || '').toLowerCase();
                                  const description = (abode.abodeDetails?.description || '').toLowerCase();
                                  const extraParts: string[] = [];
                                  if (abode.location) {
                                    extraParts.push([abode.location.district, abode.location.state, abode.location.country].filter(Boolean).join(' '));
                                  }
                                  if (Array.isArray(abode.languages)) extraParts.push(abode.languages.join(' '));
                                  const combined = extraParts.join(' ').toLowerCase();
                                  terms.forEach((term) => {
                                    if (!term) return;
                                    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                                    if (regex.test(title)) score += 5;
                                    if (regex.test(description)) score += 3;
                                    if (regex.test(combined)) score += 2;
                                  });
                                  return { abode, score };
                                });
                                scored.sort((a, b) => b.score - a.score);
                                setAllAbodes(scored.map((s) => s.abode));
                                setAbodePromptApplied(true);
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-heritage-gold px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:bg-heritage-gold-dark hover:shadow-lg disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Wand2 className="h-4 w-4" />
                              Apply
                            </motion.button>
                            {abodePromptApplied && (
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                type="button"
                                onClick={() => {
                                  setAbodePrompt('');
                                  setAbodePromptApplied(false);
                                  setAllAbodes([]);
                                  setAbodesPage(1);
                                  fetchAllAbodes(1, searchFilters);
                                }}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Clear
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500">Suggestions:</span>
                          {['Quiet & nature', 'Strong Wi‑Fi', 'Family-friendly'].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setAbodePrompt(label)}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-heritage-gold/50 hover:bg-heritage-gold/5 hover:text-heritage-gold-dark"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
              {/* Compact Section Header — content first */}
              <SectionHeaderCompact
                icon={<Sparkles className="w-6 h-6 text-white" />}
                iconBgClassName="bg-gradient-to-br from-indigo-600 to-purple-600"
                title="Book Experiences"
                tagline="Cultural activities, live events & workshops by local providers."
                expandableTitle="Why book experiences?"
                expandableContent="Discover short experiences, live performances, and cultural events organized by local experience providers. From artisan workshops to live concerts, immerse yourself in authentic cultural activities."
              />

              {/* Category Icons — compact spacing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
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
                    className="flex flex-col gap-4 mb-10"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                          All Experiences
                        </h3>
                        <p className="text-gray-600 text-lg">
                          Showing <span className="font-bold text-gray-900">{allExperiences.length}</span> of{' '}
                          <span className="font-bold text-gray-900">{experiencesPagination.total}</span> experiences
                        </p>
                      </div>
                      <div className="flex items-center gap-3 relative">
                        {/* Filter Button and Dropdown */}
                        <div className="filter-dropdown-container relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowExperienceFilterDropdown(!showExperienceFilterDropdown);
                              setShowExperienceSortDropdown(false);
                            }}
                            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md touch-target"
                          >
                            <Filter className="w-4 h-4" />
                            Filters
                          </motion.button>
                          {showExperienceFilterDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mobile-dropdown-panel w-sheet bg-white rounded-xl shadow-2xl border border-gray-200 p-4 md:p-6 z-[80]"
                            >
                              <h4 className="font-bold text-gray-900 mb-4">Filter Experiences</h4>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (₹)</label>
                                  <input
                                    type="number"
                                    value={experienceFilters.minPrice}
                                    onChange={(e) => handleExperienceFilterChange('minPrice', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (₹)</label>
                                  <input
                                    type="number"
                                    value={experienceFilters.maxPrice}
                                    onChange={(e) => handleExperienceFilterChange('maxPrice', e.target.value)}
                                    placeholder="10000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Rating</label>
                                  <input
                                    type="number"
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    value={experienceFilters.minRating}
                                    onChange={(e) => handleExperienceFilterChange('minRating', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2 mt-6">
                                <button
                                  onClick={clearExperienceFilters}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                  Clear
                                </button>
                                <button
                                  onClick={applyExperienceFilters}
                                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Sort Button and Dropdown */}
                        <div className="sort-dropdown-container relative">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setShowExperienceSortDropdown(!showExperienceSortDropdown);
                              setShowExperienceFilterDropdown(false);
                            }}
                            className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-sm font-semibold text-gray-700 flex items-center gap-2 shadow-sm hover:shadow-md touch-target"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Sort
                          </motion.button>
                          {showExperienceSortDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="mobile-dropdown-panel w-sheet-sm bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-[80]"
                            >
                              <h4 className="font-bold text-gray-900 mb-3">Sort By</h4>
                              <div className="space-y-2">
                                {[
                                  { value: 'rating', label: 'Highest Rated' },
                                  { value: 'price', label: 'Price: Low to High' },
                                  { value: 'newest', label: 'Newest First' },
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    onClick={() => handleExperienceSortChange(option.value)}
                                    className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                                      experienceSort === option.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                        {/* Compact prompt entry pill */}
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowExperienceRefine((open) => !open)}
                          className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                            showExperienceRefine || experiencePromptApplied
                              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{experiencePromptApplied ? 'Refined by prompt' : 'Refine experiences'}</span>
                        </motion.button>
                      </div>
                    </div>
                    {/* Refine experiences — same premium card pattern */}
                    {showExperienceRefine && allExperiences.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-2xl border border-indigo-100 bg-white/90 backdrop-blur-sm shadow-lg shadow-indigo-100/30 p-4 md:p-5 max-w-2xl"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                              <Wand2 className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">Refine these experiences</p>
                              <p className="text-xs text-gray-500">Reorder by what you want — location & filters stay the same</p>
                            </div>
                          </div>
                          {experiencePromptApplied && (
                            <AnimatePresence>
                              <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/60"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Applied
                              </motion.span>
                            </AnimatePresence>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="relative flex-1">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                              <Sparkles className="h-4 w-4" />
                            </span>
                            <input
                              type="text"
                              value={experiencePrompt}
                              onChange={(e) => setExperiencePrompt(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (experiencePrompt.trim()) document.getElementById('experience-refine-apply')?.click();
                                }
                                if (e.key === 'Escape') setExperiencePrompt('');
                              }}
                              placeholder="e.g. evening music, small groups, cultural workshops…"
                              aria-label="Refine experiences by description"
                              className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            {experiencePrompt.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExperiencePrompt('')}
                                aria-label="Clear prompt"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <motion.button
                              id="experience-refine-apply"
                              type="button"
                              disabled={!experiencePrompt.trim() || allExperiences.length === 0}
                              onClick={() => {
                                const prompt = experiencePrompt.toLowerCase().trim();
                                if (!prompt) return;
                                const terms = prompt.split(/\s+/).map((t) => t.trim()).filter(Boolean);
                                const scored = allExperiences.map((exp: any) => {
                                  let score = 0;
                                  const title = (exp.title || '').toLowerCase();
                                  const description = (exp.description || '').toLowerCase();
                                  const extraParts: string[] = [];
                                  if (exp.location) {
                                    extraParts.push([exp.location.district, exp.location.state, exp.location.country].filter(Boolean).join(' '));
                                  }
                                  if (Array.isArray(exp.tags)) extraParts.push(exp.tags.join(' '));
                                  if (exp.culturalMetadata) {
                                    if (exp.culturalMetadata.heritage) extraParts.push(exp.culturalMetadata.heritage);
                                    if (Array.isArray(exp.culturalMetadata.traditions)) extraParts.push(exp.culturalMetadata.traditions.join(' '));
                                    if (exp.culturalMetadata.experienceType) extraParts.push(exp.culturalMetadata.experienceType);
                                  }
                                  const combined = extraParts.join(' ').toLowerCase();
                                  terms.forEach((term) => {
                                    if (!term) return;
                                    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                                    if (regex.test(title)) score += 5;
                                    if (regex.test(description)) score += 3;
                                    if (regex.test(combined)) score += 2;
                                  });
                                  return { exp, score };
                                });
                                scored.sort((a, b) => b.score - a.score);
                                setAllExperiences(scored.map((s) => s.exp));
                                setExperiencePromptApplied(true);
                              }}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-shadow hover:bg-indigo-700 hover:shadow-lg disabled:pointer-events-none disabled:opacity-40"
                            >
                              <Wand2 className="h-4 w-4" />
                              Apply
                            </motion.button>
                            {experiencePromptApplied && (
                              <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                type="button"
                                onClick={() => {
                                  setExperiencePrompt('');
                                  setExperiencePromptApplied(false);
                                  setAllExperiences([]);
                                  setExperiencesPage(1);
                                  fetchAllExperiences(1, searchFilters);
                                }}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Clear
                              </motion.button>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs text-gray-500">Suggestions:</span>
                          {['Evening events', 'Small groups', 'Cultural workshops'].map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setExperiencePrompt(label)}
                              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
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
