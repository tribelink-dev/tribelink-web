'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
  provider: {
    name: string;
    rating: number;
  };
  matchScore?: number;
  aiReasons?: string[];
  location?: {
    state: string;
    district: string;
  };
}

interface Location {
  state: string;
  district: string;
}

export default function AutomaticPlanningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState('');
  const [selectedExperiences, setSelectedExperiences] = useState<Experience[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    // Parse query parameters
    const countryParam = searchParams.get('country') || 'India';
    const fromParam = searchParams.get('from') || '';
    const toParam = searchParams.get('to') || '';
    
    setCountry(countryParam);
    setFromDate(fromParam);
    setToDate(toParam);

    // Parse multiple locations
    const locs: Location[] = [];
    let idx = 0;
    while (searchParams.get(`state${idx}`) && searchParams.get(`district${idx}`)) {
      locs.push({
        state: searchParams.get(`state${idx}`) || '',
        district: searchParams.get(`district${idx}`) || ''
      });
      idx++;
    }

    // Fallback to single location
    if (locs.length === 0 && searchParams.get('state') && searchParams.get('district')) {
      locs.push({
        state: searchParams.get('state') || '',
        district: searchParams.get('district') || ''
      });
    }

    setLocations(locs);

    if (locs.length > 0 && fromParam && toParam) {
      startAutomaticPlanning(locs, countryParam, fromParam, toParam);
    } else {
      setError('Missing required trip information');
      setLoading(false);
    }
  }, [searchParams]);

  const startAutomaticPlanning = async (
    locs: Location[],
    countryParam: string,
    fromParam: string,
    toParam: string
  ) => {
    try {
      setPlanning(true);
      setLoading(false); // Switch from initial loading to planning state
      setError('');

      console.log('Starting automatic planning with:', { locs, countryParam, fromParam, toParam });

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - Pathfinder is taking too long. Please try again.')), 60000); // 60 second timeout
      });

      // Call backend endpoint for automatic experience selection
      const apiPromise = api.post('/trips/plan/automatic', {
        locations: locs,
        country: countryParam,
        fromDate: fromParam,
        toDate: toParam
      });

      const response = await Promise.race([apiPromise, timeoutPromise]) as any;

      console.log('Automatic planning response:', response?.data);

      if (response?.data?.experiences && response.data.experiences.length > 0) {
        setSelectedExperiences(response.data.experiences);
        setPlanning(false);
        // Don't auto-schedule, let user review first
        // User can click "Create Schedule" button to proceed
      } else {
        setError(response?.data?.message || 'No personalized experiences found. Please try manual planning.');
        setPlanning(false);
      }
    } catch (err: any) {
      console.error('Automatic planning error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to generate automatic plan. Please try again.';
      setError(errorMessage);
      setLoading(false);
      setPlanning(false);
    }
  };

  const addToBucketlistAndSchedule = async (
    experiences: Experience[],
    locs: Location[],
    countryParam: string,
    fromParam: string,
    toParam: string
  ) => {
    try {
      setPlanning(true);
      setError('');

      // Add all selected experiences to bucketlist
      const bucketlistPromises = experiences.map(exp =>
        api.post('/user/bucketlist', { experienceId: exp._id })
      );
      await Promise.all(bucketlistPromises);

      // Route to guide selection page instead of directly scheduling
      const locationParams = locs.map((loc, idx) => 
        `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(loc.district)}`
      ).join('&');
      
      router.push(`/trips/guides/select?country=${countryParam}&from=${fromParam}&to=${toParam}&${locationParams}`);
    } catch (err: any) {
      console.error('Error adding to bucketlist:', err);
      setError(err.response?.data?.message || 'Failed to add experiences to bucketlist. Please try again.');
      setPlanning(false);
    }
  };

  if (loading || planning) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative w-32 h-32 mx-auto mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-primary-200 border-t-primary-600 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {planning ? 'Pathfinder is Working...' : 'Initializing Pathfinder'}
            </h2>
            
            <p className="text-lg text-gray-600 mb-8">
              {planning 
                ? 'Analyzing your travel profile and selecting personalized experiences...'
                : 'Preparing your personalized travel experience'
              }
            </p>

            {planning && (
              <p className="text-sm text-gray-500 mt-4">
                This may take up to 60 seconds. Please wait...
              </p>
            )}

            {planning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-2 h-2 bg-primary-500 rounded-full"
                  />
                  <span>Analyzing your preferences...</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-primary-500 rounded-full"
                  />
                  <span>Filtering experiences...</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-primary-500 rounded-full"
                  />
                  <span>Creating your personalized itinerary...</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Planning Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/trips/select')}
                className="btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  // Switch to manual mode
                  const locationParams = locations.map((loc, idx) => 
                    `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(loc.district)}`
                  ).join('&');
                  router.push(`/trips/experiences?country=${country}&from=${fromDate}&to=${toDate}&${locationParams}`);
                }}
                className="btn-secondary"
              >
                Use Manual Planning
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="page-container py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Your Personalized Experiences
            </h1>
            <p className="text-lg text-gray-600">
              Pathfinder has selected {selectedExperiences.length} experiences tailored to your profile
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => addToBucketlistAndSchedule(selectedExperiences, locations, country, fromDate, toDate)}
              disabled={planning || selectedExperiences.length === 0}
              className="btn-primary text-lg py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-large hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              {planning ? (
                <>
                  <span className="spinner w-5 h-5 border-2"></span>
                  <span>Creating Schedule...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Create Schedule with These Experiences</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                const locationParams = locations.map((loc, idx) => 
                  `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(loc.district)}`
                ).join('&');
                router.push(`/trips/experiences?country=${country}&from=${fromDate}&to=${toDate}&${locationParams}`);
              }}
              className="btn-secondary text-lg py-4 px-8 shadow-large hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Switch to Manual Selection</span>
            </button>
          </div>

          {/* Selected Experiences */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <AnimatePresence>
              {selectedExperiences.map((experience, idx) => (
                <motion.div
                  key={experience._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-gray-200 hover:border-primary-300 transition-all"
                >
                  {experience.imageUrl && (
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={getImageUrl(experience.imageUrl)}
                        alt={experience.title}
                        className="w-full h-full object-cover"
                      />
                      {experience.matchScore && (
                        <div className="absolute top-2 right-2 bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          {Math.round(experience.matchScore * 100)}% Match
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{experience.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{experience.description}</p>
                    
                    {experience.aiReasons && experience.aiReasons.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Why this matches you:</p>
                        <ul className="space-y-1">
                          {experience.aiReasons.slice(0, 2).map((reason, rIdx) => (
                            <li key={rIdx} className="text-xs text-gray-600 flex items-start gap-1">
                              <span className="text-primary-500 mt-0.5">•</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-2xl font-bold text-primary-600">${experience.price}</p>
                        <p className="text-xs text-gray-500">per person</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-700">
                          {experience.provider?.name || 'Unknown Host'}
                        </p>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {(experience.provider?.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

