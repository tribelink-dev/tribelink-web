'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ExploreHero from './components/ExploreHero';
import ExploreFilterBar, { RefinePrompt } from './components/ExploreFilterBar';
import ExploreGrid from './components/ExploreGrid';
import CategoryIcons from '@/components/CategoryIcons';
import ExperienceDetailModal from '@/components/ExperienceDetailModal';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/imageUtils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Home, Sparkles } from 'lucide-react';
import AuthPromptModal from '@/components/AuthPromptModal';
import { useExploreNavRegistration } from '@/lib/ExploreNavContext';
import { Button } from '@/components/ui/Button';
import ToastContainer, { useToast } from '@/components/Toast';
import type { ListingAbode, ListingExperience } from '@/lib/fetchListings';
import { trackExploreEvent } from '@/lib/explore-analytics';

interface ExplorePageClientProps {
  /** @deprecated SSR seed no longer passed — listings always load client-side */
  initialAbodes?: ListingAbode[];
  initialExperiences?: ListingExperience[];
}

function ExplorePageContent(_props: ExplorePageClientProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toasts, removeToast, error: showError } = useToast();
  const [allAbodes, setAllAbodes] = useState<any[]>([]);
  const [allExperiences, setAllExperiences] = useState<any[]>([]);
  const [loadingAbodes, setLoadingAbodes] = useState(true);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [activeSection, setActiveSection] = useState<'abodes' | 'experiences'>(
    (searchParams.get('section') as 'abodes' | 'experiences') || 'abodes'
  );
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
  
  // Auth Prompt Modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalAction, setAuthModalAction] = useState<'save' | 'book' | 'view'>('save');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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
  const registerExploreNav = useExploreNavRegistration();

  // Prompt panel visibility (opened via compact pill)
  const [showAbodeRefine, setShowAbodeRefine] = useState(false);
  const [showExperienceRefine, setShowExperienceRefine] = useState(false);

  const syncUrl = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.replace(`/explore?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Always fetch full listing from API — SSR seed (initialAbodes) is for SEO only
  useEffect(() => {
    if (searchFilters.location) return;
    if (activeSection === 'abodes') {
      fetchAllAbodes();
    } else if (activeSection === 'experiences') {
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
      const response = await api.get('/user/bucketlist');
      const bucketlist = response.data?.bucketlist || [];
      setBucketlistIds(new Set(bucketlist.map((item: any) => item.experience?._id || item.experience)));
    } catch (error: any) {
      if (error.response?.status !== 401) {
        console.warn('Could not fetch bucketlist:', error.message);
      }
    }
  };

  const handleExperienceClick = (experienceId: string) => {
    trackExploreEvent('explore_listing_click', { listing_type: 'experience', listing_id: experienceId });
    router.push(`/experiences/${experienceId}`);
  };

  const handleAbodeClick = (abode: any) => {
    trackExploreEvent('explore_listing_click', { listing_type: 'abode', listing_id: abode._id });
    router.push(`/adobes/${abode._id}`);
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
        await api.delete(`/user/bucketlist/${experienceId}`);
        setBucketlistIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(experienceId);
          return newSet;
        });
      } else {
        await api.post('/user/bucketlist', { experienceId });
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
      showError(error.response?.data?.message || 'Failed to update bucketlist');
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
  const handleSearch = useCallback((searchParams: {
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
    
    syncUrl({
      location: searchParams.location || undefined,
      checkIn: searchParams.checkIn?.toISOString().split('T')[0],
      checkOut: searchParams.checkOut?.toISOString().split('T')[0],
      guests: searchParams.guests > 1 ? String(searchParams.guests) : undefined,
    });
    
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
  }, [activeSection, syncUrl]);

  // Handle filter changes for abodes (just update state, don't fetch yet)
  const handleAbodeFilterChange = (key: string, value: string) => {
    setAbodeFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply abode filters
  const applyAbodeFilters = () => {
    setAllAbodes([]);
    setAbodesPage(1);
    syncUrl({
      minPrice: abodeFilters.minPrice || undefined,
      maxPrice: abodeFilters.maxPrice || undefined,
      minRating: abodeFilters.minRating || undefined,
      capacity: abodeFilters.capacity || undefined,
    });
    fetchAllAbodes(1, searchFilters);
  };

  // Handle sort changes for abodes
  const handleAbodeSortChange = (sort: string) => {
    setAbodeSort(sort);
    setAllAbodes([]);
    setAbodesPage(1);
    syncUrl({ sort });
    fetchAllAbodes(1, searchFilters);
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
  };

  // Handle filter changes for experiences (just update state, don't fetch yet)
  const handleExperienceFilterChange = (key: string, value: string) => {
    setExperienceFilters(prev => ({ ...prev, [key]: value }));
  };

  // Apply experience filters
  const applyExperienceFilters = () => {
    setAllExperiences([]);
    setExperiencesPage(1);
    syncUrl({
      minPrice: experienceFilters.minPrice || undefined,
      maxPrice: experienceFilters.maxPrice || undefined,
      minRating: experienceFilters.minRating || undefined,
    });
    fetchAllExperiences(1, searchFilters);
  };

  // Handle sort changes for experiences
  const handleExperienceSortChange = (sort: string) => {
    setExperienceSort(sort);
    setAllExperiences([]);
    setExperiencesPage(1);
    syncUrl({ sort });
    fetchAllExperiences(1, searchFilters);
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
  };

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

  const applyAbodeRefine = () => {
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
  };

  const applyExperienceRefine = () => {
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
  };

  const handleSectionChange = useCallback((section: 'abodes' | 'experiences') => {
    setActiveSection(section);
    syncUrl({ section });
  }, [syncUrl]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'abodes' || section === 'experiences') {
      setActiveSection(section);
    }
  }, [searchParams]);

  useEffect(() => {
    registerExploreNav({
      activeSection,
      onSectionChange: handleSectionChange,
    });
    return () => registerExploreNav(null);
  }, [activeSection, handleSectionChange, registerExploreNav]);

  const getAbodeImageUrl = (abode: any) => {
    const mainImage = abode.images?.find((img: any) => img.isMain) || abode.images?.[0];
    return mainImage ? getImageUrl(mainImage.url) : null;
  };

  const getExperienceImageUrl = (exp: any) =>
    exp.imageUrl ? getImageUrl(exp.imageUrl) : null;

  return (
    <div className="min-h-screen bg-background">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <ExploreHero activeSection={activeSection} onSearch={handleSearch} />

      <div id="results-section" className="w-full px-page lg:px-page-lg pt-4 pb-6">
        {activeSection === 'abodes' && (
          <div>
            <ExploreFilterBar
              type="abodes"
              total={abodesPagination.total}
              showing={allAbodes.length}
              sort={abodeSort}
              filters={abodeFilters}
              onFilterChange={handleAbodeFilterChange}
              onApplyFilters={applyAbodeFilters}
              onClearFilters={clearAbodeFilters}
              onSortChange={handleAbodeSortChange}
              showRefine={showAbodeRefine}
              onToggleRefine={() => setShowAbodeRefine((o) => !o)}
              refineApplied={abodePromptApplied}
            />

            <RefinePrompt
              open={showAbodeRefine && allAbodes.length > 0}
              value={abodePrompt}
              applied={abodePromptApplied}
              placeholder="e.g. quiet, near nature, strong Wiâ€‘Fiâ€¦"
              suggestions={['Quiet & nature', 'Strong Wiâ€‘Fi', 'Family-friendly']}
              onChange={setAbodePrompt}
              onApply={applyAbodeRefine}
              onClear={() => {
                setAbodePrompt('');
                setAbodePromptApplied(false);
                setAllAbodes([]);
                setAbodesPage(1);
                fetchAllAbodes(1, searchFilters);
              }}
              title="Refine these stays"
              subtitle="Reorder by vibe â€” dates & location stay the same"
            />

            <ExploreGrid
              type="abodes"
              loading={loadingAbodes}
              abodes={allAbodes}
              getAbodeImageUrl={getAbodeImageUrl}
              getExperienceImageUrl={getExperienceImageUrl}
              onAbodeClick={handleAbodeClick}
              onExperienceClick={handleExperienceClick}
              hasMore={abodesPage < abodesPagination.pages}
              onLoadMore={() => fetchAllAbodes(abodesPage + 1, searchFilters)}
              loadingMore={loadingAbodes}
              emptyTitle="No homestays found"
              emptyDescription="Try adjusting your filters or search in a different area"
              emptyActionLabel="Browse all homestays"
              onEmptyAction={() => router.push('/adobes')}
            />
          </div>
        )}

        {activeSection === 'experiences' && (
          <div>
            <div className="mb-4">
              <CategoryIcons section="experiences" />
            </div>

            <ExploreFilterBar
              type="experiences"
              total={experiencesPagination.total}
              showing={allExperiences.length}
              sort={experienceSort}
              filters={experienceFilters}
              onFilterChange={handleExperienceFilterChange}
              onApplyFilters={applyExperienceFilters}
              onClearFilters={clearExperienceFilters}
              onSortChange={handleExperienceSortChange}
              showRefine={showExperienceRefine}
              onToggleRefine={() => setShowExperienceRefine((o) => !o)}
              refineApplied={experiencePromptApplied}
            />

            <RefinePrompt
              open={showExperienceRefine && allExperiences.length > 0}
              value={experiencePrompt}
              applied={experiencePromptApplied}
              placeholder="e.g. evening music, small groups, cultural workshopsâ€¦"
              suggestions={['Evening events', 'Small groups', 'Cultural workshops']}
              onChange={setExperiencePrompt}
              onApply={applyExperienceRefine}
              onClear={() => {
                setExperiencePrompt('');
                setExperiencePromptApplied(false);
                setAllExperiences([]);
                setExperiencesPage(1);
                fetchAllExperiences(1, searchFilters);
              }}
              title="Refine these experiences"
              subtitle="Reorder by what you want â€” location & filters stay the same"
            />

            <ExploreGrid
              type="experiences"
              loading={loadingExperiences}
              experiences={allExperiences}
              getAbodeImageUrl={getAbodeImageUrl}
              getExperienceImageUrl={getExperienceImageUrl}
              onAbodeClick={handleAbodeClick}
              onExperienceClick={handleExperienceClick}
              onAddToBucketlist={handleAddToBucketlist}
              bucketlistIds={bucketlistIds}
              hasMore={experiencesPage < experiencesPagination.pages}
              onLoadMore={() => fetchAllExperiences(experiencesPage + 1, searchFilters)}
              loadingMore={loadingExperiences}
              emptyTitle="No experiences found"
              emptyDescription="Try adjusting your filters or search in a different area"
              emptyActionLabel="Browse all experiences"
              onEmptyAction={() => router.push('/trips/experiences')}
            />
          </div>
        )}
      </div>

      <section className="w-full px-page lg:px-page-lg py-12">
        <div className="rounded-xl border border-border bg-surface p-8 md:p-12 text-center">
          <Home className="w-10 h-10 text-brand mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Try hosting</h2>
          <p className="text-sm text-text-secondary mb-6 max-w-lg mx-auto">
            Earn extra income by sharing your home and culture with travelers.
          </p>
          <Button variant="outline" onClick={() => router.push('/host/signup')}>
            Learn more
          </Button>
        </div>
      </section>

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
    </div>
  );
}

export default function ExplorePageClient(props: ExplorePageClientProps = {}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background pt-below-nav" />}>
      <ExplorePageContent {...props} />
    </Suspense>
  );
}
