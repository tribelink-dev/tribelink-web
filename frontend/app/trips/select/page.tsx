'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { format } from 'date-fns';
import PremiumDatePicker from '@/components/PremiumDatePicker';
import LocationSearch from '@/components/LocationSearch';
import AuthPromptModal from '@/components/AuthPromptModal';

interface Location {
  state: string;
  district: string;
}

export default function TripSelectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [locations, setLocations] = useState<Location[]>([{ state: '', district: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasNoTokens, setHasNoTokens] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
    
    // Check for saved trip data in sessionStorage
    const savedTripData = sessionStorage.getItem('tripData');
    if (savedTripData) {
      try {
        const trip = JSON.parse(savedTripData);
        
        // Restore dates
        if (trip.fromDate) {
          setStartDate(new Date(trip.fromDate));
        }
        if (trip.toDate) {
          setEndDate(new Date(trip.toDate));
        }
        
        // Restore locations
        if (trip.locations && trip.locations.length > 0) {
          setLocations(trip.locations.map((loc: Location) => ({
            state: loc.state || '',
            district: loc.district || ''
          })));
        } else if (trip.state && trip.district) {
          // Fallback for old format
          setLocations([{ state: trip.state, district: trip.district }]);
        }
      } catch (err) {
        console.error('Error parsing saved trip data:', err);
        // Clear invalid data
        sessionStorage.removeItem('tripData');
      }
    }
  }, []);

  useEffect(() => {
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
        // If check fails, allow form (will be caught at schedule time)
        setHasNoTokens(false);
      }
    };
    
    if (user) {
      checkTokens();
    }
  }, [user]);

  const addLocation = () => {
    // Only add if current locations have at least state filled (district is optional for state-only searches)
    const allFilled = locations.every(loc => loc.state);
    if (allFilled && locations.length < 10) { // Max 10 locations
      setLocations([...locations, { state: '', district: '' }]);
    }
  };

  // Check if all locations are filled (state is required, district is optional)
  const allLocationsFilled = locations.every(loc => loc.state);
  const canAddLocation = allLocationsFilled && locations.length < 10;
  const hasEmptyLocations = locations.some(loc => !loc.state);

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const updateLocation = (index: number, field: 'state' | 'district', value: string) => {
    const updated = [...locations];
    updated[index] = {
      ...updated[index],
      [field]: value,
      ...(field === 'state' ? { district: '' } : {}) // Reset district when state changes
    };
    setLocations(updated);
  };

  const handleLocationChange = (index: number, location: Location) => {
    const updated = [...locations];
    updated[index] = location;
    setLocations(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!user) {
      setAuthModalOpen(true);
      setLoading(false);
      return;
    }

    // Check if user has tokens
    if (hasNoTokens || (user && (!user.tokens || user.tokens === 0))) {
      setError('You need at least 1 token to plan a new trip. Complete an existing trip to earn more tokens!');
      setLoading(false);
      return;
    }

    if (!startDate || !endDate) {
      setError('Please select travel dates');
      setLoading(false);
      return;
    }

    // Allow locations with state only (district will be expanded to all districts in that state)
    const validLocations = locations.filter(loc => loc.state);
    if (validLocations.length === 0) {
      setError('Please add at least one location with state');
      setLoading(false);
      return;
    }

    if (endDate <= startDate) {
      setError('End date must be after start date');
      setLoading(false);
      return;
    }

    try {
      // Format dates as ISO strings
      const fromDate = startDate.toISOString().split('T')[0];
      const toDate = endDate.toISOString().split('T')[0];
      
      // Store trip data with multiple locations
      const tripData = {
        fromDate,
        toDate,
        country: 'India',
        locations: validLocations,
      };
      
      sessionStorage.setItem('tripData', JSON.stringify(tripData));
      
      // Single unified planner entry: pass context into the abodes + experiences planner
      const locationParams = validLocations
        .map((loc, idx) =>
          `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(
            loc.district || ''
          )}`
        )
        .join('&');
      router.push(
        `/trips/abodes/select?country=India&from=${fromDate}&to=${toDate}&${locationParams}`
      );
    } catch (err: any) {
      setError('Failed to proceed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-heritage-gold/5 rounded-full blur-3xl"></div>
        
        <div className="section-container-luxury relative z-10 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            {/* Step Indicator */}
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-heritage-gold rounded-full"></div>
                <span className="text-sm font-medium text-white/90 tracking-wide">Step 1 of 3</span>
              </div>
            </div>
            
            <h1 className="heading-display text-5xl md:text-6xl lg:text-7xl text-white mb-6 animate-fade-in-up">
              Plan Your Journey
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-light mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              Tell us when and where, and we&apos;ll craft a first-draft itinerary around local abodes and experiences you can tweak to feel just right.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Section */}
      <div className="section-container-luxury -mt-16 relative z-20">
        <div className="max-w-5xl mx-auto">

          <div className="content-card shadow-luxury-lg border-charcoal-100/50 mb-8">
            {/* Planner intro */}
            <div className="mb-10 text-left">
              <h2 className="text-2xl font-semibold text-charcoal-900 mb-2">
                How this planner works
              </h2>
              <p className="text-sm text-charcoal-600 max-w-2xl">
                You share your dates and the regions you&apos;re curious about. We combine local homes and on-ground experiences to suggest a balanced plan—like a thoughtful friend who knows the area well. You stay in control and can always adjust later.
              </p>
            </div>

            {/* Token Warning - Premium Design */}
            {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
              <div className="bg-gradient-to-br from-heritage-gold/10 to-heritage-gold/5 border-2 border-heritage-gold/30 rounded-2xl p-8 mb-8 shadow-luxury">
                <div className="flex items-start gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-heritage-gold/20 rounded-xl flex items-center justify-center border border-heritage-gold/30">
                    <svg className="w-7 h-7 text-heritage-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-charcoal-900 mb-2">
                      Tokens Required
                    </h3>
                    <p className="text-charcoal-700 mb-6 leading-relaxed text-body-luxury-sm">
                      You need at least <span className="font-semibold text-heritage-gold-dark">1 token</span> to plan a new trip. Complete an existing trip payment to earn <span className="font-semibold text-heritage-gold-dark">2 tokens</span> and continue planning your adventures!
                    </p>
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-3 bg-charcoal-700 hover:bg-charcoal-800 text-white rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Travel Dates Section - Premium */}
              <div className="bg-white rounded-2xl p-8 md:p-10 border border-charcoal-100/50 shadow-luxury">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-charcoal-100">
                  <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xl font-semibold text-charcoal-900 mb-1">
                      Travel Dates
                    </label>
                    <p className="text-sm text-charcoal-600 font-light">Select your journey start and end dates</p>
                  </div>
                </div>

                {isClient && (
                  <PremiumDatePicker
                    startDate={startDate}
                    endDate={endDate}
                    onDatesChange={({ from, to }) => {
                      setStartDate(from);
                      setEndDate(to);
                    }}
                  />
                )}
              </div>

              {/* Country Section - Premium */}
              <div className="bg-white rounded-2xl p-8 border border-charcoal-100/50 shadow-luxury">
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-charcoal-100">
                  <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xl font-semibold text-charcoal-900 mb-1">
                      Country
                    </label>
                    <p className="text-sm text-charcoal-600 font-light">Your travel destination</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-center gap-4 bg-cream-50 border-2 border-cream-200 rounded-xl p-5">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm border border-charcoal-100">
                        <span className="text-xl">🇮🇳</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-charcoal-900">India</div>
                      <div className="text-sm text-charcoal-600 mt-1">Currently available</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="px-3 py-1.5 bg-heritage-gold/10 text-heritage-gold-dark text-xs font-semibold rounded-lg border border-heritage-gold/20">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-charcoal-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>More countries coming soon</span>
                  </div>
                </div>
              </div>

              {/* Destinations Section - Premium */}
              <div className="bg-white rounded-2xl p-8 md:p-10 border border-charcoal-100/50 shadow-luxury">
                <div className="mb-8 pb-6 border-b border-charcoal-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <label className="block text-xl font-semibold text-charcoal-900 mb-1">
                        Destinations <span className="text-red-500">*</span>
                        {locations.length > 0 && (
                          <span className="ml-2 text-sm font-normal text-charcoal-500">
                            ({locations.length} {locations.length === 1 ? 'location' : 'locations'})
                          </span>
                        )}
                      </label>
                      <p className="text-sm text-charcoal-600 font-light">
                        {hasEmptyLocations 
                          ? 'Complete the current location to add more'
                          : 'Add one or more locations to visit'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {locations.map((location, index) => (
                    <div 
                      key={index} 
                      className="bg-cream-50/50 rounded-xl p-6 md:p-8 border-2 border-charcoal-100 hover:border-charcoal-200 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-charcoal-700 rounded-lg flex items-center justify-center text-white font-semibold text-sm shadow-md">
                            {index + 1}
                          </div>
                          <span className="text-base font-semibold text-charcoal-900">
                            Location {index + 1}
                          </span>
                        </div>
                        {locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        )}
                      </div>

                      <LocationSearch
                        value={location}
                        onChange={(newLocation) => handleLocationChange(index, newLocation)}
                        onRemove={locations.length > 1 ? () => removeLocation(index) : undefined}
                        index={index}
                        showRemove={false}
                        autoFocus={index === locations.length - 1 && !location.state && !location.district}
                      />
                    </div>
                  ))}

                  {/* Add Location Button - Always visible after locations */}
                  <div className="pt-2">
                    {hasEmptyLocations && (
                      <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Complete all locations above before adding more</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={addLocation}
                      disabled={!canAddLocation}
                      className={`
                        w-full
                        px-6 py-4 rounded-xl font-medium text-base flex items-center justify-center gap-3
                        transition-all duration-300 shadow-sm
                        ${
                          canAddLocation
                            ? 'bg-white border-2 border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 hover:border-charcoal-300 hover:shadow-md hover:scale-[1.01]'
                            : 'bg-charcoal-50 border-2 border-charcoal-100 text-charcoal-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add Another Location</span>
                      {locations.length >= 10 && (
                        <span className="text-xs ml-1 opacity-75">(Max 10 reached)</span>
                      )}
                    </button>
                    {canAddLocation && locations.length < 10 && (
                      <p className="text-center text-xs text-charcoal-500 mt-3">
                        You can add up to {10 - locations.length} more {10 - locations.length === 1 ? 'location' : 'locations'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Premium CTA Section */}
              <div className="pt-8 border-t border-charcoal-100">
                <button
                  type="submit"
                  disabled={loading || hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
                  className="
                    w-full
                    bg-charcoal-700
                    hover:bg-charcoal-800
                    disabled:bg-charcoal-300
                    disabled:cursor-not-allowed
                    text-white
                    text-lg
                    font-semibold
                    py-5
                    md:py-6
                    rounded-xl
                    shadow-luxury-lg
                    hover:shadow-xl
                    transition-all duration-300
                    transform
                    hover:scale-[1.01]
                    active:scale-[0.99]
                    flex items-center justify-center gap-3
                    group
                  "
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Plan my trip</span>
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-charcoal-500 mt-5 font-light">
                  We&apos;ll propose a human-feeling first draft with stays and experiences; you can fine-tune or swap things out in the next steps.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={() => setAuthModalOpen(false)}
        onSignUp={() => setAuthModalOpen(false)}
        message="Sign in to plan your trip"
        returnTo={pathname || '/trips/select'}
      />
    </div>
  );
}
