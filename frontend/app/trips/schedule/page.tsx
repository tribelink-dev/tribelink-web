'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import TripMap from '@/components/TripMap';
import { useAuth } from '@/lib/auth';

interface Activity {
  experienceId: string;
  title: string;
  price: number;
  startTime: string;
  endTime: string;
  duration: number;
  provider: {
    _id: string;
    name: string;
  };
  location?: {
    district: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface Hotel {
  _id: string;
  name: string;
  description?: string;
  amenities?: string[];
  pricePerNight: number;
  rating: number;
  roomsAvailable: number;
  images?: Array<{ url: string; isMain?: boolean } | string>;
  location?: {
    district: string;
    state: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface ScheduleDay {
  date: string;
  activities: Activity[];
  hotel?: string;
  hotelSelected?: boolean;
  guide?: any;
  cab: boolean;
  chauffeur?: boolean;
}

interface MapData {
  waypoints: Array<{
    type: 'activity' | 'hotel';
    day: number;
    index?: number;
    title?: string;
    name?: string;
    coordinates: { lat: number; lng: number };
    location: string;
    time?: string;
  }>;
  route: Array<{ district: string; state: string; coordinates: { lat: number; lng: number } | null }>;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}

interface TripData {
  tripId: string;
  schedule: ScheduleDay[];
  totalPrice: number;
  availableHotels?: Hotel[];
  mapData?: MapData;
  fromDate?: string;
  toDate?: string;
  country?: string;
  state?: string;
  district?: string;
  locations?: Array<{ state: string; district: string }>;
  preferences?: {
    travelStyle?: string;
    pace?: string;
    transport?: string;
  };
  priceBreakdown?: {
    activities: number;
    hotels: number;
    chauffeur: number;
    guide: number;
  };
  statistics?: {
    duration: number;
    totalActivities: number;
    selectedExperiencesCount: number;
    totalHotels: number;
    totalChauffeurDays: number;
    totalCabDays: number;
    hasGuide: boolean;
  };
}

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tripData, setTripData] = useState<TripData | null>(null);
  const [error, setError] = useState('');
  const [guideId, setGuideId] = useState('');
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [selectedHotels, setSelectedHotels] = useState<{ [key: number]: string }>({});
  const [chauffeurDays, setChauffeurDays] = useState<{ [key: number]: boolean }>({});
  const [savingHotels, setSavingHotels] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [recommendations, setRecommendations] = useState<{ [dayIndex: number]: any[] }>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<{ [dayIndex: number]: boolean }>({});

  useEffect(() => {
    const tripId = searchParams.get('tripId');
    if (tripId) {
      fetchTrip(tripId);
    } else {
      fetchAvailableGuides();
      setTimeout(() => {
        createSchedule();
      }, 500);
    }
  }, [searchParams]);

  const fetchTrip = async (tripId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/trips/${tripId}`);
      const trip = response.data.trip;
      
      // Transform schedule to match expected format
      const transformedSchedule = (trip.schedule || []).map((day: any) => {
        // Transform activities - handle populated experienceId
        const transformedActivities = (day.activities || []).map((activity: any) => {
          // If experienceId is populated (object), extract data from it
          if (activity.experienceId && typeof activity.experienceId === 'object') {
            const experience = activity.experienceId;
            return {
              experienceId: experience._id || experience,
              title: activity.title || experience.title || 'Untitled Experience',
              price: activity.price || experience.price || 0,
              startTime: activity.startTime || '09:00',
              endTime: activity.endTime || '17:00',
              duration: activity.duration || experience.duration || 2,
              provider: activity.provider || (experience.provider ? {
                _id: experience.provider._id || experience.provider,
                name: experience.provider.name || 'Unknown'
              } : { _id: '', name: 'Unknown' }),
              location: activity.location || experience.location || null
            };
          }
          // If experienceId is just an ID, use activity data as-is
          return {
            experienceId: activity.experienceId,
            title: activity.title || 'Untitled Experience',
            price: activity.price || 0,
            startTime: activity.startTime || '09:00',
            endTime: activity.endTime || '17:00',
            duration: activity.duration || 2,
            provider: activity.provider || { _id: '', name: 'Unknown' },
            location: activity.location || null
          };
        });
        
        return {
          date: day.date,
          activities: transformedActivities,
          hotel: day.hotel?._id || day.hotel || null,
          hotelSelected: day.hotelSelected || false,
          guide: day.guide?._id || day.guide || null,
          cab: day.cab || false,
          chauffeur: day.chauffeur || false,
          foodOrders: day.foodOrders || []
        };
      });
      
      // Fetch available hotels for trip locations
      let availableHotels: Hotel[] = [];
      try {
        if (trip.locations && trip.locations.length > 0) {
          // Fetch hotels for all locations in the trip
          const hotelPromises = trip.locations.map((loc: any) =>
            api.get('/hotels', {
              params: {
                country: trip.country || 'India',
                state: loc.state,
                district: loc.district
              }
            }).catch(() => ({ data: { hotels: [] } }))
          );
          const hotelResponses = await Promise.all(hotelPromises);
          const allHotels = hotelResponses.flatMap((res: any) => res.data.hotels || []);
          // Remove duplicates
          availableHotels = allHotels.filter((hotel: Hotel, index: number, self: Hotel[]) =>
            index === self.findIndex((h: Hotel) => h._id === hotel._id)
          );
        } else if (trip.state && trip.district) {
          // Fallback to single location
          const hotelsResponse = await api.get('/hotels', {
            params: {
              country: trip.country || 'India',
              state: trip.state,
              district: trip.district
            }
          });
          availableHotels = hotelsResponse.data.hotels || [];
        }
      } catch (err) {
        console.error('Error fetching hotels:', err);
        // Continue without hotels
      }
      
      // Convert trip data to TripData format
      setTripData({
        tripId: trip._id,
        schedule: transformedSchedule,
        totalPrice: trip.totalPrice || 0,
        availableHotels: availableHotels,
        mapData: trip.mapData || null
      });
      
      // Set guide if exists
      if (trip.schedule && trip.schedule.length > 0 && trip.schedule[0].guide) {
        const guide = trip.schedule[0].guide;
        setGuideId(guide._id || guide);
      }
      
      // Initialize hotel selections
      const hotels: { [key: number]: string } = {};
      trip.schedule?.forEach((day: any, idx: number) => {
        if (day.hotel) {
          hotels[idx] = day.hotel._id || day.hotel;
        }
      });
      setSelectedHotels(hotels);
      
      // Initialize chauffeur selections
      const chauffeurs: { [key: number]: boolean } = {};
      trip.schedule?.forEach((day: any, idx: number) => {
        if (day.chauffeur) {
          chauffeurs[idx] = true;
        }
      });
      setChauffeurDays(chauffeurs);
      
      // Fetch available guides for the trip dates
      if (trip.fromDate && trip.toDate) {
        try {
          const guidesResponse = await api.get('/hosts/available', {
            params: {
              fromDate: new Date(trip.fromDate).toISOString().split('T')[0],
              toDate: new Date(trip.toDate).toISOString().split('T')[0],
              role: 'Guide'
            }
          });
          setAvailableGuides(guidesResponse.data.hosts || []);
        } catch (err) {
          // No guides available or error - continue without guides
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load trip');
    } finally {
      setLoading(false);
    }
  };

  const handleGuideChange = async (newGuideId: string) => {
    setGuideId(newGuideId);
    if (tripData) {
      await createSchedule();
    }
  };

  const fetchAvailableGuides = async () => {
    try {
      const tripDataStr = sessionStorage.getItem('tripData');
      if (!tripDataStr) return;

      const trip = JSON.parse(tripDataStr);
      const response = await api.get('/hosts/available', {
        params: {
          fromDate: trip.fromDate,
          toDate: trip.toDate,
          role: 'Guide'
        }
      });
      setAvailableGuides(response.data.hosts || []);
    } catch (err) {
      // No guides available
    }
  };

  const createSchedule = async () => {
    try {
      setCreatingSchedule(true);
      const tripDataStr = sessionStorage.getItem('tripData');
      if (!tripDataStr) {
        router.push('/trips/select');
        return;
      }

      const trip = JSON.parse(tripDataStr);
      
      // Handle multiple locations
      const locations = trip.locations || [{ state: trip.state, district: trip.district }];
      
      // For now, schedule with first location or combine all
      // The scheduler will need to be updated to handle multiple locations
      const response = await api.post('/trips/schedule', {
        fromDate: trip.fromDate,
        toDate: trip.toDate,
        country: trip.country || 'India',
        state: locations[0]?.state || trip.state,
        district: locations[0]?.district || trip.district,
        locations: locations, // Pass all locations
        guideId: guideId || null
      });

      // Debug: Log the response to see what we're getting
      console.log('Schedule response:', response.data);
      console.log('Schedule days:', response.data.schedule);
      if (response.data.schedule && response.data.schedule.length > 0) {
        console.log('First day full object:', response.data.schedule[0]);
        console.log('First day activities:', response.data.schedule[0].activities);
        console.log('First day activities length:', response.data.schedule[0].activities?.length);
      }
      
      // Transform schedule to ensure activities are properly formatted
      const transformedSchedule = (response.data.schedule || []).map((day: any, dayIdx: number) => {
        // Ensure activities is always an array
        const dayActivities = Array.isArray(day.activities) ? day.activities : [];
        console.log(`Day ${dayIdx} - Raw activities:`, dayActivities);
        console.log(`Day ${dayIdx} - Activities count:`, dayActivities.length);
        
        // Transform activities - handle both populated and unpopulated formats
        const transformedActivities = dayActivities.map((activity: any, actIdx: number) => {
          console.log(`Day ${dayIdx}, Activity ${actIdx}:`, activity);
          // If experienceId is populated (object), extract data from it
          if (activity.experienceId && typeof activity.experienceId === 'object') {
            const experience = activity.experienceId;
            return {
              experienceId: experience._id || experience,
              title: activity.title || experience.title || 'Untitled Experience',
              price: activity.price || experience.price || 0,
              startTime: activity.startTime || '09:00',
              endTime: activity.endTime || '17:00',
              duration: activity.duration || experience.duration || 2,
              provider: activity.provider || (experience.provider ? {
                _id: experience.provider._id || experience.provider,
                name: experience.provider.name || 'Unknown'
              } : { _id: '', name: 'Unknown' }),
              location: activity.location || experience.location || null
            };
          }
          // If experienceId is just an ID, use activity data as-is
          return {
            experienceId: activity.experienceId,
            title: activity.title || 'Untitled Experience',
            price: activity.price || 0,
            startTime: activity.startTime || '09:00',
            endTime: activity.endTime || '17:00',
            duration: activity.duration || 2,
            provider: activity.provider || { _id: '', name: 'Unknown' },
            location: activity.location || null
          };
        });
        
        return {
          date: day.date,
          activities: transformedActivities,
          hotel: day.hotel?._id || day.hotel || null,
          hotelSelected: day.hotelSelected || false,
          guide: day.guide?._id || day.guide || null,
          cab: day.cab || false,
          chauffeur: day.chauffeur || false,
          foodOrders: day.foodOrders || []
        };
      });

      setTripData({
        tripId: response.data.tripId,
        schedule: transformedSchedule,
        totalPrice: response.data.totalPrice,
        availableHotels: response.data.availableHotels || [],
        mapData: response.data.mapData || null,
        fromDate: response.data.fromDate,
        toDate: response.data.toDate,
        country: response.data.country,
        state: response.data.state,
        district: response.data.district,
        locations: response.data.locations || [],
        preferences: response.data.preferences || {},
        priceBreakdown: response.data.priceBreakdown,
        statistics: response.data.statistics
      });
      sessionStorage.setItem('tripId', response.data.tripId);
      
      // Refresh user data to get updated tokens (1 token deducted)
      try {
        const userResponse = await api.get('/user/me');
        if (userResponse.data.user && typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.tokens = userResponse.data.user.tokens;
            localStorage.setItem('user', JSON.stringify(userData));
          }
        }
      } catch (err) {
        // Ignore error, tokens will update on next page load
      }
      
      // Initialize hotel selections with suggested hotels
      const initialHotels: { [key: number]: string } = {};
      response.data.schedule.forEach((day: ScheduleDay, idx: number) => {
        if (day.hotel && response.data.availableHotels) {
          const hotel = response.data.availableHotels.find((h: Hotel) => h._id === day.hotel);
          if (hotel) {
            initialHotels[idx] = hotel._id;
          }
        }
      });
      setSelectedHotels(initialHotels);
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create schedule');
    } finally {
      setLoading(false);
      setCreatingSchedule(false);
    }
  };

  const handleHotelChange = (dayIndex: number, hotelId: string) => {
    setSelectedHotels({
      ...selectedHotels,
      [dayIndex]: hotelId
    });
  };

  const handleChauffeurToggle = (dayIndex: number) => {
    setChauffeurDays({
      ...chauffeurDays,
      [dayIndex]: !chauffeurDays[dayIndex]
    });
  };

  const handleSaveHotels = async () => {
    try {
      setSavingHotels(true);
      if (!tripData) return;

      const response = await api.put(`/trips/${tripData.tripId}/hotels`, {
        hotels: selectedHotels,
        chauffeur: chauffeurDays
      });

      // Update trip data with new schedule and total price
      setTripData({
        ...response.data.trip,
        totalPrice: response.data.totalPrice || response.data.trip.totalPrice,
        mapData: response.data.mapData || tripData.mapData,
        availableHotels: response.data.trip.availableHotels || tripData.availableHotels
      });
      setError('');
      alert('Hotel selections and chauffeur options saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save hotel selections');
    } finally {
      setSavingHotels(false);
    }
  };

  const handleProceedToPayment = () => {
    router.push('/trips/payment');
  };

  const fetchRecommendations = async (dayIndex: number, date: string) => {
    if (!tripData) return;
    
    try {
      setLoadingRecommendations(prev => ({ ...prev, [dayIndex]: true }));
      
      // Get scheduled experience IDs to exclude
      const scheduledIds = tripData.schedule
        .flatMap(day => day.activities.map(act => act.experienceId))
        .filter(id => id);
      
      // Get location for this day (use trip location or day's activity location)
      const day = tripData.schedule[dayIndex];
      const location = day?.activities?.[0]?.location || {
        country: tripData.country,
        state: tripData.locations?.[0]?.state || tripData.state,
        district: tripData.locations?.[0]?.district || tripData.district
      };

      const response = await api.post('/trips/recommendations', {
        tripId: tripData.tripId,
        dayIndex,
        date,
        location,
        preferences: tripData.preferences,
        scheduledExperienceIds: scheduledIds
      });

      setRecommendations(prev => ({
        ...prev,
        [dayIndex]: response.data.recommendations || []
      }));
    } catch (err: any) {
      console.error('Error fetching recommendations:', err);
      setRecommendations(prev => ({
        ...prev,
        [dayIndex]: []
      }));
    } finally {
      setLoadingRecommendations(prev => ({ ...prev, [dayIndex]: false }));
    }
  };

  // Auto-fetch recommendations for free days when schedule loads
  useEffect(() => {
    if (tripData && tripData.schedule) {
      tripData.schedule.forEach((day, idx) => {
        if (!day.activities || day.activities.length === 0) {
          // Fetch recommendations for free days
          fetchRecommendations(idx, day.date);
        }
      });
    }
  }, [tripData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
          <div className="text-2xl font-semibold text-white">Creating your personalized schedule...</div>
        </div>
      </div>
    );
  }

  if (error && !tripData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism p-4">
        <div className="content-card max-w-md w-full">
          <div className="text-center mb-6">
            <span className="text-6xl block mb-4">⚠️</span>
            <p className="text-red-600 text-lg font-semibold mb-6">{error}</p>
          </div>
          <button
            onClick={() => router.push('/trips/select')}
            className="btn-primary w-full"
          >
            Go Back & Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6 shadow-medium">
            <span className="text-4xl">📅</span>
          </div>
          <h1 className="heading-primary text-gray-900">
            Your Perfect Itinerary
          </h1>
          <p className="text-subtitle text-gray-600 mb-0">
            Intelligently scheduled based on availability and timings
          </p>
        </div>

        {error && (
          <div className="alert-error mb-6">
            <span className="text-lg">⚠️</span>
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* Token Display - Small and Compact */}
        {user && typeof user.tokens !== 'undefined' && (
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <span className="text-lg">🪙</span>
              <span className="text-sm font-semibold text-yellow-700">
                {user.tokens} {user.tokens === 1 ? 'token' : 'tokens'} available
              </span>
              {user.tokens === 0 && (
                <span className="text-xs text-yellow-600 ml-2">(Complete a trip to earn more)</span>
              )}
            </div>
          </div>
        )}

        {availableGuides.length > 0 && (
          <div className="content-card mb-8">
            <h2 className="heading-tertiary mb-4">
              Optional: Select a Travel Guide
            </h2>
            <select
              value={guideId}
              onChange={(e) => handleGuideChange(e.target.value)}
              disabled={creatingSchedule}
              className="input-field"
            >
              <option value="">No guide</option>
              {availableGuides.map(guide => (
                <option key={guide._id} value={guide._id}>
                  {guide.name} ⭐ {guide.rating.toFixed(1)} Rating
                </option>
              ))}
            </select>
          </div>
        )}

        {tripData && (
          <>
            {/* Comprehensive Trip Summary - Professional Design */}
            <div className="content-card mb-8 overflow-hidden">
              {/* Header with gradient accent */}
              <div className="bg-gradient-primary -m-6 sm:-m-8 lg:-m-10 mb-6 sm:mb-8 lg:mb-10 px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 lg:pt-10 pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📋</span>
                  </div>
                  <h2 className="heading-secondary text-white mb-0">
                    Trip Summary
                  </h2>
                </div>
                <p className="text-white/90 text-sm">Complete overview of your personalized itinerary</p>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Trip Details - Left Column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Destination Card */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 p-6 rounded-xl border border-primary-200 shadow-soft">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-medium">
                        <span className="text-2xl">🌍</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-3 text-lg">Destination</h3>
                        {tripData.locations && tripData.locations.length > 0 ? (
                          <div className="space-y-2">
                            {tripData.locations.map((loc, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-white/80 px-4 py-2.5 rounded-lg border border-primary-200">
                                <span className="text-primary-600 font-semibold text-sm">📍</span>
                                <span className="text-gray-900 font-semibold">{loc.district}, {loc.state}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-white/80 px-4 py-2.5 rounded-lg border border-primary-200">
                            <p className="text-gray-900 font-semibold">
                              {tripData.district}, {tripData.state}, {tripData.country}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Travel Dates Card */}
                  <div className="bg-gradient-to-br from-accent-50 to-accent-100/50 p-6 rounded-xl border border-accent-200 shadow-soft">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center shadow-medium">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-4 text-lg">Travel Dates</h3>
                        {tripData.fromDate && tripData.toDate && (
                          <div className="space-y-3">
                            <div className="bg-white/80 p-4 rounded-lg border border-accent-200">
                              <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">Start Date</p>
                              <p className="text-gray-900 font-bold text-lg">
                                {new Date(tripData.fromDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            <div className="bg-white/80 p-4 rounded-lg border border-accent-200">
                              <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">End Date</p>
                              <p className="text-gray-900 font-bold text-lg">
                                {new Date(tripData.toDate).toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            {tripData.statistics && (
                              <div className="bg-white/80 px-4 py-3 rounded-lg border border-accent-200 flex items-center justify-between">
                                <span className="text-sm text-gray-600 font-medium">Trip Duration</span>
                                <span className="badge-primary text-base font-bold">
                                  {tripData.statistics.duration} {tripData.statistics.duration === 1 ? 'Day' : 'Days'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Travel Preferences Card */}
                  {tripData.preferences && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-soft">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center shadow-medium">
                          <span className="text-2xl">⚙️</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 mb-4 text-lg">Travel Preferences</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {tripData.preferences.travelStyle && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Style</p>
                                <p className="text-gray-900 font-semibold text-sm capitalize">
                                  {tripData.preferences.travelStyle === 'flexible' ? 'Flexible' : 'Fixed Package'}
                                </p>
                              </div>
                            )}
                            {tripData.preferences.pace && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Pace</p>
                                <p className="text-gray-900 font-semibold text-sm capitalize">
                                  {tripData.preferences.pace === 'fast' ? 'Fast Paced' : 'Slow Paced'}
                                </p>
                              </div>
                            )}
                            {tripData.preferences.transport && (
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-600 uppercase font-semibold mb-1">Transport</p>
                                <p className="text-gray-900 font-semibold text-sm capitalize">
                                  {tripData.preferences.transport === 'native' ? 'Native' : 'Luxury'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistics & Price - Right Column */}
                <div className="space-y-4">
                  {/* Trip Statistics Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 shadow-medium">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
                        <span className="text-xl">📊</span>
                      </div>
                      <h3 className="font-bold text-gray-800 text-lg">Trip Statistics</h3>
                    </div>
                    {tripData.statistics && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-soft text-center">
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">Activities</p>
                          <p className="text-3xl font-bold text-primary-600">{tripData.statistics.totalActivities}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-soft text-center">
                          <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">Hotels</p>
                          <p className="text-3xl font-bold text-primary-600">{tripData.statistics.totalHotels}</p>
                        </div>
                        {tripData.statistics.totalChauffeurDays > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-soft text-center">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">Chauffeur</p>
                            <p className="text-3xl font-bold text-primary-600">{tripData.statistics.totalChauffeurDays}</p>
                          </div>
                        )}
                        {tripData.statistics.totalCabDays > 0 && (
                          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-soft text-center">
                            <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5 tracking-wide">Cab Days</p>
                            <p className="text-3xl font-bold text-primary-600">{tripData.statistics.totalCabDays}</p>
                          </div>
                        )}
                        {tripData.statistics.hasGuide && (
                          <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg border-2 border-primary-300 shadow-soft text-center col-span-2">
                            <p className="text-xs text-primary-700 uppercase font-semibold mb-1.5 tracking-wide">Travel Guide</p>
                            <p className="text-lg font-bold text-primary-700 flex items-center justify-center gap-2">
                              <span>✓</span> Included
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown Card */}
                  {tripData.priceBreakdown && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 shadow-medium">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-xl">💰</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Price Breakdown</h3>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center bg-white/80 px-3 py-2 rounded-lg">
                          <span className="text-gray-700 text-sm font-medium">Activities</span>
                          <span className="font-bold text-gray-900">${tripData.priceBreakdown.activities.toFixed(2)}</span>
                        </div>
                        {tripData.priceBreakdown.hotels > 0 && (
                          <div className="flex justify-between items-center bg-white/80 px-3 py-2 rounded-lg">
                            <span className="text-gray-700 text-sm font-medium">Hotels</span>
                            <span className="font-bold text-gray-900">${tripData.priceBreakdown.hotels.toFixed(2)}</span>
                          </div>
                        )}
                        {tripData.priceBreakdown.chauffeur > 0 && (
                          <div className="flex justify-between items-center bg-white/80 px-3 py-2 rounded-lg">
                            <span className="text-gray-700 text-sm font-medium">Chauffeur</span>
                            <span className="font-bold text-gray-900">${tripData.priceBreakdown.chauffeur.toFixed(2)}</span>
                          </div>
                        )}
                        {tripData.priceBreakdown.guide > 0 && (
                          <div className="flex justify-between items-center bg-white/80 px-3 py-2 rounded-lg">
                            <span className="text-gray-700 text-sm font-medium">Guide</span>
                            <span className="font-bold text-gray-900">${tripData.priceBreakdown.guide.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="pt-3 mt-3 border-t-2 border-green-300 flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow-soft">
                          <span className="font-bold text-gray-900 text-base">Total</span>
                          <span className="font-bold text-green-600 text-2xl">${tripData.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Toggle and Interactive Map */}
            <div className="content-card mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h2 className="heading-secondary mb-2 flex items-center gap-2">
                    <span>🗺️</span> Your Trip Schedule
                  </h2>
                  <p className="text-gray-600">
                    View your itinerary as a list or on an interactive map
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'list'
                        ? 'bg-primary-500 text-white shadow-soft'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📋 List View
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      viewMode === 'map'
                        ? 'bg-primary-500 text-white shadow-soft'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🗺️ Map View
                  </button>
                </div>
              </div>

              {viewMode === 'map' && tripData.mapData && (
                <div className="mt-4">
                  <TripMap mapData={tripData.mapData} />
                </div>
              )}
            </div>

            {viewMode === 'list' && (
              <div className="space-y-6 mb-8">
              {tripData.schedule.map((day, idx) => (
                <div key={idx} className="card-professional overflow-hidden">
                  {/* Day Header with Gradient */}
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 md:p-8">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-large border-2 border-white/30">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="heading-tertiary text-white mb-1">
                          Day {idx + 1}
                        </h3>
                        <div className="space-y-1">
                          <p className="text-white/90 flex items-center gap-2 font-medium">
                            <span className="text-lg">📅</span> 
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          {day.activities && day.activities.length > 0 && (
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                              <span className="text-xs">⏰</span>
                              <span className="text-xs">
                                {day.activities.map((act: Activity) => act.startTime).filter((time: string, idx: number, arr: string[]) => arr.indexOf(time) === idx).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {day.activities && Array.isArray(day.activities) && day.activities.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                          <span className="text-white font-semibold">{day.activities.length}</span>
                          <span className="text-white/90 text-sm">Activities</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 md:p-8">
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Activities Section - Enhanced */}
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border-2 border-gray-200 shadow-soft">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center shadow-medium">
                          <span className="text-xl">🎯</span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg">Activities</h4>
                        {day.activities && day.activities.length > 0 && (
                          <span className="badge-primary ml-auto">{day.activities.length}</span>
                        )}
                      </div>
                      {(!day.activities || day.activities.length === 0) ? (
                        <div className="space-y-4">
                          <div className="text-center py-6">
                            <div className="text-4xl mb-2">🌴</div>
                            <p className="text-gray-500 font-medium">Free day - explore at your own pace!</p>
                            <p className="text-xs text-gray-400 mt-2">No activities scheduled for this day</p>
                          </div>
                          
                          {/* Intelligent Recommendations for Free Days */}
                          {loadingRecommendations[idx] ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                              <p className="text-sm text-gray-500 mt-2">Finding perfect experiences for you...</p>
                            </div>
                          ) : recommendations[idx] && recommendations[idx].length > 0 ? (
                            <div className="border-t-2 border-gray-200 pt-4">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">💡</span>
                                <h4 className="font-bold text-gray-800">Recommended for You</h4>
                                <span className="badge-primary text-xs ml-auto">{recommendations[idx].length} suggestions</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {recommendations[idx].map((rec: any, recIdx: number) => {
                                  const imageUrl = rec.imageUrl?.startsWith('http') 
                                    ? rec.imageUrl 
                                    : rec.imageUrl 
                                      ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${rec.imageUrl}`
                                      : null;
                                  
                                  return (
                                    <div key={recIdx} className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-primary-300 transition-all shadow-soft">
                                      {imageUrl && (
                                        <div className="w-full h-32 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                          <img 
                                            src={imageUrl} 
                                            alt={rec.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <h5 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{rec.title}</h5>
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-primary-600 font-bold text-sm">${rec.price}</span>
                                        {rec.provider?.rating > 0 && (
                                          <span className="badge-rating text-xs">
                                            ⭐ {rec.provider.rating.toFixed(1)}
                                          </span>
                                        )}
                                      </div>
                                      {rec.reasons && rec.reasons.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                          {rec.reasons.map((reason: string, rIdx: number) => (
                                            <span key={rIdx} className="text-xs px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md">
                                              {reason}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <button
                                        onClick={() => {
                                          // Add to bucketlist and refresh schedule
                                          api.post('/user/bucketlist', { experienceId: rec._id })
                                            .then(() => {
                                              // Recreate schedule with new experience
                                              createSchedule();
                                            })
                                            .catch(err => {
                                              console.error('Error adding to bucketlist:', err);
                                            });
                                        }}
                                        className="w-full btn-primary text-sm py-2 mt-2"
                                      >
                                        Add to Trip
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4 border-t-2 border-gray-200">
                              <p className="text-sm text-gray-500">No recommendations available for this location</p>
                              <button
                                onClick={() => fetchRecommendations(idx, day.date)}
                                className="text-primary-600 hover:text-primary-700 text-sm font-semibold mt-2"
                              >
                                Refresh Recommendations
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {day.activities && Array.isArray(day.activities) && day.activities.length > 0 ? day.activities.map((activity, actIdx) => {
                            console.log(`Rendering activity ${actIdx} for day:`, activity);
                            // Handle both populated and unpopulated activity formats
                            const activityTitle = activity.title || (activity.experienceId && typeof activity.experienceId === 'object' && activity.experienceId !== null ? (activity.experienceId as any).title : null) || 'Activity';
                            const activityPrice = activity.price || (activity.experienceId && typeof activity.experienceId === 'object' && activity.experienceId !== null ? (activity.experienceId as any).price : 0) || 0;
                            const activityStartTime = activity.startTime || '09:00';
                            const activityEndTime = activity.endTime || '17:00';
                            const activityDuration = activity.duration || 2;
                            const activityLocation = activity.location || (activity.experienceId && typeof activity.experienceId === 'object' && activity.experienceId !== null ? (activity.experienceId as any).location : null);
                            const activityProvider = activity.provider || (activity.experienceId && typeof activity.experienceId === 'object' && activity.experienceId !== null && (activity.experienceId as any).provider ? (activity.experienceId as any).provider : { name: 'Unknown' });
                            
                            return (
                              <li key={actIdx} className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-soft hover:border-primary-300 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1 pr-2">
                                    <h5 className="font-bold text-gray-900 text-base mb-1">{activityTitle}</h5>
                                    {/* Prominent Time Slot Display */}
                                    <div className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-200 w-fit">
                                      <span className="text-primary-600 font-semibold text-sm">⏰</span>
                                      <span className="font-bold text-primary-700 text-sm">
                                        {activityStartTime} - {activityEndTime}
                                      </span>
                                      <span className="text-primary-600 text-xs">({activityDuration}h)</span>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0 bg-primary-50 px-3 py-1 rounded-lg border border-primary-200">
                                    <span className="text-primary-700 font-bold text-sm">${activityPrice}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap mb-2">
                                  <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md">
                                    <span className="text-primary-600">📅</span>
                                    <span className="font-medium">{new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  {activityLocation && (
                                    <div className="badge-primary text-xs">
                                      📍 {activityLocation.district || activityLocation}
                                    </div>
                                  )}
                                </div>
                                <div className="pt-2 border-t border-gray-100">
                                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <span className="font-semibold">Host:</span>
                                    <span>{typeof activityProvider === 'object' ? activityProvider.name : activityProvider}</span>
                                  </p>
                                </div>
                              </li>
                            );
                          }) : (
                            <li className="text-center py-4 text-gray-500 text-sm">
                              No activities scheduled for this day
                            </li>
                          )}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Hotel Booking - Enhanced */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-soft">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                            <span className="text-xl">🏨</span>
                          </div>
                          <h4 className="font-bold text-gray-800 text-lg">Accommodation</h4>
                        </div>
                        {tripData.availableHotels && tripData.availableHotels.length > 0 ? (
                          <div className="space-y-3">
                            <select
                              value={selectedHotels[idx] || ''}
                              onChange={(e) => handleHotelChange(idx, e.target.value)}
                              className="input-field w-full"
                            >
                              <option value="">Select a hotel</option>
                              {tripData.availableHotels.map(hotel => (
                                <option key={hotel._id} value={hotel._id}>
                                  {hotel.name} - ${hotel.pricePerNight}/night {hotel.rating > 0 && `⭐ ${hotel.rating.toFixed(1)}`}
                                </option>
                              ))}
                            </select>
                            {selectedHotels[idx] && (() => {
                              const selectedHotel = tripData.availableHotels.find(h => h._id === selectedHotels[idx]);
                              if (!selectedHotel) return null;
                              return (
                                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-soft mt-3">
                                  <div className="flex items-start gap-3">
                                    {selectedHotel.images && selectedHotel.images.length > 0 && (() => {
                                      const imagesArray = Array.isArray(selectedHotel.images) ? selectedHotel.images : [];
                                      const mainImageObj = imagesArray.find((img: any) => typeof img === 'object' && img?.isMain) || imagesArray[0];
                                      const mainImage = typeof mainImageObj === 'string' ? mainImageObj : mainImageObj?.url || '';
                                      const imageUrl = mainImage.startsWith('http') 
                                        ? mainImage 
                                        : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${mainImage}`;
                                      return (
                                        <img 
                                          src={imageUrl} 
                                          alt={selectedHotel.name}
                                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                                        />
                                      );
                                    })()}
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="font-bold text-gray-900 text-sm">{selectedHotel.name}</p>
                                        {selectedHotel.rating > 0 && (
                                          <div className="badge-rating flex-shrink-0">
                                            ⭐ {selectedHotel.rating.toFixed(1)}
                                          </div>
                                        )}
                                      </div>
                                      {selectedHotel.description && (
                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedHotel.description}</p>
                                      )}
                                      {selectedHotel.amenities && selectedHotel.amenities.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {selectedHotel.amenities.slice(0, 3).map((amenity, aIdx) => (
                                            <span key={aIdx} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200 font-medium">
                                              {amenity}
                                            </span>
                                          ))}
                                          {selectedHotel.amenities.length > 3 && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                                              +{selectedHotel.amenities.length - 3} more
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No hotels available</p>
                        )}
                      </div>

                      {/* Chauffeur Option - Enhanced */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-soft">
                        <label className="flex items-center gap-4 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={chauffeurDays[idx] || false}
                            onChange={() => handleChauffeurToggle(idx)}
                            className="w-6 h-6 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">🚗</span>
                              <p className="font-bold text-gray-900">Chauffeur Service</p>
                            </div>
                            <p className="text-sm text-gray-600">Personal driver for the day</p>
                            <p className="text-xs text-primary-600 font-semibold mt-1">+$50 per day</p>
                          </div>
                        </label>
                      </div>

                      {day.guide && (
                        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-xl border-2 border-amber-200 shadow-soft">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">👤</span>
                            <h4 className="font-bold text-gray-800">Travel Guide</h4>
                          </div>
                          <p className="font-semibold text-gray-900 bg-white/80 px-3 py-2 rounded-lg border border-amber-200">
                            {day.guide.name || 'Local Guide'}
                          </p>
                        </div>
                      )}

                      {day.cab && (
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-5 rounded-xl border-2 border-teal-200 shadow-soft">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🚕</span>
                            <p className="font-bold text-gray-900">Cab Transfers</p>
                            <span className="badge-success ml-auto">Included</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
            )}

            <div className="content-card mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="heading-tertiary mb-2">Hotel & Services Selection</h2>
                  <p className="text-gray-600">Review and customize your accommodation and services</p>
                </div>
                <button
                  onClick={handleSaveHotels}
                  disabled={savingHotels}
                  className="btn-primary whitespace-nowrap disabled:opacity-50"
                >
                  {savingHotels ? 'Saving...' : 'Save Selections'}
                </button>
              </div>
            </div>

            <div className="bg-gradient-primary rounded-2xl shadow-large p-8 mb-8 text-white">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Total Trip Cost</h2>
                  <p className="text-white/90">Including all activities, hotels & services</p>
                </div>
                <div className="text-right">
                  <p className="text-5xl font-bold">${tripData.totalPrice.toFixed(2)}</p>
                  <p className="text-white/90 text-sm">All inclusive</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={() => router.push('/trips/select')}
                className="btn-secondary flex-1 py-4"
              >
                Modify Trip
              </button>
              <button
                onClick={handleProceedToPayment}
                className="btn-primary flex-1 text-lg py-4"
              >
                Proceed to Payment
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
