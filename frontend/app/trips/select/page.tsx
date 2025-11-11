'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

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

  useEffect(() => {
    setIsClient(true);
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
    setLocations([...locations, { state: '', district: '' }]);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

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

    const validLocations = locations.filter(loc => loc.state && loc.district);
    if (validLocations.length === 0) {
      setError('Please add at least one location with state and district');
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
        locations: validLocations
      };
      
      sessionStorage.setItem('tripData', JSON.stringify(tripData));
      
      // Build query params for experiences page
      const locationParams = validLocations.map((loc, idx) => 
        `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(loc.district)}`
      ).join('&');
      
      router.push(`/trips/experiences?country=India&from=${fromDate}&to=${toDate}&${locationParams}`);
    } catch (err: any) {
      setError('Failed to proceed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="page-container py-8 md:py-12">
        <div className="section-container max-w-5xl">
          {/* Professional Header with Gradient */}
          <div className="mb-8 md:mb-12">
            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-2xl md:rounded-3xl shadow-large p-8 md:p-12 text-white relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-large border-2 border-white/30 p-3">
                  <Image 
                    src="/tribelink-logo.svg" 
                    alt="Tribelink Logo" 
                    width={80} 
                    height={80}
                    className="w-full h-full"
                  />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  Plan Your Adventure
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  Create your perfect itinerary by selecting destinations and travel dates. Our AI-powered scheduler will optimize your journey.
                </p>
                
                {/* Step Indicator */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm font-medium">Step 1 of 3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-card shadow-large border-0">
            {/* Token Warning - Enhanced Design */}
          {hasNoTokens || (user && (!user.tokens || user.tokens === 0)) ? (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 md:p-8 mb-8 shadow-medium">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🪙</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">
                    No Tokens Available
                  </h3>
                  <p className="text-amber-800 mb-4 leading-relaxed">
                    You need at least <span className="font-semibold">1 token</span> to plan a new trip. Complete an existing trip payment to earn <span className="font-semibold">2 tokens</span> and continue planning your adventures!
                  </p>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-primary bg-amber-600 hover:bg-amber-700 shadow-medium"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-soft">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
              <div className="flex-1">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Travel Dates Section - Enhanced with Modern Calendar */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 md:p-8 border-2 border-blue-200 shadow-soft">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-900">
                    Travel Dates
                  </label>
                  <p className="text-sm text-gray-600">Select your journey start and end dates</p>
                </div>
              </div>

              {/* Modern Calendar Component */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-medium border border-gray-200 mb-6" style={{ position: 'relative', zIndex: 10 }}>
                {isClient && (
                  <DayPicker
                    mode="range"
                    selected={{ from: startDate || undefined, to: endDate || undefined }}
                    onSelect={(range) => {
                      console.log('Calendar selection:', range);
                      if (!range) {
                        setStartDate(null);
                        setEndDate(null);
                        return;
                      }
                      
                      if (range.from && !range.to) {
                        // First date selected, waiting for second date
                        setStartDate(range.from);
                        setEndDate(null);
                      } else if (range.from && range.to) {
                        // Both dates selected
                        setStartDate(range.from);
                        setEndDate(range.to);
                      } else if (!range.from && range.to) {
                        // Edge case: only to date
                        setStartDate(null);
                        setEndDate(range.to);
                      }
                    }}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                    className="rdp-calendar"
                    classNames={{
                      months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                      month: 'space-y-4',
                      caption: 'flex justify-center pt-1 relative items-center mb-4',
                      caption_label: 'text-lg font-bold text-gray-900',
                      nav: 'space-x-1 flex items-center',
                      nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary-50 rounded-lg transition-all cursor-pointer',
                      nav_button_previous: 'absolute left-1',
                      nav_button_next: 'absolute right-1',
                      table: 'w-full border-collapse space-y-1',
                      head_row: 'flex mb-2',
                      head_cell: 'text-gray-500 rounded-md w-10 font-semibold text-sm',
                      row: 'flex w-full mt-2',
                      cell: 'text-center text-sm p-0 relative',
                      day: 'h-10 w-10 p-0 font-normal rounded-lg transition-all cursor-pointer',
                      day_selected: 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white font-semibold',
                      day_today: 'bg-blue-100 text-blue-900 font-semibold',
                      day_outside: 'text-gray-400 opacity-50',
                      day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
                      day_range_middle: 'bg-primary-100 text-primary-900',
                      day_hidden: 'invisible',
                    }}
                    styles={{
                      months: { display: 'flex', gap: '1rem' },
                      month: { margin: 0 },
                      caption: { position: 'relative', paddingTop: '0.5rem' },
                      nav: { display: 'flex', gap: '0.25rem' },
                    }}
                    modifiersClassNames={{
                      selected: 'bg-primary-500 text-white',
                      range_start: 'bg-primary-500 text-white rounded-l-lg',
                      range_end: 'bg-primary-500 text-white rounded-r-lg',
                    }}
                  />
                )}
              </div>

              {/* Selected Dates Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base font-semibold text-gray-900">
                      {startDate ? format(startDate, 'MMMM d, yyyy') : 'Not selected'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-base font-semibold text-gray-900">
                      {endDate ? format(endDate, 'MMMM d, yyyy') : 'Not selected'}
                    </span>
                  </div>
                </div>
              </div>

              {startDate && endDate && (
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border-2 border-blue-300 shadow-soft">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-700">
                    Trip duration: <span className="text-primary-600 font-bold text-base">{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1}</span> days
                  </p>
                </div>
              )}
            </div>

            {/* Country Section - Enhanced */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-900">
                    Country
                  </label>
                  <p className="text-sm text-gray-600">Select your travel destination</p>
                </div>
              </div>
              <input
                type="text"
                value="India"
                disabled
                className="input-field bg-white/80 border-2 border-green-200 cursor-not-allowed font-semibold"
              />
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Currently supporting India only. More countries coming soon!</span>
              </div>
            </div>

            {/* Destinations Section - Enhanced */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-900">
                      Destinations <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600">Add one or more locations to visit</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addLocation}
                  className="btn-outline text-sm py-2.5 px-5 flex items-center gap-2 hover:bg-primary-50 hover:border-primary-300 transition-all shadow-soft"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Location
                </button>
              </div>

              {locations.map((location, index) => {
                const availableDistricts = location.state ? (DISTRICTS_BY_STATE[location.state] || []) : [];
                
                return (
                  <div key={index} className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 shadow-soft hover:border-primary-300 transition-all">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-medium">
                          {index + 1}
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          Location {index + 1}
                        </span>
                      </div>
                      {locations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLocation(index)}
                          className="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          State/Province <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={location.state}
                          onChange={(e) => updateLocation(index, 'state', e.target.value)}
                          required
                          className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        >
                          <option value="">Select a state</option>
                          {INDIAN_STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          District/City <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={location.district}
                          onChange={(e) => updateLocation(index, 'district', e.target.value)}
                          required
                          disabled={!location.state || availableDistricts.length === 0}
                          className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-200"
                        >
                          <option value="">
                            {!location.state 
                              ? 'Select a state first' 
                              : availableDistricts.length === 0 
                              ? 'No districts available'
                              : 'Select a district/city'}
                          </option>
                          {availableDistricts.map((district) => (
                            <option key={district} value={district}>
                              {district}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button - Enhanced */}
            <div className="pt-6 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={loading || hasNoTokens || (user ? (!user.tokens || user.tokens === 0) : false)}
                className="btn-primary w-full text-lg py-4 md:py-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-large hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <span className="spinner w-5 h-5 border-2"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Browse Experiences</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                You'll be able to select experiences and customize your itinerary in the next step
              </p>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
