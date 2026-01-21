'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import TripMap from '@/components/TripMap';
import HotelBookingCard from '@/components/HotelBookingCard';
// ChauffeurSelectionCard removed - drivers no longer supported
import GuidePricingSelector, { PricingMode } from '@/components/GuidePricingSelector';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import PreferenceModal from '@/components/PreferenceModal';

interface Activity {
  experienceId: string | any;
  title: string;
  price: number;
  startTime: string;
  endTime: string;
  duration: number;
  imageUrl?: string;
  contentUrl?: string;
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
  guideHours?: {
    calculated?: number;
    adjusted?: number | null;
    final?: number;
  };
  cab: boolean;
  chauffeur?: boolean;
  chauffeurRequired?: boolean;
  assignedDriver?: string | any;
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
  guidePricingMode?: 'daily' | 'hourly';
}

// District coordinates fallback (Kerala districts)
const districtCoordinates: { [key: string]: { lat: number; lng: number } } = {
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'Kollam': { lat: 8.8932, lng: 76.6141 },
  'Pathanamthitta': { lat: 9.2648, lng: 76.7870 },
  'Alappuzha': { lat: 9.4981, lng: 76.3388 },
  'Kottayam': { lat: 9.5916, lng: 76.5222 },
  'Idukki': { lat: 9.9189, lng: 76.9444 },
  'Ernakulam': { lat: 9.9312, lng: 76.2673 },
  'Thrissur': { lat: 10.5276, lng: 76.2144 },
  'Palakkad': { lat: 10.7867, lng: 76.6548 },
  'Malappuram': { lat: 11.0404, lng: 76.0819 },
  'Kozhikode': { lat: 11.2588, lng: 75.7804 },
  'Wayanad': { lat: 11.6854, lng: 76.1320 },
  'Kannur': { lat: 11.8745, lng: 75.3704 },
  'Kasaragod': { lat: 12.4984, lng: 74.9899 }
};

// Helper function to get coordinates with fallback
const getCoordinates = (location: any): { lat: number; lng: number } | null => {
  if (location?.coordinates?.lat && location?.coordinates?.lng) {
    return { lat: location.coordinates.lat, lng: location.coordinates.lng };
  }
  if (location?.district && districtCoordinates[location.district]) {
    return districtCoordinates[location.district];
  }
  return null;
};

