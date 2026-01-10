'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import ExperienceDetailModal from '@/components/ExperienceDetailModal';

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  price: number;
  imageUrl?: string;
  contentUrl?: string;
  averageRating: number;
  reviewCount: number;
  provider: {
    name: string;
    rating: number;
  };
  recentReviews?: Review[];
  location?: { state: string; district: string };
  culturalMetadata?: {
    heritage?: string;
    traditions?: string[];
    culturalSignificance?: string;
    authenticityScore?: number;
    experienceType?: string;
    regionalTags?: string[];
  };
  tags?: string[];
  aiFiltered?: boolean;
  matchScore?: number;
  aiReasons?: string[];
  availabilityStatus?: {
    available: boolean;
    reason: string | null;
  };
  experienceSource?: 'HOST_EXPERIENCE' | 'GUIDE_TOUR';
}

export default function ExperiencesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bucketlist, setBucketlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [hasNoTokens, setHasNoTokens] = useState(false);
  const [useAIFiltering, setUseAIFiltering] = useState(false); // Show all experiences by default, user can enable Pathfinder
  const [aiInsights, setAiInsights] = useState<string>('');
  const [totalAvailable, setTotalAvailable] = useState<number>(0);

  const country = searchParams.get('country') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  
  // Parse multiple locations from query params (memoized to prevent infinite loop)
  const locations = useMemo(() => {
    const locs: Array<{ state: string; district: string }> = [];
    let idx = 0;
    while (searchParams.get(`state${idx}`) && searchParams.get(`district${idx}`)) {
      locs.push({
        state: searchParams.get(`state${idx}`) || '',
        district: searchParams.get(`district${idx}`) || ''
      });
      idx++;
    }

    // Fallback to single location if multiple locations not found
    if (locs.length === 0 && searchParams.get('state') && searchParams.get('district')) {
      locs.push({
        state: searchParams.get('state') || '',
        district: searchParams.get('district') || ''
      });
    }
    return locs;
  }, [searchParams]);

  // Create a stable key for locations to use in useEffect
  const locationsKey = useMemo(() => 
    locations.map(l => `${l.state}-${l.district}`).join('|'),
    [locations]
  );

  useEffect(() => {
    if (locations.length > 0) {
      fetchExperiences();
    }
    fetchBucketlist();
    
    // Check tokens when component loads
    const checkTokens = async () => {
      try {
        const response = await api.get('/user/me');
        if (response.data.user) {
          const tokens = response.data.user.tokens || 0;
          setHasNoTokens(tokens === 0);
          
          // Update user in localStorage
          if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.tokens = tokens;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          }
        }
      } catch (err) {
        // If check fails, allow proceed (will be caught at schedule time)
        setHasNoTokens(false);
      }
    };
    
    if (user) {
      checkTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey, country, user]); // Use stable key instead of array

  const fetchExperiences = async (forceAIFiltering?: boolean) => {
    try {
      setLoading(true);
      setError('');
      
      if (locations.length === 0) {
        setError('Please select at least one location');
        setLoading(false);
        return;
      }
      
      // Use the provided value or fall back to state
      const shouldUseAI = forceAIFiltering !== undefined ? forceAIFiltering : useAIFiltering;
      
      // Revolutionary AI-Powered Filtering
      if (shouldUseAI && user) {
        try {
          // Use AI filtering endpoint for each location
          const aiPromises = locations.map(loc =>
            api.get('/trips/experiences/' + encodeURIComponent(loc.district) + '/ai-filtered', {
              params: { country, state: loc.state, from, to }
            })
          );
          
          const aiResponses = await Promise.all(aiPromises);
          
          // Process all responses and collect data
          let totalAvailableCount = 0;
          let firstInsight = '';
          
          const allExperiences = aiResponses.flatMap((response, idx) => {
            const data = response.data;
            // Sum up totalAvailable from all locations
            totalAvailableCount += data.totalAvailable || 0;
            // Use first non-empty insight
            if (data.insights && !firstInsight) {
              firstInsight = data.insights;
            }
            return (data.experiences || []).map((exp: Experience) => ({
              ...exp,
              location: locations[idx],
              aiFiltered: true,
              matchScore: exp.matchScore,
              aiReasons: exp.aiReasons
            }));
          });
          
          // Remove duplicates
          const uniqueExperiences = allExperiences.filter((exp, index, self) =>
            index === self.findIndex(e => e._id === exp._id)
          );
          
          // Set state once after all processing
          setExperiences(uniqueExperiences);
          setTotalAvailable(totalAvailableCount || uniqueExperiences.length);
          if (firstInsight) {
            setAiInsights(firstInsight);
          }
          
          console.log(`[Pathfinder Enabled] Showing ${uniqueExperiences.length} curated experiences from ${totalAvailableCount} available`);
          return;
        } catch (aiErr: any) {
          console.warn('AI filtering failed, falling back to regular:', aiErr);
          // Fall through to regular fetching
        }
      }
      
      // Regular experience fetching - Show ALL available experiences
      // Include date parameters for intelligent scheduling filtering
      const experiencePromises = locations.map(loc =>
        api.get('/trips/experiences/' + encodeURIComponent(loc.district), {
          params: { country, state: loc.state, from, to }
        })
      );
      
      const responses = await Promise.all(experiencePromises);
      
      // Process all responses and calculate total
      let totalAvailableCount = 0;
      const allExperiences = responses.flatMap((response, idx) => {
        const experiences = response.data.experiences || [];
        // Sum up totalAvailable from all location responses
        totalAvailableCount += response.data.totalAvailable || experiences.length;
        return experiences.map((exp: Experience) => ({
          ...exp,
          location: locations[idx],
          aiFiltered: false // Mark as not AI filtered
        }));
      });
      
      // Remove duplicates
      const uniqueExperiences = allExperiences.filter((exp, index, self) =>
        index === self.findIndex(e => e._id === exp._id)
      );
      
      // Set state once after all processing
      setExperiences(uniqueExperiences);
      // Use the sum of all location totals, or fallback to unique count
      setTotalAvailable(totalAvailableCount || uniqueExperiences.length);
      setAiInsights(''); // Clear AI insights when Pathfinder is disabled
      
      console.log(`[Pathfinder Disabled] Showing all ${uniqueExperiences.length} available experiences from ${locations.length} location(s) (total available: ${totalAvailableCount})`);
    } catch (err: any) {
      console.error('Error fetching experiences:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to load experiences';
      setError(errorMessage);
      setExperiences([]);
      setTotalAvailable(0);
      setAiInsights('');
    } finally {
      setLoading(false);
    }
  };

  const fetchBucketlist = async () => {
    try {
      const response = await api.get('/user/bucketlist');
      // Handle both populated and non-populated responses
      const bucketlistIds = response.data.bucketlist?.map((e: any) => {
        // If populated, use _id, otherwise use the ID directly
        return e._id ? e._id.toString() : e.toString();
      }) || [];
      setBucketlist(bucketlistIds);
    } catch (err: any) {
      console.error('Error fetching bucketlist:', err);
      // Bucketlist might be empty or error occurred
      setBucketlist([]);
    }
  };

  const toggleBucketlist = async (experienceId: string) => {
    try {
      setError(''); // Clear any previous errors
      const experienceIdStr = experienceId.toString();
      
      if (bucketlist.includes(experienceIdStr)) {
        const response = await api.delete(`/user/bucketlist/${experienceIdStr}`);
        // Update bucketlist from response or filter locally
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist(bucketlist.filter(id => id.toString() !== experienceIdStr));
        }
      } else {
        const response = await api.post('/user/bucketlist', { experienceId: experienceIdStr });
        // Update bucketlist from response or add locally
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist([...bucketlist, experienceIdStr]);
        }
      }
    } catch (err: any) {
      console.error('Bucketlist error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update bucketlist';
      setError(errorMessage);
      // Refresh bucketlist on error
      fetchBucketlist();
    }
  };

  const handleProceed = () => {
    if (bucketlist.length === 0) {
      setError('Please add at least one experience to your bucketlist');
      return;
    }
    
    // Check if user has tokens
    if (hasNoTokens || (user && (!user.tokens || user.tokens === 0))) {
      setError('You need at least 1 token to schedule a trip. Complete an existing trip payment to earn more tokens!');
      return;
    }
    
    // Route to guide selection page instead of directly to schedule
    router.push('/trips/guides/select');
  };

  const handleOpenReview = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowReviewModal(true);
  };


  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading experiences...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pb-24 md:pb-8">
      <div className="section-container max-w-7xl">
        {/* Token Warning - Show prominently if no tokens */}
        {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🪙</span>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900 mb-2">
                  No Tokens Available
                </h3>
                <p className="text-yellow-800 mb-4">
                  You need at least 1 token to schedule a trip. Complete an existing trip payment to earn 2 tokens and continue planning your adventures!
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        <div className="content-card mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="heading-secondary text-gray-900">
                  {locations.length === 1 
                    ? `Experiences in ${locations[0].district}`
                    : `Experiences across ${locations.length} destinations`}
                </h1>
                {useAIFiltering && user && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>Pathfinder Active</span>
                  </span>
                )}
              </div>
              <p className="text-gray-600 flex items-center gap-2 flex-wrap mb-4">
                <span>📍</span> 
                {locations.length === 1 
                  ? `${country}, ${locations[0].state}`
                  : locations.map(loc => `${loc.district}, ${loc.state}`).join(' • ')}
              </p>
              
              {/* Pathfinder Toggle - Prominent Card with Best UX Practices */}
              {user && (
                <div className="mb-6">
                  <div className={`border-2 rounded-xl p-5 transition-all duration-300 ${
                    useAIFiltering 
                      ? 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-indigo-300 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Icon */}
                        <div className={`flex-shrink-0 transition-all duration-300 ${
                          useAIFiltering ? 'scale-110' : 'scale-100'
                        }`}>
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                            useAIFiltering 
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 ring-2 ring-indigo-200' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-bold text-lg ${
                              useAIFiltering ? 'text-indigo-900' : 'text-gray-900'
                            }`}>
                              {useAIFiltering ? 'Pathfinder AI Active' : 'Pathfinder AI Curation'}
                            </span>
                            {useAIFiltering && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                Active
                              </span>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed mb-2 ${
                            useAIFiltering ? 'text-indigo-800' : 'text-gray-600'
                          }`}>
                            {useAIFiltering 
                              ? `I've curated ${experiences.length} ${experiences.length === 1 ? 'perfect match' : 'perfect matches'} from ${totalAvailable} available options, personalized to your travel profile, booking history, and cultural interests.`
                              : ''
                            }
                          </p>
                          {useAIFiltering && aiInsights && (
                            <div className="mt-3 pt-3 border-t border-indigo-200/60">
                              <p className="text-xs text-indigo-700 leading-relaxed italic">
                                "{aiInsights}"
                              </p>
                            </div>
                          )}
                          {!useAIFiltering && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-md border border-indigo-200">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Personalized
                              </span>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-md border border-purple-200">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Quick
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Toggle Switch - Large and Clear */}
                      <label className="relative flex-shrink-0 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={useAIFiltering}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setUseAIFiltering(newValue);
                            // Clear previous state when toggling
                            setExperiences([]);
                            setAiInsights('');
                            setTotalAvailable(0);
                            // Fetch fresh experiences with the new value
                            setTimeout(() => {
                              fetchExperiences(newValue);
                            }, 100);
                          }}
                          className="sr-only peer"
                          aria-label={useAIFiltering ? 'Disable Pathfinder AI' : 'Enable Pathfinder AI'}
                        />
                        <div className={`w-16 h-9 rounded-full transition-all duration-300 shadow-inner relative ${
                          useAIFiltering 
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                            : 'bg-gray-300 group-hover:bg-gray-400'
                        } peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2`}>
                          <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
                            useAIFiltering ? 'translate-x-7' : 'translate-x-1'
                          }`}>
                            {useAIFiltering && (
                              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <span className={`sr-only ${useAIFiltering ? 'text-indigo-600' : 'text-gray-600'}`}>
                          {useAIFiltering ? 'On' : 'Off'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Status Messages */}
              {!useAIFiltering && experiences.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-semibold text-gray-900 text-sm">All Experiences</span>
                      </div>
                      {from && to ? (() => {
                        const availableCount = experiences.filter(e => e.availabilityStatus?.available !== false).length;
                        const unavailableCount = experiences.length - availableCount;
                        return (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'} found for your selected dates.
                            </p>
                            {unavailableCount > 0 && (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="text-gray-700">{availableCount} available</span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {unavailableCount} unavailable
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })() : (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {experiences.length} {experiences.length === 1 ? 'experience' : 'experiences'} available for your selected {locations.length === 1 ? 'location' : 'locations'}.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="hidden md:flex flex-col items-end gap-2">
              {bucketlist.length > 0 ? (
                <button
                  onClick={handleProceed}
                  disabled={hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
                  className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg overflow-hidden min-w-[200px]"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Content */}
                  <div className="relative flex items-center gap-2.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <div className="flex flex-col items-start">
                      <span className="leading-tight">Continue to Schedule</span>
                      <span className="text-xs font-normal opacity-90">{bucketlist.length} {bucketlist.length === 1 ? 'experience' : 'experiences'} selected</span>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <button
                    disabled
                    className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gray-100 text-gray-500 font-semibold text-sm rounded-xl border-2 border-dashed border-gray-300 cursor-not-allowed min-w-[200px]"
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add Experiences</span>
                    </div>
                  </button>
                  <p className="text-xs text-gray-500 text-right max-w-[200px]">
                    Select experiences from below to continue
                  </p>
                </div>
              )}
              {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
                <div className="mt-1 text-right">
                  <p className="text-xs text-amber-600 font-medium">
                    ⚠️ Tokens required to schedule
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {experiences.length === 0 ? (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">🌴</div>
            <p className="text-xl text-gray-700 mb-2 font-semibold">No experiences available yet</p>
            <p className="text-gray-500">Check back later or try a different location</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences
              .sort((a, b) => {
                // Sort: available experiences first, then unavailable
                const aAvailable = a.availabilityStatus?.available !== false;
                const bAvailable = b.availabilityStatus?.available !== false;
                if (aAvailable === bAvailable) return 0;
                return aAvailable ? -1 : 1;
              })
              .map((experience) => {
              const imageUrl = getImageUrl(experience.imageUrl ?? undefined) ?? undefined;
              const isAvailable = experience.availabilityStatus?.available !== false;
              const hasDateFilter = !!(from && to);
              return (
                <div 
                  key={experience._id} 
                  className={`card-professional overflow-hidden transition-all duration-300 relative ${
                    isAvailable 
                      ? 'card-hover' 
                      : hasDateFilter 
                        ? 'opacity-60' 
                        : 'card-hover'
                  }`}
                >
                  {imageUrl ? (
                    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={experience.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          // Log error for debugging
                          console.error('[Image Load Error]', {
                            experienceId: experience._id,
                            experienceTitle: experience.title,
                            imageUrl: imageUrl,
                            attemptedUrl: e.currentTarget.src
                          });
                          
                          // Hide broken images
                          e.currentTarget.style.display = 'none';
                          // Show placeholder if parent div exists
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full aspect-video bg-gradient-primary flex items-center justify-center"><span class="text-6xl">🎬</span></div>';
                          }
                        }}
                      />
                    </div>
                  ) : experience.contentUrl ? (
                    <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                      <video className="w-full h-full object-contain" controls>
                        <source src={experience.contentUrl} />
                        Your browser does not support video.
                      </video>
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-gradient-primary flex items-center justify-center">
                      <span className="text-6xl">🎬</span>
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h3 className="text-xl font-bold text-gray-900 flex-1">
                        {experience.title}
                      </h3>
                      <div className="flex flex-col items-end gap-1.5">
                        {experience.experienceSource === 'GUIDE_TOUR' && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/60 text-blue-700 text-xs font-semibold rounded-lg shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                            Guided Tour
                          </div>
                        )}
                        {experience.aiFiltered && experience.matchScore && (
                          <div className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold rounded-lg shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {Math.round(experience.matchScore * 100)}% Match
                          </div>
                        )}
                        {hasDateFilter && experience.availabilityStatus && !isAvailable && (
                          <div 
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-gray-100 text-gray-600 border border-gray-200"
                            title="This experience is not available for your selected trip dates"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Unavailable</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(experience.category || experience.subcategory) && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {experience.category && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                            {experience.category}
                          </span>
                        )}
                        {experience.subcategory && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {experience.subcategory}
                          </span>
                        )}
                      </div>
                    )}
                    {experience.culturalMetadata && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {experience.culturalMetadata.heritage && (
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded">
                            🏛️ {experience.culturalMetadata.heritage}
                          </span>
                        )}
                        {experience.culturalMetadata.traditions && experience.culturalMetadata.traditions.length > 0 && (
                          experience.culturalMetadata.traditions.slice(0, 2).map((trad, idx) => (
                            <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                              🎭 {trad}
                            </span>
                          ))
                        )}
                        {experience.culturalMetadata.authenticityScore && experience.culturalMetadata.authenticityScore >= 8 && (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded">
                            ✨ Authentic
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">{experience.description}</p>
                    {experience.aiFiltered && experience.aiReasons && experience.aiReasons.length > 0 && (
                      <div className="mb-3 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/60 rounded-lg text-xs shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-indigo-900 mb-1.5">Why I recommend this:</p>
                            <ul className="space-y-1.5 text-indigo-800">
                              {experience.aiReasons.slice(0, 2).map((reason, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-indigo-500 mt-0.5">•</span>
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{experience.provider.name}</p>
                        <div className="flex items-center gap-2">
                          {experience.averageRating > 0 && (
                            <div className="badge-rating">
                              <span>⭐</span>
                              {experience.averageRating.toFixed(1)}
                              {experience.reviewCount > 0 && (
                                <span className="ml-1 text-xs">({experience.reviewCount})</span>
                              )}
                            </div>
                          )}
                          <div className="badge-rating bg-primary-50 text-primary-700">
                            <span>👤</span>
                            {experience.provider.rating.toFixed(1)} Host
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary-600">
                          ${experience.price}
                        </p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedExperience(experience);
                          setShowDetailModal(true);
                        }}
                        className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      <button
                        onClick={() => toggleBucketlist(experience._id)}
                        disabled={!isAvailable && hasDateFilter}
                        className={`w-full py-3 rounded-xl font-semibold transition-all ${
                          !isAvailable && hasDateFilter
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                            : bucketlist.includes(experience._id.toString())
                            ? 'bg-red-500 text-white hover:bg-red-600 shadow-medium'
                            : 'btn-secondary'
                        }`}
                        title={!isAvailable && hasDateFilter ? 'Not available for selected dates' : ''}
                      >
                        {bucketlist.includes(experience._id.toString()) ? 'Remove from Bucketlist' : 'Add to Bucketlist'}
                      </button>
                      <button
                        onClick={() => handleOpenReview(experience)}
                        className="w-full btn-secondary py-2 text-sm"
                      >
                        {experience.reviewCount > 0 ? 'View Reviews' : 'Be the first to review'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showReviewModal && selectedExperience && (
        <ReviewModal
          experience={selectedExperience}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedExperience(null);
          }}
          onReviewAdded={() => {
            fetchExperiences();
          }}
        />
      )}

      {/* Experience Detail Modal */}
      <ExperienceDetailModal
        experience={selectedExperience}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedExperience(null);
        }}
        onAddToBucketlist={(experienceId) => {
          toggleBucketlist(experienceId);
        }}
        isInBucketlist={selectedExperience ? bucketlist.includes(selectedExperience._id.toString()) : false}
      />

      {/* Sticky Mobile Action Button */}
      {bucketlist.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-2xl p-4">
          <button
            onClick={handleProceed}
            disabled={hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
            className="w-full group relative inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold text-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-lg overflow-hidden"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <div className="flex flex-col items-start">
                <span className="leading-tight">Continue to Schedule</span>
                <span className="text-xs font-normal opacity-90">{bucketlist.length} {bucketlist.length === 1 ? 'experience' : 'experiences'}</span>
              </div>
            </div>
          </button>
          {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
            <p className="mt-2 text-xs text-amber-600 font-medium text-center">
              ⚠️ Tokens required to schedule
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Review Modal Component
function ReviewModal({ 
  experience, 
  onClose, 
  onReviewAdded 
}: { 
  experience: Experience; 
  onClose: () => void;
  onReviewAdded: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState<Review[]>(experience.recentReviews || []);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [experience._id]);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const response = await api.get(`/experiences/${experience._id}`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      // Handle error silently
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post(`/experiences/${experience._id}`, {
        rating,
        comment: comment.trim()
      });

      setComment('');
      setRating(5);
      setShowReviewForm(false);
      await fetchReviews();
      onReviewAdded();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="heading-secondary mb-0">Reviews for {experience.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {showReviewForm ? (
            <form onSubmit={handleSubmitReview} className="mb-6">
              {error && (
                <div className="alert-error mb-4">
                  <span className="text-lg">⚠️</span>
                  <span className="flex-1">{error}</span>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-3xl transition-all ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience..."
                  className="input-field"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn-primary w-full mb-6"
            >
              Write a Review
            </button>
          )}

          {loadingReviews ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No reviews yet</p>
              <p className="text-sm">Be the first to review this experience!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review._id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700 text-sm mt-2">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

