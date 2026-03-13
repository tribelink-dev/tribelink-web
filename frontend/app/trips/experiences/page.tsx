'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCurrency } from '@/lib/CurrencyContext';
import { getImageUrl } from '@/lib/imageUtils';
import ExperienceDetailModal from '@/components/ExperienceDetailModal';
import ReviewModal from '@/components/ReviewModal';
import { DISTRICTS_BY_STATE } from '@/lib/indianStates';

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
  const { formatPrice } = useCurrency();
  const searchParams = useSearchParams();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bucketlist, setBucketlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [hasNoTokens, setHasNoTokens] = useState(false);
  const [useAIFiltering, setUseAIFiltering] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [totalAvailable, setTotalAvailable] = useState<number>(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPromptApplied, setAiPromptApplied] = useState(false);

  const enablePromptRefine =
    process.env.NEXT_PUBLIC_ENABLE_EXPERIENCE_PROMPT_REFINE !== 'false';

  const country = searchParams.get('country') || '';
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  
  // Parse multiple locations from query params
  const locations = useMemo(() => {
    const locs: Array<{ state: string; district: string }> = [];
    let idx = 0;
    while (searchParams.get(`state${idx}`)) {
      const state = searchParams.get(`state${idx}`) || '';
      const district = searchParams.get(`district${idx}`) || '';
      
      if (state && !district) {
        const districts = DISTRICTS_BY_STATE[state] || [];
        if (districts.length > 0) {
          districts.forEach(dist => {
            locs.push({ state, district: dist });
          });
        } else {
          locs.push({ state, district: '' });
        }
      } else if (state && district) {
        locs.push({ state, district });
      }
      idx++;
    }

    if (locs.length === 0) {
      const state = searchParams.get('state') || '';
      const district = searchParams.get('district') || '';
      
      if (state) {
        if (!district) {
          const districts = DISTRICTS_BY_STATE[state] || [];
          if (districts.length > 0) {
            districts.forEach(dist => {
              locs.push({ state, district: dist });
            });
          } else {
            locs.push({ state, district: '' });
          }
        } else {
          locs.push({ state, district });
        }
      }
    }
    return locs;
  }, [searchParams]);

  const locationsKey = useMemo(() => 
    locations.map(l => `${l.state}-${l.district}`).join('|'),
    [locations]
  );

  useEffect(() => {
    setBucketlist([]);
    if (user) {
      fetchBucketlist();
    }
  }, [user?.id]);

  useEffect(() => {
    if (locations.length > 0) {
      fetchExperiences();
    }
    if (user) {
      fetchBucketlist();
    }
    
    const checkTokens = async () => {
      try {
        const response = await api.get('/user/me');
        if (response.data.user) {
          const tokens = response.data.user.tokens || 0;
          setHasNoTokens(tokens === 0);
          
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
        setHasNoTokens(false);
      }
    };
    
    if (user) {
      checkTokens();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationsKey, country, user]);

  const fetchExperiences = async (forceAIFiltering?: boolean, refinePrompt?: string) => {
    try {
      setLoading(true);
      setError('');
      
      if (locations.length === 0) {
        setError('Please select at least one location');
        setLoading(false);
        return;
      }
      
      const shouldUseAI = forceAIFiltering !== undefined ? forceAIFiltering : useAIFiltering;
      
      if (shouldUseAI && user) {
        try {
          const validLocations = locations.filter(loc => loc.district);
          const promptToUse = (refinePrompt || '').trim();
          const aiPromises = validLocations.map(loc =>
            api.post(
              '/trips/experiences/' + encodeURIComponent(loc.district) + '/ai-refine',
              {
                country,
                state: loc.state,
                from,
                to,
                prompt: promptToUse || undefined
              }
            )
          );
          
          const aiResponses = await Promise.all(aiPromises);
          
          let totalAvailableCount = 0;
          let firstInsight = '';
          
          const allExperiences = aiResponses.flatMap((response, idx) => {
            const data = response.data;
            totalAvailableCount += data.totalAvailable || 0;
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
          
          const uniqueExperiences = allExperiences.filter((exp, index, self) =>
            index === self.findIndex(e => e._id === exp._id)
          );
          
          setExperiences(uniqueExperiences);
          setTotalAvailable(totalAvailableCount || uniqueExperiences.length);
          if (firstInsight) {
            setAiInsights(firstInsight);
          }
          setAiPromptApplied(!!promptToUse);
          
          return;
        } catch (aiErr: unknown) {
          console.warn('AI filtering failed, falling back to regular:', aiErr);
          setAiPromptApplied(false);
        }
      }
      
      const validLocations = locations.filter(loc => loc.district);
      const experiencePromises = validLocations.map(loc =>
        api.get('/trips/experiences/' + encodeURIComponent(loc.district), {
          params: { country, state: loc.state, from, to }
        })
      );
      
      const responses = await Promise.all(experiencePromises);
      
      let totalAvailableCount = 0;
      const allExperiences = responses.flatMap((response, idx) => {
        const experiences = response.data.experiences || [];
        totalAvailableCount += response.data.totalAvailable || experiences.length;
        return experiences.map((exp: Experience) => ({
          ...exp,
          location: locations[idx],
          aiFiltered: false
        }));
      });
      
      const uniqueExperiences = allExperiences.filter((exp, index, self) =>
        index === self.findIndex(e => e._id === exp._id)
      );
      
      setExperiences(uniqueExperiences);
      setTotalAvailable(totalAvailableCount || uniqueExperiences.length);
      setAiInsights('');
      setAiPromptApplied(false);
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
      const bucketlistRaw = response.data.bucketlist as Array<string | { _id: string }> | undefined;
      const bucketlistIds =
        bucketlistRaw?.map((entry) =>
          typeof entry === 'string' ? entry : entry._id?.toString()
        ) || [];
      setBucketlist(bucketlistIds);
    } catch (err: unknown) {
      console.error('Error fetching bucketlist:', err);
      setBucketlist([]);
    }
  };

  const toggleBucketlist = async (experienceId: string) => {
    if (!user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    try {
      setError('');
      const experienceIdStr = experienceId.toString();
      
      if (bucketlist.includes(experienceIdStr)) {
        const response = await api.delete(`/user/bucketlist/${experienceIdStr}`);
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist(bucketlist.filter(id => id.toString() !== experienceIdStr));
        }
      } else {
        const response = await api.post('/user/bucketlist', { experienceId: experienceIdStr });
        if (response.data.bucketlist) {
          setBucketlist(response.data.bucketlist);
        } else {
          setBucketlist([...bucketlist, experienceIdStr]);
        }
      }
    } catch (err: any) {
      console.error('Bucketlist error:', err);
      // If error is due to authentication, redirect to login
      if (err.response?.status === 401 || err.response?.status === 403) {
        const currentPath = window.location.pathname + window.location.search;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }
      const errorMessage = err.response?.data?.message || 'Failed to update bucketlist';
      setError(errorMessage);
      fetchBucketlist();
    }
  };

  const handleProceed = () => {
    if (bucketlist.length === 0) {
      setError('Please add at least one experience to your bucketlist');
      return;
    }
    
    if (hasNoTokens || (user && (!user.tokens || user.tokens === 0))) {
      setError('You need at least 1 token to schedule a trip. Complete an existing trip payment to earn more tokens!');
      return;
    }
    
    router.push('/trips/guides/select');
  };

  const handleOpenReview = (experience: Experience) => {
    setSelectedExperience(experience);
    setShowReviewModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
          <div className="text-xl font-semibold text-slate-700">Discovering amazing experiences...</div>
          <div className="text-sm text-slate-500 mt-2">Please wait a moment</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {locations.length === 1 
                    ? `Experiences in ${locations[0].district}`
                    : `${experiences.length} Experiences Across ${locations.length} Destinations`}
                </h1>
                {useAIFiltering && user && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/30">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span>AI Curated</span>
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-lg flex items-center gap-2 flex-wrap">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {locations.length === 1 
                  ? `${country}, ${locations[0].state}`
                  : locations.map(loc => `${loc.district}, ${loc.state}`).join(' • ')}
              </p>
            </div>
            
            {/* CTA Button */}
            {bucketlist.length > 0 && (
              <button
                onClick={handleProceed}
                disabled={hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
                className="group relative px-8 py-4 bg-white text-blue-600 font-bold text-base rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-100 min-w-[220px]"
              >
                <div className="flex items-center justify-center gap-3">
                  <span>Continue with {bucketlist.length} {bucketlist.length === 1 ? 'experience' : 'experiences'}</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Warning */}
        {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
          <div className="bg-amber-50 border-l-4 border-amber-400 rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Tokens Required</h3>
                <p className="text-amber-800 mb-4">
                  You need at least 1 token to schedule a trip. Complete an existing trip payment to earn more tokens!
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* AI Filtering Toggle */}
        {user && (
          <div className="mb-8">
            <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 ${
              useAIFiltering 
                ? 'border-indigo-300 shadow-indigo-100' 
                : 'border-slate-200 hover:border-slate-300'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                    useAIFiltering 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg' 
                      : 'bg-slate-200'
                  }`}>
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-bold ${
                        useAIFiltering ? 'text-indigo-900' : 'text-slate-900'
                      }`}>
                        AI Pathfinder
                      </h3>
                      {useAIFiltering && (
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-sm leading-relaxed ${
                        useAIFiltering ? 'text-indigo-700' : 'text-slate-600'
                      }`}
                    >
                      {useAIFiltering
                        ? `Curated ${experiences.length} personalized matches from ${totalAvailable} available experiences`
                        : 'Get AI-powered personalized recommendations based on your preferences'}
                    </p>
                    {useAIFiltering && aiInsights && (
                      <p className="text-xs text-indigo-600 italic mt-2">"{aiInsights}"</p>
                    )}
                    {useAIFiltering && enablePromptRefine && (
                      <div className="mt-4 space-y-2">
                        <label className="block text-xs font-semibold text-slate-700">
                          Refine these AI picks with a prompt{' '}
                          <span className="font-normal text-slate-500">
                            (optional, e.g. “more kid-friendly, avoid late nights”)
                          </span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="Describe what you have in mind..."
                            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!aiPrompt.trim()) {
                                setAiPromptApplied(false);
                                fetchExperiences(true, '');
                                return;
                              }
                              fetchExperiences(true, aiPrompt);
                            }}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                          >
                            Apply prompt
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAIFiltering}
                    onChange={(e) => {
                      const newValue = e.target.checked;
                      setUseAIFiltering(newValue);
                      setExperiences([]);
                      setAiInsights('');
                      setTotalAvailable(0);
                      setTimeout(() => {
                        fetchExperiences(newValue);
                      }, 100);
                    }}
                    className="sr-only peer"
                  />
                  <div className={`w-14 h-7 rounded-full transition-all duration-300 ${
                    useAIFiltering 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600' 
                      : 'bg-slate-300'
                  } peer-focus:ring-4 peer-focus:ring-indigo-300`}>
                    <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${
                      useAIFiltering ? 'translate-x-7' : 'translate-x-0'
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {experiences.length > 0 && (
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-slate-600">
                <span className="font-semibold text-slate-900">{experiences.length}</span>{' '}
                {experiences.length === 1 ? 'experience' : 'experiences'} found
                {from && to && (
                  <span className="ml-2 text-sm">
                    for{' '}
                    {new Date(from).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    -{' '}
                    {new Date(to).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
            {useAIFiltering && enablePromptRefine && aiPromptApplied && (
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                    AI refine on
                  </span>
                  <span className="text-slate-500">
                    Matching your prompt:{' '}
                    <span className="italic text-slate-700">
                      “
                      {aiPrompt.length > 80
                        ? `${aiPrompt.slice(0, 77)}...`
                        : aiPrompt}
                      ”
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiPrompt('');
                    setAiPromptApplied(false);
                    if (useAIFiltering) {
                      fetchExperiences(true, '');
                    }
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline underline-offset-2"
                >
                  Reset AI refine
                </button>
              </div>
            )}
          </div>
        )}

        {/* Experiences Grid */}
        {experiences.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="text-7xl mb-6">🌴</div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No experiences found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search or check back later</p>
            <button
              onClick={() => router.push('/trips/select')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Search Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {experiences
              .sort((a, b) => {
                const aAvailable = a.availabilityStatus?.available !== false;
                const bAvailable = b.availabilityStatus?.available !== false;
                if (aAvailable === bAvailable) return 0;
                return aAvailable ? -1 : 1;
              })
              .map((experience) => {
              const imageUrl = getImageUrl(experience.imageUrl ?? undefined) ?? undefined;
              const isAvailable = experience.availabilityStatus?.available !== false;
              const hasDateFilter = !!(from && to);
              const isInBucketlist = bucketlist.includes(experience._id.toString());
              
              return (
                <div 
                  key={experience._id} 
                  className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-300 transform hover:-translate-y-1"
                >
                  {/* Image Section */}
                  <div className="relative w-full h-56 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={experience.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><span class="text-5xl">🎬</span></div>';
                          }
                        }}
                      />
                    ) : experience.contentUrl ? (
                      <video className="w-full h-full object-cover" controls>
                        <source src={experience.contentUrl} />
                      </video>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <span className="text-5xl">🎬</span>
                      </div>
                    )}
                    
                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      {experience.experienceSource === 'GUIDE_TOUR' && (
                        <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-lg backdrop-blur-sm bg-opacity-95">
                          Guided Tour
                        </span>
                      )}
                      {experience.aiFiltered && experience.matchScore && (
                        <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-lg backdrop-blur-sm bg-opacity-95">
                          {Math.round(experience.matchScore * 100)}% Match
                        </span>
                      )}
                      {hasDateFilter && !isAvailable && (
                        <span className="px-3 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg shadow-lg backdrop-blur-sm bg-opacity-95">
                          Unavailable
                        </span>
                      )}
                    </div>

                    {/* Heart Icon for Bucketlist */}
                    <button
                      onClick={() => toggleBucketlist(experience._id)}
                      disabled={!isAvailable && hasDateFilter}
                      className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
                        isInBucketlist
                          ? 'bg-red-500 text-white shadow-lg'
                          : 'bg-white/90 text-slate-600 hover:bg-white hover:scale-110'
                      } ${!isAvailable && hasDateFilter ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <svg className="w-5 h-5" fill={isInBucketlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {experience.title}
                    </h3>

                    {/* Category Tags */}
                    {(experience.category || experience.subcategory) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {experience.category && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            {experience.category}
                          </span>
                        )}
                        {experience.subcategory && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                            {experience.subcategory}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                      {experience.description}
                    </p>

                    {/* AI Reasons */}
                    {experience.aiFiltered && experience.aiReasons && experience.aiReasons.length > 0 && (
                      <div className="mb-4 p-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                        <p className="text-xs font-semibold text-indigo-900 mb-1.5">Why we recommend this:</p>
                        <ul className="space-y-1 text-xs text-indigo-800">
                          {experience.aiReasons.slice(0, 2).map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-indigo-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Rating and Provider */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        {experience.averageRating > 0 && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-bold text-slate-900">{experience.averageRating.toFixed(1)}</span>
                            {experience.reviewCount > 0 && (
                              <span className="text-sm text-slate-500">({experience.reviewCount})</span>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-slate-600">
                          by <span className="font-semibold text-slate-900">{experience.provider.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {formatPrice(experience.price, 'USD')}
                        </div>
                        <div className="text-xs text-slate-500">per person</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      <button
                        onClick={() => {
                          setSelectedExperience(experience);
                          setShowDetailModal(true);
                        }}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-100"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => toggleBucketlist(experience._id)}
                        disabled={!isAvailable && hasDateFilter}
                        className={`w-full px-4 py-2.5 font-semibold rounded-lg transition-all duration-200 ${
                          !isAvailable && hasDateFilter
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : isInBucketlist
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-red-200'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                        }`}
                      >
                        {isInBucketlist ? 'Remove from List' : 'Add to List'}
                      </button>
                      {experience.reviewCount > 0 && (
                        <button
                          onClick={() => handleOpenReview(experience)}
                          className="w-full px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium"
                        >
                          View {experience.reviewCount} {experience.reviewCount === 1 ? 'Review' : 'Reviews'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showReviewModal && selectedExperience && (
        <ReviewModal
          experience={selectedExperience}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedExperience(null);
          }}
          onReviewAdded={() => {
            fetchExperiences();
          }}
        />
      )}

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

      {/* Mobile Sticky CTA */}
      {bucketlist.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t-2 border-slate-200 shadow-2xl p-4">
          <button
            onClick={handleProceed}
            disabled={hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-base rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with {bucketlist.length} {bucketlist.length === 1 ? 'experience' : 'experiences'}
          </button>
        </div>
      )}
    </div>
  );
}