// Build mapData from schedule
const buildMapDataFromSchedule = (schedule: ScheduleDay[], hotels: Hotel[]): MapData => {
  const waypoints: MapData['waypoints'] = [];
  
  schedule.forEach((day, dayIdx) => {
    // Add activity waypoints
    day.activities.forEach((activity, actIdx) => {
      const coordinates = getCoordinates(activity.location);
      if (coordinates) {
        waypoints.push({
          type: 'activity',
          day: dayIdx + 1,
          index: actIdx,
          title: activity.title,
          coordinates: coordinates,
          location: `${activity.location?.district || 'Unknown'}, ${activity.location?.state || 'Unknown'}`,
          time: activity.startTime
        });
      }
    });
    
    // Add hotel waypoint if available
    if (day.hotel) {
      const hotel = hotels.find(h => h._id === day.hotel);
      if (hotel) {
        const coordinates = getCoordinates(hotel.location);
        if (coordinates) {
          waypoints.push({
            type: 'hotel',
            day: dayIdx + 1,
            name: hotel.name,
            coordinates: coordinates,
            location: `${hotel.location?.district || 'Unknown'}, ${hotel.location?.state || 'Unknown'}`
          });
        }
      }
    }
  });
  
  // Calculate bounds
  let bounds: MapData['bounds'] = null;
  if (waypoints.length > 0) {
    const lats = waypoints.map(w => w.coordinates.lat).filter(lat => lat !== null && lat !== undefined);
    const lngs = waypoints.map(w => w.coordinates.lng).filter(lng => lng !== null && lng !== undefined);
    
    if (lats.length > 0 && lngs.length > 0) {
      bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
    }
  }
  
  return {
    waypoints,
    route: [],
    bounds
  };
};

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
  const [selectedDrivers, setSelectedDrivers] = useState<{ [key: number]: string }>({});
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [showHotelSelection, setShowHotelSelection] = useState<{ [key: number]: boolean }>({});
  const [showDriverSelection, setShowDriverSelection] = useState<{ [key: number]: boolean }>({});
  const [savingHotels, setSavingHotels] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [recommendations, setRecommendations] = useState<{ [dayIndex: number]: any[] }>({});
  const [loadingRecommendations, setLoadingRecommendations] = useState<{ [dayIndex: number]: boolean }>({});
  const [guidePricingMode, setGuidePricingMode] = useState<PricingMode>('daily');
  const [selectedGuideInfo, setSelectedGuideInfo] = useState<any>(null);
  const [showPreferenceModal, setShowPreferenceModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const tripId = searchParams.get('tripId');
    
    // Get guideId from query params or sessionStorage
    const guideIdFromQuery = searchParams.get('guideId');
    const guideIdFromStorage = typeof window !== 'undefined' ? sessionStorage.getItem('selectedGuideId') : null;
    
    if (guideIdFromQuery || guideIdFromStorage) {
      setGuideId(guideIdFromQuery || guideIdFromStorage || '');
      // Clear from sessionStorage after reading
      if (guideIdFromStorage) {
        sessionStorage.removeItem('selectedGuideId');
      }
    }
    
    if (tripId) {
      fetchTrip(tripId);
    } else {
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
          // If experienceId is populated (object), preserve the full object for image access
          if (activity.experienceId && typeof activity.experienceId === 'object') {
            const experience = activity.experienceId;
            return {
              experienceId: experience, // Keep the full object, not just the ID
              experienceIdString: experience._id || experience, // Also keep ID as string for reference
              title: activity.title || experience.title || 'Untitled Experience',
              price: activity.price || experience.price || 0,
              startTime: activity.startTime || '09:00',
              endTime: activity.endTime || '17:00',
              duration: activity.duration || experience.duration || 2,
              imageUrl: activity.imageUrl || experience.imageUrl || null,
              contentUrl: activity.contentUrl || experience.contentUrl || null,
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
            experienceIdString: activity.experienceId,
            title: activity.title || 'Untitled Experience',
            price: activity.price || 0,
            startTime: activity.startTime || '09:00',
            endTime: activity.endTime || '17:00',
            duration: activity.duration || 2,
            imageUrl: activity.imageUrl || null,
            contentUrl: activity.contentUrl || null,
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
          guideHours: day.guideHours || {
            calculated: 0,
            adjusted: null,
            final: 0
          },
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
      
      // Build mapData from schedule if not provided
      let mapData = trip.mapData;
      if (!mapData && transformedSchedule.length > 0) {
        mapData = buildMapDataFromSchedule(transformedSchedule, availableHotels);
      }

      // Calculate price breakdown from schedule
      const priceBreakdown = {
        activities: 0,
        hotels: 0,
        chauffeur: 0,
        guide: 0
      };
      
      transformedSchedule.forEach((day: ScheduleDay) => {
        // Calculate activities cost
        day.activities.forEach(activity => {
          priceBreakdown.activities += activity.price || 0;
        });
        
        // Calculate hotel cost
        if (day.hotel && availableHotels) {
          const hotel = availableHotels.find((h: Hotel) => h._id === day.hotel);
          if (hotel) {
            priceBreakdown.hotels += hotel.pricePerNight || 0;
          }
        }
        
        // Calculate chauffeur cost ($50 per day)
        if (day.chauffeur) {
          priceBreakdown.chauffeur += 50;
        }
      });
      
      // Calculate cab cost ($30 per day for luxury transport) - based on preferences, not day.cab
      if (trip.preferences?.transport === 'luxury' && transformedSchedule.length > 0) {
        priceBreakdown.chauffeur += 30 * transformedSchedule.length;
      }
      
      // Calculate guide cost ($50 per day if guide exists)
      const hasGuide = transformedSchedule.some((day: ScheduleDay) => day.guide);
      if (hasGuide && transformedSchedule.length > 0) {
        priceBreakdown.guide = 50 * transformedSchedule.length;
      }
      
      // Calculate statistics from schedule
      const statistics = {
        duration: transformedSchedule.length,
        totalActivities: transformedSchedule.reduce((sum: number, day: ScheduleDay) => sum + (day.activities?.length || 0), 0),
        selectedExperiencesCount: transformedSchedule.reduce((sum: number, day: ScheduleDay) => sum + (day.activities?.length || 0), 0),
        totalHotels: transformedSchedule.filter((day: ScheduleDay) => day.hotel).length,
        totalChauffeurDays: transformedSchedule.filter((day: ScheduleDay) => day.chauffeur).length,
        totalCabDays: transformedSchedule.filter((day: ScheduleDay) => day.cab).length,
        hasGuide: hasGuide
      };

      // Convert trip data to TripData format
      setTripData({
        tripId: trip._id,
        schedule: transformedSchedule,
        totalPrice: trip.totalPrice || 0,
        availableHotels: availableHotels,
        mapData: mapData,
        fromDate: trip.fromDate,
        toDate: trip.toDate,
        country: trip.country,
        state: trip.state,
        district: trip.district,
        locations: trip.locations || [],
        preferences: trip.preferences || {},
        priceBreakdown: priceBreakdown,
        statistics: statistics
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
      
      // Initialize chauffeur selections from auto-assigned drivers
      const chauffeurs: { [key: number]: boolean } = {};
      const drivers: { [key: number]: string } = {};
      trip.schedule?.forEach((day: any, idx: number) => {
        // Check if chauffeur is required or already assigned
        if (day.chauffeur || day.chauffeurRequired) {
          chauffeurs[idx] = true;
        }
        // Use per-day assigned driver if available, otherwise use trip-level assigned driver
        if (day.assignedDriver) {
          drivers[idx] = typeof day.assignedDriver === 'string' 
            ? day.assignedDriver 
            : (day.assignedDriver._id || day.assignedDriver);
        } else if (trip.assignedDriver && day.chauffeur) {
          drivers[idx] = typeof trip.assignedDriver === 'string'
            ? trip.assignedDriver
            : (trip.assignedDriver._id || trip.assignedDriver);
        }
      });
      setChauffeurDays(chauffeurs);
      setSelectedDrivers(drivers);
      
      // Fetch available drivers for the trip dates
      if (trip.fromDate && trip.toDate) {
        try {
          const driversResponse = await api.get('/drivers/available', {
            params: {
              fromDate: new Date(trip.fromDate).toISOString().split('T')[0],
              toDate: new Date(trip.toDate).toISOString().split('T')[0]
            }
          });
          setAvailableDrivers(driversResponse.data.drivers || []);
        } catch (err) {
          // No drivers available or error - continue without drivers
          console.error('Error fetching drivers:', err);
        }
      }
      
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


  const createSchedule = async () => {
    // Check if user has preferences
    let hasPreferences = false;
    
    try {
      // First check localStorage for quick access
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.preferences?.travelStyle) {
              hasPreferences = true;
            }
          } catch (parseErr) {
            // Ignore parse errors, will check API
          }
        }
      }
      
      // If not found in localStorage, check API (with timeout)
      if (!hasPreferences) {
        try {
          const userResponse = await Promise.race([
            api.get('/user/me'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
          ]) as any;
          
          const userPreferences = userResponse?.data?.user?.preferences;
          if (userPreferences?.travelStyle) {
            hasPreferences = true;
            // Update localStorage
            if (typeof window !== 'undefined' && userResponse.data.user) {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                try {
                  const userData = JSON.parse(storedUser);
                  userData.preferences = userPreferences;
                  localStorage.setItem('user', JSON.stringify(userData));
                } catch (err) {
                  // Ignore
                }
              }
            }
          }
        } catch (checkErr) {
          // If API check fails or times out, proceed - backend will validate
          console.warn('Preference check failed, proceeding:', checkErr);
          hasPreferences = true; // Proceed to avoid blocking - backend will handle validation
        }
      }
    } catch (err) {
      // If localStorage check fails, proceed anyway - backend will handle it
      console.warn('Could not verify preferences, proceeding:', err);
      hasPreferences = true; // Assume preferences exist to avoid blocking
    }
    
    if (!hasPreferences) {
      setPendingAction(() => createSchedule);
      setShowPreferenceModal(true);
      return;
    }

    try {
      setCreatingSchedule(true);
      setError(''); // Clear any previous errors
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
        guideId: guideId || null,
        guidePricingMode: guidePricingMode
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
          // If experienceId is populated (object), preserve the full object for image access
          if (activity.experienceId && typeof activity.experienceId === 'object') {
            const experience = activity.experienceId;
            return {
              experienceId: experience, // Keep full object for image access
              title: activity.title || experience.title || 'Untitled Experience',
              price: activity.price || experience.price || 0,
              startTime: activity.startTime || '09:00',
              endTime: activity.endTime || '17:00',
              duration: activity.duration || experience.duration || 2,
              imageUrl: activity.imageUrl || experience.imageUrl || null,
              contentUrl: activity.contentUrl || experience.contentUrl || null,
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
            imageUrl: activity.imageUrl || null,
            contentUrl: activity.contentUrl || null,
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
          guideHours: day.guideHours || {
            calculated: 0,
            adjusted: null,
            final: 0
          },
          cab: day.cab || false,
          chauffeur: day.chauffeur || false,
          foodOrders: day.foodOrders || []
        };
      });

      // Build mapData from schedule if not provided
      let mapData = response.data.mapData;
      if (!mapData && transformedSchedule.length > 0) {
        mapData = buildMapDataFromSchedule(transformedSchedule, response.data.availableHotels || []);
      }

      // Calculate price breakdown from schedule
      const priceBreakdown = {
        activities: 0,
        hotels: 0,
        chauffeur: 0,
        guide: 0
      };
      
      transformedSchedule.forEach((day: ScheduleDay) => {
        // Calculate activities cost
        day.activities.forEach(activity => {
          priceBreakdown.activities += activity.price || 0;
        });
        
        // Calculate hotel cost
        if (day.hotel && response.data.availableHotels) {
          const hotel = response.data.availableHotels.find((h: Hotel) => h._id === day.hotel);
          if (hotel) {
            priceBreakdown.hotels += hotel.pricePerNight || 0;
          }
        }
        
        // Calculate chauffeur cost ($50 per day)
        if (day.chauffeur) {
          priceBreakdown.chauffeur += 50;
        }
      });
      
      // Calculate cab cost ($30 per day for luxury transport) - based on preferences
      if (response.data.preferences?.transport === 'luxury' && transformedSchedule.length > 0) {
        priceBreakdown.chauffeur += 30 * transformedSchedule.length;
      }
      
      // Calculate guide cost based on pricing mode
      if (guideId && transformedSchedule.length > 0) {
        if (guidePricingMode === 'hourly' && selectedGuideInfo) {
          // Calculate hourly cost
          let totalGuideHours = 0;
          transformedSchedule.forEach((day: ScheduleDay) => {
            const hours = day.guideHours?.final || day.guideHours?.calculated || 0;
            totalGuideHours += hours;
          });
          priceBreakdown.guide = (selectedGuideInfo.hourlyRate || 15) * totalGuideHours;
        } else {
          // Daily pricing
          priceBreakdown.guide = 50 * transformedSchedule.length;
        }
      }
      
      // Calculate statistics from schedule
      const statistics = {
        duration: transformedSchedule.length,
        totalActivities: transformedSchedule.reduce((sum: number, day: ScheduleDay) => sum + (day.activities?.length || 0), 0),
        selectedExperiencesCount: response.data.selectedExperiencesCount || transformedSchedule.reduce((sum: number, day: ScheduleDay) => sum + (day.activities?.length || 0), 0),
        totalHotels: transformedSchedule.filter((day: ScheduleDay) => day.hotel).length,
        totalChauffeurDays: transformedSchedule.filter((day: ScheduleDay) => day.chauffeur).length,
        totalCabDays: transformedSchedule.filter((day: ScheduleDay) => day.cab).length,
        hasGuide: !!guideId || transformedSchedule.some((day: ScheduleDay) => day.guide)
      };

      // Fetch guide info if guideId is set
      if (guideId) {
        try {
          const tripDataStr = sessionStorage.getItem('tripData');
          const trip = tripDataStr ? JSON.parse(tripDataStr) : {};
          const guideResponse = await api.get(`/hosts/guides/available`, {
            params: {
              fromDate: trip.fromDate || response.data.fromDate,
              toDate: trip.toDate || response.data.toDate
            }
          });
          const guide = guideResponse.data.guides?.find((g: any) => g._id === guideId);
          if (guide) {
            setSelectedGuideInfo(guide);
          }
        } catch (err) {
          console.error('Error fetching guide info:', err);
        }
      }

      setTripData({
        tripId: response.data.tripId,
        schedule: transformedSchedule,
        totalPrice: response.data.totalPrice,
        availableHotels: response.data.availableHotels || [],
        mapData: mapData,
        fromDate: response.data.fromDate,
        toDate: response.data.toDate,
        country: response.data.country,
        state: response.data.state,
        district: response.data.district,
        locations: response.data.locations || [],
        preferences: response.data.preferences || {},
        priceBreakdown: priceBreakdown,
        statistics: statistics,
        guidePricingMode: response.data.guidePricingMode || guidePricingMode
      });
      
      // Set guide pricing mode from response
      if (response.data.guidePricingMode) {
        setGuidePricingMode(response.data.guidePricingMode);
      }
      
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
      setLoading(false); // Reset loading state after successful schedule creation
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create schedule';
      // Check if error is about missing preferences
      if (errorMessage.includes('KYT questionnaire') || errorMessage.includes('preferences')) {
        setPendingAction(() => createSchedule);
        setShowPreferenceModal(true);
        setLoading(false); // Reset loading when showing preference modal
      } else {
        setError(errorMessage);
        setLoading(false); // Reset loading on error
      }
    } finally {
      setCreatingSchedule(false); // Always reset creating schedule state
    }
  };

  const handleHotelChange = (dayIndex: number, hotelId: string) => {
    setSelectedHotels({
      ...selectedHotels,
      [dayIndex]: hotelId
    });
  };

  const handleChauffeurToggle = (dayIndex: number) => {
    const newValue = !chauffeurDays[dayIndex];
    setChauffeurDays({
      ...chauffeurDays,
      [dayIndex]: newValue
    });
    
    // If enabling chauffeur, show driver selection
    if (newValue && !selectedDrivers[dayIndex]) {
      setShowDriverSelection({ ...showDriverSelection, [dayIndex]: true });
      fetchAvailableDrivers(dayIndex);
    } else if (!newValue) {
      // If disabling, clear driver selection
      const newSelectedDrivers = { ...selectedDrivers };
      delete newSelectedDrivers[dayIndex];
      setSelectedDrivers(newSelectedDrivers);
    }
  };

  const fetchAvailableDrivers = async (dayIndex: number) => {
    if (!tripData) return;
    
    try {
      setLoadingDrivers(true);
      const day = tripData.schedule[dayIndex];
      const response = await api.get('/drivers/available', {
        params: {
          fromDate: day.date,
          toDate: day.date
        }
      });
      setAvailableDrivers(response.data.drivers || []);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      setAvailableDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const handleDriverSelect = (dayIndex: number, driverId: string) => {
    setSelectedDrivers({
      ...selectedDrivers,
      [dayIndex]: driverId
    });
    setShowDriverSelection({ ...showDriverSelection, [dayIndex]: false });
  };

  const handleSaveHotels = async () => {
    try {
      setSavingHotels(true);
      if (!tripData) return;

      // Assign drivers for days with chauffeur service
      const driverAssignments: { [key: number]: string } = {};
      Object.keys(chauffeurDays).forEach((dayIdx) => {
        if (chauffeurDays[parseInt(dayIdx)] && selectedDrivers[parseInt(dayIdx)]) {
          driverAssignments[parseInt(dayIdx)] = selectedDrivers[parseInt(dayIdx)];
        }
      });

      // First, assign drivers if any
      for (const [dayIdx, driverId] of Object.entries(driverAssignments)) {
        try {
          await api.post(`/drivers/assign/${tripData.tripId}`, { driverId });
        } catch (err) {
          console.error(`Error assigning driver for day ${dayIdx}:`, err);
        }
      }

      const response = await api.put(`/trips/${tripData.tripId}/hotels`, {
        hotels: selectedHotels,
        chauffeur: chauffeurDays,
        assignedDriverId: driverAssignments[0] || null // For now, assign first day's driver to trip
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

  const handleModifyTrip = () => {
    if (!tripData) return;
    
    // Save current trip state to sessionStorage so it can be restored in the select page
    const tripState = {
      fromDate: tripData.fromDate,
      toDate: tripData.toDate,
      country: tripData.country || 'India',
      locations: tripData.locations || (tripData.state && tripData.district ? [{ state: tripData.state, district: tripData.district }] : [])
    };
    
    sessionStorage.setItem('tripData', JSON.stringify(tripState));
    router.push('/trips/select');
  };

  const handleClearAllActivities = async () => {
    if (!tripData) return;
    
    if (!confirm('Are you sure you want to delete all activities from this trip? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.put(`/trips/${tripData.tripId}/clear-activities`);
      
      // Update trip data with cleared activities
      const updatedSchedule = response.data.trip.schedule.map((day: any) => ({
        date: day.date,
        activities: [],
        hotel: day.hotel?._id || day.hotel || null,
        hotelSelected: day.hotelSelected || false,
        guide: day.guide?._id || day.guide || null,
        cab: day.cab || false,
        chauffeur: day.chauffeur || false,
        foodOrders: day.foodOrders || []
      }));

      setTripData({
        ...tripData,
        schedule: updatedSchedule,
        totalPrice: response.data.totalPrice
      });
      
      setError('');
      alert('All activities cleared successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear activities');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = useCallback(async (dayIndex: number, date: string) => {
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
  }, [tripData]);

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
  }, [tripData, fetchRecommendations]);

  if (loading || creatingSchedule) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-tourism">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-6"></div>
          <div className="text-2xl font-semibold text-white">Creating your personalized schedule...</div>
          {creatingSchedule && (
            <p className="text-white/80 mt-4 text-sm">This may take a few moments...</p>
          )}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Modern Hero Header with Glassmorphism */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 lg:p-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-4 tracking-tight">
                Your Perfect Itinerary
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Intelligently scheduled experiences, optimized routes, and personalized recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Modern Error Alert */}
        {error && (
          <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-800 font-medium flex-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Token Display */}
        {user && typeof user.tokens !== 'undefined' && (
          <div className="flex justify-center mb-8 animate-in fade-in duration-700">
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg backdrop-blur-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-amber-900">
                    {user.tokens} {user.tokens === 1 ? 'token' : 'tokens'} available
                  </div>
                  {user.tokens === 0 && (
                    <div className="text-xs text-amber-700 mt-0.5">Complete a trip to earn more</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guide Pricing Mode Selector - Only show if guide is selected */}
        {guideId && selectedGuideInfo && tripData && (
          <div className="mb-8">
            <GuidePricingSelector
              selectedMode={guidePricingMode}
              onModeChange={async (mode) => {
                setGuidePricingMode(mode);
                // Update pricing mode on backend if trip exists
                if (tripData.tripId) {
                  try {
                    await api.put(`/trips/${tripData.tripId}/guide-pricing-mode`, {
                      guidePricingMode: mode
                    });
                    // Refresh schedule to get updated pricing
                    createSchedule();
                  } catch (err) {
                    console.error('Error updating pricing mode:', err);
                  }
                }
              }}
              guideHourlyRate={selectedGuideInfo.hourlyRate || 15}
              estimatedHours={tripData.schedule.reduce((sum: number, day: ScheduleDay) => {
                const hours = day.guideHours?.final || day.guideHours?.calculated || 0;
                return sum + hours;
              }, 0) / (tripData.schedule.length || 1)}
              dailyRate={50}
            />
          </div>
        )}

        {tripData && (
          <React.Fragment>
            {/* Neat Trip Summary */}
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200 w-full">
              <div className="relative overflow-hidden rounded-2xl shadow-lg bg-white border border-gray-200/50 w-full">
                {/* Clean Header */}
                <div className="relative px-6 py-4 bg-gradient-to-r from-primary-600 to-accent-500">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-bold text-white">Trip Summary</h2>
                  </div>
                </div>
              
                {/* Content Section */}
                <div className="relative bg-white px-6 py-6">
                  <div className="grid lg:grid-cols-3 gap-6 w-full">
                    {/* Trip Details - Left Column */}
                    <div className="lg:col-span-2 min-w-0">
                      {/* Info Grid - All in one row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Destination */}
                        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 rounded-lg border border-blue-100/60 hover:border-blue-200 transition-colors">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 bg-blue-500/10 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Destination</span>
                          </div>
                          {tripData.locations && tripData.locations.length > 0 ? (
                            <div className="space-y-1.5">
                              {tripData.locations.map((loc, idx) => (
                                <p key={idx} className="text-sm font-semibold text-gray-900 leading-tight">{loc.district}, {loc.state}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900 leading-tight">
                              {tripData.district && tripData.state ? (
                                <>
                                  {tripData.district}, {tripData.state}
                                  {tripData.country && tripData.country !== 'India' && `, ${tripData.country}`}
                                </>
                              ) : (
                                tripData.country || 'Location not specified'
                              )}
                            </p>
                          )}
                        </div>

                        {/* Travel Dates */}
                        {tripData.fromDate && tripData.toDate && (
                          <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-4 rounded-lg border border-emerald-100/60 hover:border-emerald-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Dates</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-2 leading-tight">
                              {new Date(tripData.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(tripData.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            {tripData.statistics && (
                              <p className="text-xs text-emerald-600 font-semibold">
                                {tripData.statistics.duration} {tripData.statistics.duration === 1 ? 'Day' : 'Days'}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Travel Preferences - In same row */}
                        {tripData.preferences && (tripData.preferences.travelStyle || tripData.preferences.pace || tripData.preferences.transport) && (
                          <div className="bg-gradient-to-br from-slate-50/80 to-gray-50/80 p-4 rounded-lg border border-gray-100/60 hover:border-gray-200 transition-colors">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-7 h-7 bg-gray-500/10 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preferences</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {tripData.preferences.travelStyle && (
                                <span className="text-xs font-medium text-gray-700 bg-white/90 px-2.5 py-1 rounded-md border border-gray-200/80 shadow-sm">
                                  {tripData.preferences.travelStyle === 'flexible' ? 'Flexible' : 'Fixed Package'}
                                </span>
                              )}
                              {tripData.preferences.pace && (
                                <span className="text-xs font-medium text-gray-700 bg-white/90 px-2.5 py-1 rounded-md border border-gray-200/80 shadow-sm">
                                  {tripData.preferences.pace === 'fast' ? 'Fast Paced' : 'Slow Paced'}
                                </span>
                              )}
                              {tripData.preferences.transport && (
                                <span className="text-xs font-medium text-gray-700 bg-white/90 px-2.5 py-1 rounded-md border border-gray-200/80 shadow-sm">
                                  {tripData.preferences.transport === 'native' ? 'Native' : 'Luxury'}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statistics & Price - Right Column */}
                    <div className="space-y-4 min-w-0">
                  {/* Statistics */}
                  {tripData.statistics && (
                    <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 p-4 rounded-lg border border-indigo-100/60">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statistics</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-white/60 rounded-lg py-2.5">
                          <p className="text-2xl font-bold text-indigo-600 leading-none">{tripData.statistics.totalActivities}</p>
                          <p className="text-xs text-gray-600 mt-1.5 font-medium">Activities</p>
                        </div>
                        <div className="text-center bg-white/60 rounded-lg py-2.5">
                          <p className="text-2xl font-bold text-indigo-600 leading-none">{tripData.statistics.totalHotels}</p>
                          <p className="text-xs text-gray-600 mt-1.5 font-medium">Hotels</p>
                        </div>
                        {tripData.statistics.totalChauffeurDays > 0 && (
                          <div className="text-center bg-white/60 rounded-lg py-2.5">
                            <p className="text-2xl font-bold text-indigo-600 leading-none">{tripData.statistics.totalChauffeurDays}</p>
                            <p className="text-xs text-gray-600 mt-1.5 font-medium">Chauffeur</p>
                          </div>
                        )}
                        {tripData.statistics.hasGuide && (
                          <div className="text-center bg-indigo-100/50 rounded-lg py-2.5">
                            <p className="text-lg font-bold text-indigo-600 leading-none">✓</p>
                            <p className="text-xs text-gray-600 mt-1.5 font-medium">Guide</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern View Toggle and Interactive Map */}
            <div className="mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-xl p-6 lg:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2">Your Trip Schedule</h2>
                    <p className="text-gray-600 text-sm font-medium">
                      Review your itinerary and make final adjustments
                    </p>
                  </div>
                  <div className="inline-flex rounded-2xl border-2 border-gray-200 bg-gray-50/50 backdrop-blur-sm p-1.5 shadow-lg">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                        viewMode === 'list'
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      List View
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 ${
                        viewMode === 'map'
                          ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Map View
                    </button>
                  </div>
                </div>

                {viewMode === 'map' && (
                  <div className="mt-4">
                    <TripMap 
                      mapData={tripData.mapData || { waypoints: [], route: [], bounds: null }} 
                      schedule={tripData.schedule}
                      availableHotels={tripData.availableHotels || []}
                    />
                  </div>
                )}
              </div>
            </div>

            {viewMode === 'list' && (
              <div className="relative mb-12">
                {/* Modern Animated Vertical Timeline */}
                <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 hidden lg:block rounded-full shadow-lg"></div>
                
                <div className="space-y-20">
                {tripData.schedule.map((day, idx) => {
                  const dayDate = new Date(day.date);
                  const isToday = dayDate.toDateString() === new Date().toDateString();
                  
                  return (
                  <div key={idx} className="relative animate-in fade-in slide-in-from-left-6 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Modern Timeline Node with Pulse Animation */}
                    <div className="absolute left-0 top-8 hidden lg:flex items-center justify-center z-10" style={{ left: 'calc(3rem - 0.5rem)' }}>
                      <div className="relative">
                        {isToday && (
                          <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
                        )}
                        <div className={`relative w-4 h-4 rounded-full ${isToday ? 'bg-gradient-to-br from-primary-500 to-accent-500 ring-4 ring-primary-100 shadow-lg' : 'bg-gray-400 ring-2 ring-gray-200'} transition-all duration-300`}></div>
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="lg:ml-24">
                      {/* Ultra Modern Day Header */}
                      <div className="mb-10">
                        <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border-2 border-gray-200/50 shadow-xl p-6 lg:p-8 mb-8 hover:shadow-2xl transition-all duration-300">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-100/30 to-accent-100/30 rounded-full blur-3xl"></div>
                          <div className="relative flex items-start justify-between gap-6">
                            <div className="flex-1">
                              <div className="flex items-baseline gap-4 mb-4">
                                <h2 className="text-4xl lg:text-5xl font-extrabold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
                                  Day {idx + 1}
                                </h2>
                                {isToday && (
                                  <span className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                                    Today
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="font-semibold text-gray-900">
                                    {dayDate.toLocaleDateString('en-US', { 
                                      weekday: 'long', 
                                      month: 'long', 
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                                {day.activities && day.activities.length > 0 && (
                                  <div className="flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="w-2 h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
                                    <span className="font-semibold text-gray-700">{day.activities.length} {day.activities.length === 1 ? 'experience' : 'experiences'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activities Timeline */}
                      <div className="mb-10">
                        {(!day.activities || day.activities.length === 0) ? (
                          <div className="space-y-4">
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <p className="text-gray-700 font-medium mb-1">Free Day</p>
                            <p className="text-sm text-gray-500">No activities scheduled - explore at your own pace</p>
                          </div>
                          
                          {/* Intelligent Recommendations for Free Days */}
                          {loadingRecommendations[idx] ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary-500 border-t-transparent"></div>
                              <p className="text-sm text-gray-500 mt-2">Finding perfect experiences for you...</p>
                            </div>
                          ) : recommendations[idx] && recommendations[idx].length > 0 ? (
                            <div className="border-t border-gray-200 pt-5 mt-5">
                              <div className="flex items-center gap-2 mb-4">
                                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                <h4 className="font-semibold text-gray-900 text-sm">Recommended Experiences</h4>
                                <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{recommendations[idx].length}</span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {recommendations[idx].map((rec: any, recIdx: number) => {
                                  const imageUrl = rec.imageUrl?.startsWith('http') 
                                    ? rec.imageUrl 
                                    : rec.imageUrl 
                                      ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${rec.imageUrl}`
                                      : null;
                                  
                                  return (
                                    <div key={recIdx} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 hover:shadow-sm transition-all">
                                      {imageUrl && (
                                        <div className="w-full h-32 bg-gray-100 overflow-hidden">
                                          <img 
                                            src={imageUrl} 
                                            alt={rec.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="p-3">
                                        <h5 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 min-h-[2.5rem]">{rec.title}</h5>
                                      <div className="flex items-center justify-between mb-2">
                                          <span className="text-gray-900 font-semibold text-sm">${rec.price}</span>
                                        {rec.provider?.rating > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-gray-600">
                                              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                              </svg>
                                              <span className="font-medium">{rec.provider.rating.toFixed(1)}</span>
                                            </div>
                                        )}
                                      </div>
                                      {rec.reasons && rec.reasons.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mb-3">
                                            {rec.reasons.slice(0, 2).map((reason: string, rIdx: number) => (
                                              <span key={rIdx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded border border-gray-200">
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
                                          className="w-full bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
                                      >
                                        Add to Trip
                                      </button>
                                      </div>
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
                        <div className="space-y-4">
                          {day.activities && Array.isArray(day.activities) && day.activities.length > 0 ? day.activities.map((activity, actIdx) => {
                            // Handle both populated and unpopulated activity formats
                            const experienceData = activity.experienceId && typeof activity.experienceId === 'object' && activity.experienceId !== null ? activity.experienceId : null;
                            const activityTitle = activity.title || experienceData?.title || 'Activity';
                            const activityPrice = activity.price || experienceData?.price || 0;
                            const activityStartTime = activity.startTime || '09:00';
                            const activityEndTime = activity.endTime || '17:00';
                            const activityDuration = activity.duration || 2;
                            const activityLocation = activity.location || experienceData?.location || null;
                            const activityProvider = activity.provider || experienceData?.provider || { name: 'Unknown' };
                            
                            
                            // Get image URL - check multiple sources
                            // Priority: activity.imageUrl > activity.contentUrl > experienceData.imageUrl > experienceData.contentUrl
                            const getImageFromActivity = () => {
                              // Check activity.imageUrl (already extracted in transformation)
                              if (activity.imageUrl) {
                                if (Array.isArray(activity.imageUrl)) {
                                  return activity.imageUrl[0] || null;
                                }
                                if (typeof activity.imageUrl === 'string') {
                                  return activity.imageUrl;
                                }
                                if (typeof activity.imageUrl === 'object' && activity.imageUrl !== null) {
                                  return (activity.imageUrl as any).url || activity.imageUrl;
                                }
                              }
                              
                              // Check activity.contentUrl
                              if (activity.contentUrl) {
                                if (Array.isArray(activity.contentUrl)) {
                                  return activity.contentUrl[0] || null;
                                }
                                if (typeof activity.contentUrl === 'string') {
                                  return activity.contentUrl;
                                }
                                if (typeof activity.contentUrl === 'object' && activity.contentUrl !== null) {
                                  return (activity.contentUrl as any).url || activity.contentUrl;
                                }
                              }
                              
                              return null;
                            };
                            
                            const getImageFromExperience = () => {
                              if (!experienceData) return null;
                              
                              // Try imageUrl first
                              if (experienceData.imageUrl) {
                                if (Array.isArray(experienceData.imageUrl)) {
                                  const firstImg = experienceData.imageUrl[0];
                                  if (typeof firstImg === 'string') return firstImg;
                                  if (typeof firstImg === 'object' && firstImg !== null) {
                                    return (firstImg as any).url || firstImg;
                                  }
                                  return firstImg;
                                }
                                if (typeof experienceData.imageUrl === 'string') {
                                  return experienceData.imageUrl;
                                }
                                if (typeof experienceData.imageUrl === 'object' && experienceData.imageUrl !== null) {
                                  return (experienceData.imageUrl as any).url || experienceData.imageUrl;
                                }
                              }
                              
                              // Fallback to contentUrl
                              if (experienceData.contentUrl) {
                                if (Array.isArray(experienceData.contentUrl)) {
                                  const firstContent = experienceData.contentUrl[0];
                                  if (typeof firstContent === 'string') return firstContent;
                                  if (typeof firstContent === 'object' && firstContent !== null) {
                                    return (firstContent as any).url || firstContent;
                                  }
                                  return firstContent;
                                }
                                if (typeof experienceData.contentUrl === 'string') {
                                  return experienceData.contentUrl;
                                }
                                if (typeof experienceData.contentUrl === 'object' && experienceData.contentUrl !== null) {
                                  return (experienceData.contentUrl as any).url || experienceData.contentUrl;
                                }
                              }
                              
                              return null;
                            };
                            
                            // Get raw image URL (can be string, array, or object)
                            const rawImageUrl = getImageFromActivity() || getImageFromExperience();
                            const activityImageUrl = rawImageUrl ? getImageUrl(rawImageUrl) ?? undefined : undefined;
                            
                            // Debug logging - log first activity to troubleshoot
                            if (actIdx === 0) {
                              console.log('=== Image Debug Info ===');
                              console.log('Activity object:', activity);
                              console.log('Activity imageUrl:', activity.imageUrl);
                              console.log('Activity contentUrl:', activity.contentUrl);
                              console.log('Experience Data:', experienceData);
                              console.log('Experience imageUrl:', experienceData?.imageUrl);
                              console.log('Experience contentUrl:', experienceData?.contentUrl);
                              console.log('Raw Image URL:', rawImageUrl);
                              console.log('Final Image URL:', activityImageUrl);
                              console.log('API Base:', process.env.NEXT_PUBLIC_API_URL);
                              console.log('=======================');
                            }
                            
                            return (
                              <div key={actIdx} className="group relative overflow-hidden bg-white rounded-3xl border-2 border-gray-200/50 hover:border-primary-300/50 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1">
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 via-accent-50/0 to-primary-50/0 group-hover:from-primary-50/30 group-hover:via-accent-50/20 group-hover:to-primary-50/30 transition-all duration-500"></div>
                                
                                <div className="relative flex flex-col md:flex-row">
                                  {/* Ultra Modern Experience Image */}
                                  {activityImageUrl ? (
                                    <div className="relative w-full md:w-80 h-64 md:h-auto bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 overflow-hidden">
                                      <img
                                        src={activityImageUrl}
                                        alt={activityTitle}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        loading="lazy"
                                        crossOrigin="anonymous"
                                        onError={(e) => {
                                          console.error(`Failed to load image for activity ${actIdx}:`, activityImageUrl);
                                          console.error('Image URL that failed:', activityImageUrl);
                                          console.error('Raw image URL:', rawImageUrl);
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `
                                              <div class="w-full h-full bg-gradient-to-br from-primary-50 via-accent-50 to-primary-50 flex items-center justify-center">
                                                <div class="text-center p-6">
                                                  <div class="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                                    <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                  </div>
                                                  <p class="text-sm text-gray-600 font-semibold">Experience Image</p>
                                                </div>
                                              </div>
                                            `;
                                          }
                                        }}
                                      />
                                      {/* Enhanced gradient overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                                      {/* Modern Time Badge */}
                                      <div className="absolute top-4 left-4">
                                        <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/50">
                                          <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="text-sm font-bold text-gray-900">{activityStartTime}</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full md:w-80 h-64 md:h-auto bg-gradient-to-br from-primary-50 via-accent-50 to-primary-50 border-r-2 border-gray-200/50 flex items-center justify-center flex-shrink-0">
                                      <div className="text-center p-8">
                                        <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                          </svg>
                                        </div>
                                        <p className="text-sm text-gray-600 font-semibold">Experience Image</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Ultra Modern Content Section */}
                                  <div className="relative flex-1 p-6 lg:p-8 flex flex-col">
                                    {/* Time Badge - Only show if image exists */}
                                    {activityImageUrl && (
                                      <div className="flex-shrink-0 mb-6">
                                        <div className="flex items-center gap-4">
                                          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300">
                                            <div className="text-center">
                                              <div className="text-white text-sm font-bold leading-tight">{activityStartTime.split(':')[0]}</div>
                                              <div className="text-white/90 text-xs font-semibold">{activityStartTime.split(':')[1]}</div>
                                            </div>
                                          </div>
                                          <div className="bg-gradient-to-r from-primary-50 to-accent-50 px-4 py-2 rounded-xl border border-primary-200/50">
                                            <div className="text-xs text-gray-600 font-semibold mb-0.5">Duration</div>
                                            <div className="text-base font-bold text-gray-900">{activityDuration}h</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    
                                    <div className="flex gap-6 flex-1">
                                      {/* Time Badge - Show when no image */}
                                      {!activityImageUrl && (
                                        <div className="flex-shrink-0">
                                          <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/30 transform group-hover:scale-110 transition-transform duration-300">
                                              <div className="text-center">
                                                <div className="text-white text-sm font-bold leading-tight">{activityStartTime.split(':')[0]}</div>
                                                <div className="text-white/90 text-xs font-semibold">{activityStartTime.split(':')[1]}</div>
                                              </div>
                                            </div>
                                            <div className="mt-2 bg-gradient-to-r from-primary-50 to-accent-50 px-3 py-1 rounded-lg border border-primary-200/50">
                                              <div className="text-xs font-bold text-gray-700">{activityDuration}h</div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Enhanced Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-6 mb-6">
                                          <div className="flex-1 min-w-0">
                                            <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-4 leading-tight group-hover:bg-gradient-to-r group-hover:from-primary-600 group-hover:to-accent-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                                              {activityTitle}
                                            </h3>
                                            
                                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                              {activityLocation && (
                                                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                  </svg>
                                                  <span className="font-semibold">{activityLocation.district || activityLocation}</span>
                                                </div>
                                              )}
                                              {!activityImageUrl && (
                                                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                                  <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <span className="font-semibold">Until {activityEndTime}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Modern Price Display */}
                                          <div className="flex-shrink-0 text-right">
                                            <div className="inline-flex flex-col items-end bg-gradient-to-br from-green-50 to-emerald-50 px-5 py-3 rounded-2xl border-2 border-green-200/50 shadow-lg">
                                              <span className="text-3xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">${activityPrice}</span>
                                              <span className="text-xs text-gray-600 font-semibold mt-1">per person</span>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Enhanced Provider Info */}
                                        {typeof activityProvider === 'object' && activityProvider !== null && 'name' in activityProvider && (
                                          <div className="pt-5 border-t-2 border-gray-100">
                                            <div className="flex items-center gap-4 bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 rounded-xl border border-gray-200">
                                              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center shadow-md">
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                              </div>
                                              <div>
                                                <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-0.5">Hosted by</div>
                                                <div className="text-base font-bold text-gray-900">{(activityProvider as { name: string }).name}</div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }) : (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                              <p className="text-gray-500 text-sm">No activities scheduled for this day</p>
                            </div>
                          )}
                        </div>
                      )}
                      </div>

                      {/* Services Section - Sidebar Style */}
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Hotel Booking */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-ocean-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Accommodation</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Hotel for the night</p>
                              </div>
                            </div>
                            {selectedHotels[idx] && (
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">Selected</span>
                            )}
                          </div>
                        {tripData.availableHotels && tripData.availableHotels.length > 0 ? (
                          <div>
                            {!showHotelSelection[idx] ? (
                              <div>
                                {selectedHotels[idx] ? (
                                  <div className="mb-4">
                                    <HotelBookingCard
                                      hotel={tripData.availableHotels.find(h => h._id === selectedHotels[idx])!}
                                      isSelected={true}
                                      onSelect={() => {}}
                                      date={day.date}
                                    />
                                  </div>
                                ) : null}
                                <button
                                  onClick={() => setShowHotelSelection({ ...showHotelSelection, [idx]: true })}
                                  className="w-full btn-primary py-3"
                                >
                                  {selectedHotels[idx] ? 'Change Hotel' : 'Select Hotel'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                                  {tripData.availableHotels.map(hotel => (
                                    <HotelBookingCard
                                      key={hotel._id}
                                      hotel={hotel}
                                      isSelected={selectedHotels[idx] === hotel._id}
                                      onSelect={() => {
                                        handleHotelChange(idx, hotel._id);
                                        setShowHotelSelection({ ...showHotelSelection, [idx]: false });
                                      }}
                                      date={day.date}
                                    />
                                  ))}
                                </div>
                                <button
                                  onClick={() => setShowHotelSelection({ ...showHotelSelection, [idx]: false })}
                                  className="w-full btn-secondary py-2"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">No hotels available for this location</p>
                        )}
                        </div>

                        {/* Chauffeur/Driver Selection */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">Chauffeur Service</h4>
                                <p className="text-xs text-gray-500 mt-0.5">Personal driver</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={chauffeurDays[idx] || false}
                                onChange={() => handleChauffeurToggle(idx)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 peer-focus:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>

                        {chauffeurDays[idx] && (
                          <div className="mt-4 pt-4 border-t border-purple-200">
                            {/* Show auto-assigned message if driver was auto-assigned */}
                            {day.assignedDriver && day.chauffeurRequired && !selectedDrivers[idx] && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-blue-900 mb-1">Driver Auto-Assigned</p>
                                    <p className="text-xs text-blue-700">A driver has been automatically assigned based on your experience locations. You can change this selection below.</p>
                                  </div>
                                </div>
                              </div>
                            )}
                            {!showDriverSelection[idx] ? (
                              <div>
                                {selectedDrivers[idx] ? (
                                  <div className="mb-4">
                                    {(() => {
                                      const selectedDriver = availableDrivers.find(d => d._id === selectedDrivers[idx]);
                                      if (!selectedDriver) {
                                        // If driver not in availableDrivers list, show a placeholder
                                        return (
                                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <p className="text-sm font-semibold text-gray-900 mb-1">Driver Assigned</p>
                                            <p className="text-xs text-gray-600">Driver ID: {selectedDrivers[idx]}</p>
                                            <p className="text-xs text-gray-500 mt-2">Click "Change Driver" to see details or select a different driver.</p>
                                          </div>
                                        );
                                      }
                                      return (
                                        <ChauffeurSelectionCard
                                          driver={selectedDriver}
                                          isSelected={true}
                                          onSelect={() => {}}
                                          date={day.date}
                                        />
                                      );
                                    })()}
                                  </div>
                                ) : day.assignedDriver ? (
                                  <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <p className="text-sm text-gray-700 mb-2">Driver assigned but details not loaded</p>
                                    <p className="text-xs text-gray-500">Click "Select Driver" to view and manage your driver selection.</p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600 mb-4 text-center">No driver selected yet</p>
                                )}
                                <button
                                  onClick={() => {
                                    setShowDriverSelection({ ...showDriverSelection, [idx]: true });
                                    fetchAvailableDrivers(idx);
                                  }}
                                  className="w-full btn-primary py-3"
                                  disabled={loadingDrivers}
                                >
                                  {loadingDrivers ? 'Loading Drivers...' : selectedDrivers[idx] ? 'Change Driver' : 'Select Driver'}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {loadingDrivers ? (
                                  <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                                    <p className="text-sm text-gray-600">Loading available drivers...</p>
                                  </div>
                                ) : availableDrivers.length > 0 ? (
                                  <>
                                    <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto p-2">
                                      {availableDrivers.map(driver => (
                                        <ChauffeurSelectionCard
                                          key={driver._id}
                                          driver={driver}
                                          isSelected={selectedDrivers[idx] === driver._id}
                                          onSelect={() => handleDriverSelect(idx, driver._id)}
                                          date={day.date}
                                        />
                                      ))}
                                    </div>
                                    <button
                                      onClick={() => setShowDriverSelection({ ...showDriverSelection, [idx]: false })}
                                      className="w-full btn-secondary py-2"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <div className="text-center py-8">
                                    <p className="text-sm text-gray-600 mb-4">No drivers available for this date</p>
                                    <button
                                      onClick={() => setShowDriverSelection({ ...showDriverSelection, [idx]: false })}
                                      className="btn-secondary"
                                    >
                                      Close
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>

                      {/* Additional Services */}
                      {day.guide && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <div className="text-xs text-gray-500 font-medium mb-0.5">Travel Guide</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {typeof day.guide === 'object' ? day.guide.name : 'Local Guide'}
                                </div>
                                {guidePricingMode === 'hourly' && day.guideHours && (
                                  <div className="text-xs text-gray-600 mt-1">
                                    {day.guideHours.final || day.guideHours.calculated || 0} hours
                                    {selectedGuideInfo && (
                                      <span className="ml-2 text-primary-600 font-semibold">
                                        ${((day.guideHours.final || day.guideHours.calculated || 0) * (selectedGuideInfo.hourlyRate || 15)).toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {guidePricingMode === 'daily' && (
                              <div className="text-sm font-semibold text-primary-600">$50/day</div>
                            )}
                          </div>
                        </div>
                      )}

                      {day.cab && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-5 mt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-ocean-50 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-ocean-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 font-medium mb-0.5">Transfers</div>
                                <div className="text-sm font-semibold text-gray-900">Cab Service</div>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-lg border border-green-200">Included</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                </div>
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

            {/* Ultra Modern Total Cost Display */}
            <div className="relative mb-10 overflow-hidden rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-accent-500 to-primary-600"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
              <div className="relative p-8 lg:p-12 text-white">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-2">Total Trip Cost</h2>
                        <p className="text-white/90 text-base font-medium">Including all activities, hotels & services</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl lg:text-6xl font-extrabold mb-2 drop-shadow-lg">${tripData.totalPrice.toFixed(2)}</p>
                    <p className="text-white/90 text-sm font-semibold bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block border border-white/20">All inclusive</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-600">
              <button
                onClick={handleClearAllActivities}
                disabled={loading || !tripData || tripData.schedule.every(day => !day.activities || day.activities.length === 0)}
                className="group relative flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-2xl font-bold text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:hover:translate-y-0"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {loading ? 'Clearing...' : 'Clear All Activities'}
                </div>
              </button>
              <button
                onClick={handleModifyTrip}
                className="group relative flex-1 py-4 px-6 bg-white border-2 border-gray-300 rounded-2xl font-bold text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Modify Trip
                </div>
              </button>
              <button
                onClick={handleProceedToPayment}
                className="group relative flex-1 py-4 px-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl font-bold text-white hover:from-primary-600 hover:to-accent-600 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2 text-lg">
                  <span>Proceed to Payment</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            </div>
          </React.Fragment>
        )}
      </div>

      {/* Preference Modal */}
      <PreferenceModal
        isOpen={showPreferenceModal}
        onClose={() => {
          setShowPreferenceModal(false);
          setPendingAction(null);
          setCreatingSchedule(false); // Reset loading state if modal is closed
        }}
        onSuccess={async () => {
          try {
            // Refresh user data to get updated preferences
            const userResponse = await api.get('/user/me');
            if (userResponse.data.user && typeof window !== 'undefined') {
              const storedUser = localStorage.getItem('user');
              if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.preferences = userResponse.data.user.preferences;
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('Updated user preferences in localStorage:', userData.preferences);
              } else {
                // If no stored user, create one with preferences
                const newUserData = {
                  id: userResponse.data.user._id || userResponse.data.user.id,
                  email: userResponse.data.user.email,
                  phoneNumber: userResponse.data.user.phoneNumber,
                  name: userResponse.data.user.name,
                  tokens: userResponse.data.user.tokens,
                  preferences: userResponse.data.user.preferences
                };
                localStorage.setItem('user', JSON.stringify(newUserData));
                console.log('Created new user data with preferences:', newUserData.preferences);
              }
            }
            
            // Wait a moment to ensure localStorage is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Close modal
            setShowPreferenceModal(false);
            
            // Wait a moment for modal to close
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Retry the pending action
            if (pendingAction) {
              const action = pendingAction;
              setPendingAction(null);
              // Execute the action
              try {
                console.log('Retrying createSchedule after preferences saved');
                await action();
              } catch (err: any) {
                console.error('Error executing pending action:', err);
                const errorMessage = err?.response?.data?.message || err?.message || 'Failed to create schedule';
                setError(errorMessage);
                setCreatingSchedule(false);
              }
            }
          } catch (err: any) {
            console.error('Error in onSuccess handler:', err);
            setShowPreferenceModal(false);
            setPendingAction(null);
            setCreatingSchedule(false);
            setError(err?.response?.data?.message || err?.message || 'Failed to refresh preferences. Please try again.');
          }
        }}
      />
    </div>
  );
}

