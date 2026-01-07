'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface Guide {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  rating: number;
  ratingCount: number;
  profilePicture?: string;
  hourlyRate: number;
  availability?: Array<{
    date: string;
    available: boolean;
  }>;
}

export default function GuideSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [country, setCountry] = useState('India');
  const [locations, setLocations] = useState<Array<{ state: string; district: string }>>([]);

  useEffect(() => {
    // Get trip data from sessionStorage
    const tripDataStr = sessionStorage.getItem('tripData');
    let tripFromDate = '';
    let tripToDate = '';
    let tripCountry = 'India';
    let tripLocations: Array<{ state: string; district: string }> = [];
    
    if (tripDataStr) {
      try {
        const tripData = JSON.parse(tripDataStr);
        tripFromDate = tripData.fromDate || '';
        tripToDate = tripData.toDate || '';
        tripCountry = tripData.country || 'India';
        tripLocations = tripData.locations || [];
      } catch (err) {
        console.error('Error parsing trip data:', err);
      }
    }

    // Also check query params
    const fromParam = searchParams.get('from') || tripFromDate;
    const toParam = searchParams.get('to') || tripToDate;
    
    setFromDate(fromParam);
    setToDate(toParam);
    setCountry(tripCountry);
    setLocations(tripLocations);

    if (fromParam && toParam) {
      fetchAvailableGuides(fromParam, toParam, tripCountry);
    } else {
      setError('Missing trip dates. Please start over.');
      setLoading(false);
    }
  }, [searchParams]);

  const fetchAvailableGuides = async (from: string, to: string, countryParam: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/hosts/guides/available', {
        params: {
          fromDate: from,
          toDate: to,
          country: countryParam
        }
      });

      setGuides(response.data.guides || []);
    } catch (err: any) {
      console.error('Error fetching guides:', err);
      setError(err.response?.data?.message || 'Failed to load available guides');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (selectedGuide) {
      // Store selected guide in sessionStorage
      sessionStorage.setItem('selectedGuideId', selectedGuide);
    }
    
    // Route to schedule page
    const locationParams = locations.length > 0 
      ? locations.map((loc, idx) => 
          `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(loc.district)}`
        ).join('&')
      : '';
    
    const queryParams = [
      `country=${encodeURIComponent(country)}`,
      `from=${fromDate}`,
      `to=${toDate}`,
      locationParams
    ].filter(Boolean).join('&');
    
    router.push(`/trips/schedule?${queryParams}${selectedGuide ? `&guideId=${selectedGuide}` : ''}`);
  };

  const handleSkip = () => {
    // Allow user to skip guide selection
    handleContinue();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading available guides...</div>
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
              Select Your Guide
            </h1>
            <p className="text-lg text-gray-600">
              Choose a local guide to enhance your travel experience, or skip to continue without a guide
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {guides.length === 0 && !loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Guides Available</h3>
              <p className="text-gray-600 mb-6">
                There are no guides available for your selected dates. You can continue without a guide.
              </p>
              <button
                onClick={handleSkip}
                className="btn-primary"
              >
                Continue Without Guide
              </button>
            </div>
          ) : (
            <>
              {/* Guide Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <AnimatePresence>
                  {guides.map((guide, idx) => (
                    <motion.div
                      key={guide._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedGuide(guide._id)}
                      className={`
                        bg-white rounded-xl shadow-lg overflow-hidden border-2 cursor-pointer transition-all
                        ${selectedGuide === guide._id 
                          ? 'border-primary-500 ring-4 ring-primary-200 scale-105' 
                          : 'border-gray-200 hover:border-primary-300 hover:shadow-xl'
                        }
                      `}
                    >
                      {/* Guide Image/Profile */}
                      <div className="relative h-48 bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        {guide.profilePicture ? (
                          <img
                            src={getImageUrl(guide.profilePicture)}
                            alt={guide.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                            {guide.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {selectedGuide === guide._id && (
                          <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-2">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Guide Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{guide.name}</h3>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.floor(guide.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {guide.rating.toFixed(1)} ({guide.ratingCount} reviews)
                          </span>
                        </div>

                        {/* Hourly Rate */}
                        <div className="bg-primary-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Hourly Rate</span>
                            <span className="text-lg font-bold text-primary-600">
                              ${guide.hourlyRate}/hr
                            </span>
                          </div>
                        </div>

                        {/* Availability Badge */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>Available for your dates</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={handleSkip}
                  className="btn-secondary text-lg py-4 px-8 shadow-large hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Skip Guide Selection</span>
                </button>
                <button
                  onClick={handleContinue}
                  disabled={!selectedGuide}
                  className="btn-primary text-lg py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed shadow-large hover:shadow-xl transition-all flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Continue to Schedule</span>
                </button>
              </div>

              {selectedGuide && (
                <div className="mt-6 bg-primary-50 rounded-xl p-4 border-2 border-primary-200 text-center">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Selected:</span>{' '}
                    {guides.find(g => g._id === selectedGuide)?.name}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

