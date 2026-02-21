'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import type { MapRef } from 'react-map-gl';

// Dynamically import Mapbox GL to avoid SSR issues
const Map = dynamic(() => import('react-map-gl').then(mod => mod.Map), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>
});
const Marker = dynamic(() => import('react-map-gl').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-map-gl').then(mod => mod.Popup), { ssr: false });
const Source = dynamic(() => import('react-map-gl').then(mod => mod.Source), { ssr: false });
const Layer = dynamic(() => import('react-map-gl').then(mod => mod.Layer), { ssr: false });

interface Waypoint {
  type: 'activity' | 'hotel';
  day: number;
  index?: number;
  title?: string;
  name?: string;
  coordinates: { lat: number; lng: number };
  location: string;
  time?: string;
}

interface MapData {
  waypoints: Waypoint[];
  route: Array<{ district: string; state: string; coordinates: { lat: number; lng: number } | null }>;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
}

interface TripMapProps {
  mapData: MapData;
  schedule?: Array<{
    date: string;
    activities: Array<{
      title: string;
      startTime: string;
      endTime: string;
      location?: any; // Can be object with coordinates or district/state
    }>;
    hotel?: any; // Can be ID or object with location
  }>;
  availableHotels?: Array<{
    _id: string;
    name: string;
    location?: any;
  }>;
}

export default function TripMap({ mapData, schedule, availableHotels = [] }: TripMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAllDays, setShowAllDays] = useState(true);
  const [routeData, setRouteData] = useState<{ [day: number]: Array<[number, number]> }>({});
  const [optimizedRoutes, setOptimizedRoutes] = useState<{ [day: number]: any }>({});
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeStats, setRouteStats] = useState<{ [day: number]: { distance: number; duration: number } }>({});
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [hoveredWaypoint, setHoveredWaypoint] = useState<Waypoint | null>(null);
  const [mapStyle, setMapStyle] = useState<string>('mapbox://styles/mapbox/navigation-day-v1');

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  // Helper function to get coordinates (same logic as schedule page)
  const getCoordinates = (location: any) => {
    // First try to get from location.coordinates
    if (location?.coordinates?.lat && location?.coordinates?.lng) {
      return {
        lat: location.coordinates.lat,
        lng: location.coordinates.lng
      };
    }
    
    // Fallback to district coordinates (Kerala districts)
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
    
    if (location?.district && districtCoordinates[location.district]) {
      return districtCoordinates[location.district];
    }
    
    return null;
  };

  // Build mapData from schedule if not provided
  const displayMapData = useMemo(() => {
    if (mapData && mapData.waypoints && mapData.waypoints.length > 0) {
      return mapData;
    }
    
    if (schedule && schedule.length > 0) {
      const waypoints: Waypoint[] = [];
      schedule.forEach((day, dayIdx) => {
        // Add activity waypoints
        day.activities?.forEach((activity, actIdx) => {
          const coordinates = getCoordinates(activity.location);
          if (coordinates) {
            const loc = activity.location as any;
            waypoints.push({
              type: 'activity',
              day: dayIdx + 1,
              index: actIdx,
              title: activity.title,
              coordinates: coordinates,
              location: `${loc?.district || 'Unknown'}, ${loc?.state || 'Unknown'}`,
              time: activity.startTime
            });
          }
        });
        
        // Add hotel waypoint if available
        if (day.hotel) {
          let hotelData = null;
          
          // If hotel is an object with location
          if (typeof day.hotel === 'object' && day.hotel !== null && day.hotel.location) {
            hotelData = day.hotel;
          } 
          // If hotel is an ID, find it in availableHotels
          else if (typeof day.hotel === 'string' && availableHotels.length > 0) {
            hotelData = availableHotels.find((h: any) => h._id === day.hotel || h._id.toString() === day.hotel.toString());
          }
          
          if (hotelData && hotelData.location) {
            const coordinates = getCoordinates(hotelData.location);
            if (coordinates) {
              const loc = hotelData.location as any;
              waypoints.push({
                type: 'hotel',
                day: dayIdx + 1,
                name: hotelData.name || 'Hotel',
                coordinates: coordinates,
                location: `${loc?.district || 'Unknown'}, ${loc?.state || 'Unknown'}`
              });
            }
          }
        }
      });
      
      if (waypoints.length > 0) {
        return {
          waypoints,
          route: [],
          bounds: null
        };
      }
    }
    
    return null;
  }, [mapData, schedule, availableHotels]);

  // Calculate center and bounds
  const validWaypoints = useMemo(() => {
    if (!displayMapData || !displayMapData.waypoints) return [];
    const valid = displayMapData.waypoints.filter(w => w.coordinates && w.coordinates.lat && w.coordinates.lng);
    // Debug: Log waypoints to verify activities are included
    if (valid.length > 0) {
      const activities = valid.filter(w => w.type === 'activity');
      const hotels = valid.filter(w => w.type === 'hotel');
      console.log(`TripMap: ${activities.length} activities, ${hotels.length} hotels`);
    }
    return valid;
  }, [displayMapData]);

  // Group waypoints by day for better visualization
  const waypointsByDay = useMemo(() => {
    const wpsByDay: { [day: number]: Waypoint[] } = {};
    validWaypoints.forEach(wp => {
      if (!wpsByDay[wp.day]) {
        wpsByDay[wp.day] = [];
      }
      wpsByDay[wp.day].push(wp);
    });

    // Sort waypoints within each day by time
    Object.keys(wpsByDay).forEach(day => {
      wpsByDay[parseInt(day)].sort((a, b) => {
        if (a.time && b.time) {
          return a.time.localeCompare(b.time);
        }
        return 0;
      });
    });

    return wpsByDay;
  }, [validWaypoints]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate routes for each day (straight lines as fallback)
  useEffect(() => {
    if (validWaypoints.length === 0) {
      setRouteData({});
      return;
    }

    const routes: { [day: number]: Array<[number, number]> } = {};
    
    Object.keys(waypointsByDay).forEach(dayStr => {
      const day = parseInt(dayStr);
      const dayWaypoints = waypointsByDay[day];
      
      // Create route by connecting waypoints in order
      // Convert to [lng, lat] format for GeoJSON
      const route: Array<[number, number]> = [];
      dayWaypoints.forEach(wp => {
        route.push([wp.coordinates.lng, wp.coordinates.lat]);
      });
      
      routes[day] = route;
    });
    
    setRouteData(routes);
  }, [validWaypoints, waypointsByDay]);

  // Fetch optimized routes with real road paths
  useEffect(() => {
    const fetchOptimizedRoutes = async () => {
      if (Object.keys(waypointsByDay).length === 0) {
        setOptimizedRoutes({});
        setRouteStats({});
        return;
      }

      setLoadingRoutes(true);
      try {
        // Convert waypoints to format expected by backend
        const waypointsByDayForBackend: { [day: number]: Array<{ type: string; coordinates: { lat: number; lng: number } }> } = {};
        Object.keys(waypointsByDay).forEach(dayStr => {
          const day = parseInt(dayStr);
          waypointsByDayForBackend[day] = waypointsByDay[day].map(wp => ({
            type: wp.type,
            coordinates: {
              lat: wp.coordinates.lat,
              lng: wp.coordinates.lng
            }
          }));
        });

        const response = await api.post('/routes/optimize-days', {
          waypointsByDay: waypointsByDayForBackend
        });

        if (response.data && response.data.success && response.data.routes) {
          const routes: { [day: number]: any } = {};
          const stats: { [day: number]: { distance: number; duration: number } } = {};
          
          Object.keys(response.data.routes).forEach(dayStr => {
            const day = parseInt(dayStr);
            const route = response.data.routes[day];
            
            // Convert route geometry from [lat, lng] to [lng, lat] for GeoJSON
            if (route.geometry && Array.isArray(route.geometry)) {
              routes[day] = {
                geometry: route.geometry.map((coord: [number, number]) => [coord[1], coord[0]]),
                distance: route.totalDistance || 0,
                duration: route.totalDuration || 0,
                segments: route.segments || []
              };
            }
            
            stats[day] = {
              distance: route.totalDistance || 0,
              duration: route.totalDuration || 0
            };
          });
          
          setOptimizedRoutes(routes);
          setRouteStats(stats);
        }
      } catch (error) {
        console.error('Error fetching optimized routes:', error);
        // Continue with straight-line routes if optimization fails
      } finally {
        setLoadingRoutes(false);
      }
    };

    fetchOptimizedRoutes();
  }, [waypointsByDay]);

  // Filter waypoints based on selected day
  const displayedWaypoints = useMemo(() => {
    if (validWaypoints.length === 0) return [];
    if (showAllDays) {
      return validWaypoints;
    }
    if (selectedDay !== null) {
      return validWaypoints.filter(wp => wp.day === selectedDay);
    }
    return validWaypoints;
  }, [validWaypoints, selectedDay, showAllDays]);

  // Calculate center based on displayed waypoints (in [lng, lat] format for Mapbox)
  const center = useMemo(() => {
    if (displayedWaypoints.length === 0) return [76.5, 10.5]; // Default Kerala center [lng, lat]
    const avgLat = displayedWaypoints.reduce((sum, w) => sum + w.coordinates.lat, 0) / displayedWaypoints.length;
    const avgLng = displayedWaypoints.reduce((sum, w) => sum + w.coordinates.lng, 0) / displayedWaypoints.length;
    return [avgLng, avgLat]; // [lng, lat] for Mapbox
  }, [displayedWaypoints]) as [number, number];

  // Get route coordinates for displayed day(s) - use optimized routes if available
  const displayedRoutes = useMemo(() => {
    const routes: Array<{ geometry: Array<[number, number]>, day: number, stats?: any }> = [];
    
    if (showAllDays) {
      Object.keys(waypointsByDay).forEach(dayStr => {
        const day = parseInt(dayStr);
        if (optimizedRoutes[day] && optimizedRoutes[day].geometry && optimizedRoutes[day].geometry.length > 0) {
          routes.push({
            geometry: optimizedRoutes[day].geometry,
            day: day,
            stats: routeStats[day]
          });
        } else if (routeData[day]) {
          routes.push({
            geometry: routeData[day],
            day: day
          });
        }
      });
    } else if (selectedDay !== null) {
      if (optimizedRoutes[selectedDay] && optimizedRoutes[selectedDay].geometry && optimizedRoutes[selectedDay].geometry.length > 0) {
        routes.push({
          geometry: optimizedRoutes[selectedDay].geometry,
          day: selectedDay,
          stats: routeStats[selectedDay]
        });
      } else if (routeData[selectedDay]) {
        routes.push({
          geometry: routeData[selectedDay],
          day: selectedDay
        });
      }
    }
    
    return routes;
  }, [routeData, optimizedRoutes, selectedDay, showAllDays, waypointsByDay, routeStats]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Calculate total distance for a day
  const calculateDayDistance = (day: number): number => {
    const dayWaypoints = waypointsByDay[day] || [];
    let totalDistance = 0;
    
    for (let i = 0; i < dayWaypoints.length - 1; i++) {
      const wp1 = dayWaypoints[i];
      const wp2 = dayWaypoints[i + 1];
      totalDistance += calculateDistance(
        wp1.coordinates.lat, wp1.coordinates.lng,
        wp2.coordinates.lat, wp2.coordinates.lng
      );
    }
    
    return totalDistance;
  };

  // Calculate zoom level based on bounds
  const zoomLevel = useMemo(() => {
    if (displayMapData?.bounds) {
      const latDiff = displayMapData.bounds.north - displayMapData.bounds.south;
      const lngDiff = displayMapData.bounds.east - displayMapData.bounds.west;
      const maxDiff = Math.max(latDiff, lngDiff);
      
      if (maxDiff > 5) return 7;
      else if (maxDiff > 2) return 8;
      else if (maxDiff > 1) return 9;
      else if (maxDiff > 0.5) return 10;
      else return 11;
    }
    return 10;
  }, [displayMapData]);

  // Fit map bounds to waypoints
  useEffect(() => {
    if (mapRef && displayedWaypoints.length > 0) {
      const bounds = displayedWaypoints.reduce((acc, wp) => {
        return {
          minLng: Math.min(acc.minLng, wp.coordinates.lng),
          maxLng: Math.max(acc.maxLng, wp.coordinates.lng),
          minLat: Math.min(acc.minLat, wp.coordinates.lat),
          maxLat: Math.max(acc.maxLat, wp.coordinates.lat),
        };
      }, {
        minLng: displayedWaypoints[0].coordinates.lng,
        maxLng: displayedWaypoints[0].coordinates.lng,
        minLat: displayedWaypoints[0].coordinates.lat,
        maxLat: displayedWaypoints[0].coordinates.lat,
      });

      mapRef.fitBounds(
        [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
        { padding: 50, duration: 1000 }
      );
    }
  }, [mapRef, displayedWaypoints, selectedDay, showAllDays]);

  // Early returns after all hooks
  if (!isMounted) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-gray-200 shadow-medium">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Mapbox Token Required</h3>
          <p className="text-gray-600 mb-4">Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file</p>
          <p className="text-sm text-gray-500">Get your free token at: https://account.mapbox.com/access-tokens/</p>
        </div>
      </div>
    );
  }

  if (!displayMapData || !displayMapData.waypoints || displayMapData.waypoints.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex flex-col items-center justify-center border-2 border-gray-200 shadow-medium">
        <div className="text-center p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
            <span className="text-4xl">🗺️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Map Data Not Available</h3>
          <p className="text-gray-600 mb-4">We're working on loading your trip map. Please ensure your experiences have location coordinates.</p>
          <p className="text-sm text-gray-500">Try refreshing or creating a new schedule.</p>
        </div>
      </div>
    );
  }

  if (validWaypoints.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">No coordinates available for map display</p>
      </div>
    );
  }

  // Different colors for different days - Travel themed palette
  const routeColors = ['#00bcd4', '#009688', '#ff9800', '#9c27b0', '#ffc107', '#00acc1', '#ff6f00'];

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-medium relative" style={{ position: 'relative' }}>
      <Map
        ref={setMapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom: zoomLevel
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        scrollZoom={true}
        doubleClickZoom={true}
        dragRotate={false}
        touchZoomRotate={true}
        onMove={(evt) => {
          // Optional: track map movement
        }}
        interactiveLayerIds={[]}
      >
        {/* Route polylines for each day - optimized real road routes */}
        {displayedRoutes.map((route, routeIdx) => {
          if (!route.geometry || route.geometry.length < 2) return null;
          
          const color = routeColors[routeIdx % routeColors.length];
          
          // Create GeoJSON LineString for the route
          const routeGeoJSON = {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: route.geometry
            },
            properties: {
              day: route.day,
              color: color
            }
          };

          return (
            <Source key={`route-${route.day}-${routeIdx}`} id={`route-${route.day}-${routeIdx}`} type="geojson" data={routeGeoJSON}>
              <Layer
                id={`route-line-${route.day}-${routeIdx}`}
                type="line"
                paint={{
                  'line-color': color,
                  'line-width': 5,
                  'line-opacity': showAllDays ? 0.6 : 0.9
                }}
              />
            </Source>
          );
        })}

        {/* Markers for each waypoint */}
        {displayedWaypoints.map((waypoint, idx) => {
          const isHotel = waypoint.type === 'hotel';
          const isHovered = hoveredWaypoint === waypoint;
          const isSelected = selectedWaypoint === waypoint;
          
          return (
            <Marker
              key={`${waypoint.type}-${idx}-${waypoint.coordinates.lat}-${waypoint.coordinates.lng}`}
              longitude={waypoint.coordinates.lng}
              latitude={waypoint.coordinates.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedWaypoint(waypoint);
                // Zoom to waypoint
                if (mapRef) {
                  mapRef.flyTo({
                    center: [waypoint.coordinates.lng, waypoint.coordinates.lat],
                    zoom: 15,
                    duration: 1000
                  });
                }
              }}
            >
              <div
                className={`cursor-pointer transform transition-all duration-200 ${
                  isHovered || isSelected ? 'scale-125 z-50' : 'scale-100'
                }`}
                onMouseEnter={() => setHoveredWaypoint(waypoint)}
                onMouseLeave={() => setHoveredWaypoint(null)}
                style={{
                  filter: isHovered || isSelected ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                }}
              >
                {/* Custom marker with better visibility */}
                <div className={`relative ${isHotel ? 'text-blue-600' : 'text-green-600'}`}>
                  {/* Outer ring for better visibility */}
                  <div 
                    className={`absolute inset-0 rounded-full ${
                      isHotel 
                        ? 'bg-blue-200 border-2 border-blue-400' 
                        : 'bg-green-200 border-2 border-green-400'
                    } ${isHovered || isSelected ? 'opacity-100 scale-110' : 'opacity-70'}`}
                    style={{
                      width: '44px',
                      height: '44px',
                      transform: 'translate(-50%, -50%)',
                      left: '50%',
                      top: '50%',
                      transition: 'all 0.2s ease'
                    }}
                  />
                  {/* Background circle */}
                  <div 
                    className={`absolute inset-0 rounded-full ${
                      isHotel 
                        ? 'bg-blue-100' 
                        : 'bg-green-100'
                    } ${isHovered || isSelected ? 'opacity-90' : 'opacity-75'}`}
                    style={{
                      width: '36px',
                      height: '36px',
                      transform: 'translate(-50%, -50%)',
                      left: '50%',
                      top: '50%'
                    }}
                  />
                  {/* Icon */}
                  <div 
                    className="relative z-10 flex items-center justify-center"
                    style={{ fontSize: '24px', width: '36px', height: '36px' }}
                  >
                    {isHotel ? '🏨' : '📍'}
                  </div>
                  {/* Day badge */}
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md ${
                      isHotel ? 'bg-blue-600' : 'bg-green-600'
                    }`}
                    style={{ width: '18px', height: '18px', fontSize: '9px', border: '2px solid white' }}
                  >
                    {waypoint.day}
                  </div>
                </div>
              </div>
            </Marker>
          );
        })}

        {/* Popup for selected waypoint */}
        {selectedWaypoint && (
          <Popup
            longitude={selectedWaypoint.coordinates.lng}
            latitude={selectedWaypoint.coordinates.lat}
            anchor="bottom"
            onClose={() => setSelectedWaypoint(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-3 min-w-[220px] max-w-[280px]">
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2 ${
                selectedWaypoint.type === 'hotel' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {selectedWaypoint.type === 'hotel' ? '🏨 Hotel' : '📍 Activity'}
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-base">
                {selectedWaypoint.title || selectedWaypoint.name}
              </h4>
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <span>📍</span>
                  <span>{selectedWaypoint.location}</span>
                </p>
                {selectedWaypoint.time && (
                  <p className="text-xs text-gray-600 flex items-center gap-1">
                    <span>🕐</span>
                    <span>{selectedWaypoint.time}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-2 font-semibold flex items-center gap-1">
                  <span>📅</span>
                  <span>Day {selectedWaypoint.day}</span>
                </p>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                  <p>Coordinates:</p>
                  <p className="font-mono text-[10px]">
                    {selectedWaypoint.coordinates.lat.toFixed(6)}, {selectedWaypoint.coordinates.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              {/* Show distance to next waypoint if available */}
              {selectedWaypoint.index !== undefined && waypointsByDay[selectedWaypoint.day] && 
               selectedWaypoint.index < waypointsByDay[selectedWaypoint.day].length - 1 && (
                (() => {
                  const nextWp = waypointsByDay[selectedWaypoint.day][selectedWaypoint.index! + 1];
                  const dayRoute = optimizedRoutes[selectedWaypoint.day];
                  
                  // Try to get real route data from optimized routes
                  if (dayRoute && dayRoute.segments && dayRoute.segments[selectedWaypoint.index!]) {
                    const segment = dayRoute.segments[selectedWaypoint.index!];
                    const travelTime = Math.round(segment.duration / 60); // Convert seconds to minutes
                    return (
                      <p className="text-xs text-primary-600 mt-1">
                        📍 {segment.distance.toFixed(1)} km • ⏱️ {travelTime} min to next
                      </p>
                    );
                  } else {
                    // Fallback to straight-line calculation
                    const distance = calculateDistance(
                      selectedWaypoint.coordinates.lat, selectedWaypoint.coordinates.lng,
                      nextWp.coordinates.lat, nextWp.coordinates.lng
                    );
                    const travelTime = Math.round(distance / 50 * 60); // Assuming 50 km/h average
                    return (
                      <p className="text-xs text-primary-600 mt-1">
                        📍 {distance.toFixed(1)} km • ⏱️ ~{travelTime} min to next
                      </p>
                    );
                  }
                })()
              )}
            </div>
          </Popup>
        )}
      </Map>
      
      {/* Legend and Route Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
        <h5 className="font-semibold text-gray-900 mb-2 text-xs">Legend</h5>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📍</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-600 rounded-full border border-white"></div>
            </div>
            <span className="text-gray-700">Activities ({displayedWaypoints.filter(w => w.type === 'activity').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🏨</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border border-white"></div>
            </div>
            <span className="text-gray-700">Hotels ({displayedWaypoints.filter(w => w.type === 'hotel').length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-primary-500 rounded"></div>
            <span className="text-gray-700">Optimized Route</span>
          </div>
          {!showAllDays && selectedDay !== null && routeStats[selectedDay] && (
            <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
              <p className="text-xs text-primary-600 font-semibold">
                Showing Day {selectedDay} only
              </p>
              <p className="text-xs text-gray-600">
                📍 {routeStats[selectedDay].distance.toFixed(1)} km total
              </p>
              <p className="text-xs text-gray-600">
                ⏱️ {Math.round(routeStats[selectedDay].duration / 60)} min travel
              </p>
            </div>
          )}
          {showAllDays && Object.keys(routeStats).length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-1">Total Trip:</p>
              <p className="text-xs text-gray-600">
                📍 {Object.values(routeStats).reduce((sum, s) => sum + (s.distance || 0), 0).toFixed(1)} km
              </p>
              <p className="text-xs text-gray-600">
                ⏱️ {Math.round(Object.values(routeStats).reduce((sum, s) => sum + (s.duration || 0), 0) / 60)} min
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 z-[1000] border border-gray-200 flex flex-col gap-2">
        <select
          value={mapStyle}
          onChange={(e) => setMapStyle(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="mapbox://styles/mapbox/streets-v12">Streets</option>
          <option value="mapbox://styles/mapbox/outdoors-v12">Outdoors</option>
          <option value="mapbox://styles/mapbox/light-v11">Light</option>
          <option value="mapbox://styles/mapbox/dark-v11">Dark</option>
          <option value="mapbox://styles/mapbox/satellite-v9">Satellite</option>
          <option value="mapbox://styles/mapbox/navigation-day-v1">Navigation</option>
        </select>
        <button
          onClick={() => {
            if (mapRef && validWaypoints.length > 0) {
              const bounds = validWaypoints.reduce((acc, wp) => {
                return {
                  minLng: Math.min(acc.minLng, wp.coordinates.lng),
                  maxLng: Math.max(acc.maxLng, wp.coordinates.lng),
                  minLat: Math.min(acc.minLat, wp.coordinates.lat),
                  maxLat: Math.max(acc.maxLat, wp.coordinates.lat),
                };
              }, {
                minLng: validWaypoints[0].coordinates.lng,
                maxLng: validWaypoints[0].coordinates.lng,
                minLat: validWaypoints[0].coordinates.lat,
                maxLat: validWaypoints[0].coordinates.lat,
              });
              mapRef.fitBounds(
                [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                { padding: 50, duration: 1000 }
              );
            }
          }}
          className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors font-semibold"
          title="Fit to all waypoints"
        >
          🗺️ Fit View
        </button>
      </div>

      {/* Day-by-day summary with interactive selection */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200 max-h-96 overflow-y-auto min-w-[220px]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-900 text-sm">Trip Days</h4>
          <button
            onClick={() => {
              setShowAllDays(!showAllDays);
              setSelectedDay(null);
            }}
            className="text-xs px-2 py-1 rounded bg-primary-100 text-primary-700 hover:bg-primary-200 transition-colors"
          >
            {showAllDays ? 'Show All' : 'Filter'}
          </button>
        </div>
        {loadingRoutes && (
          <div className="mb-2 text-xs text-primary-600 font-semibold flex items-center gap-1">
            <span className="animate-spin inline-block w-3 h-3 border-2 border-primary-600 border-t-transparent rounded-full"></span>
            Optimizing routes...
          </div>
        )}
        <div className="flex flex-col gap-2 text-xs">
          {Object.keys(waypointsByDay).sort((a, b) => parseInt(a) - parseInt(b)).map(day => {
            const dayNum = parseInt(day);
            const dayWps = waypointsByDay[dayNum];
            const isSelected = selectedDay === dayNum;
            const stats = routeStats[dayNum];
            const totalDistance = stats?.distance || calculateDayDistance(dayNum);
            const totalDuration = stats?.duration ? Math.round(stats.duration / 60) : null; // Convert to minutes
            const activities = dayWps.filter(w => w.type === 'activity').length;
            const hotels = dayWps.filter(w => w.type === 'hotel').length;
            
            return (
              <button
                key={day}
                onClick={() => {
                  if (isSelected) {
                    setSelectedDay(null);
                    setShowAllDays(true);
                    // Fit bounds to all waypoints
                    if (mapRef && validWaypoints.length > 0) {
                      const bounds = validWaypoints.reduce((acc, wp) => {
                        return {
                          minLng: Math.min(acc.minLng, wp.coordinates.lng),
                          maxLng: Math.max(acc.maxLng, wp.coordinates.lng),
                          minLat: Math.min(acc.minLat, wp.coordinates.lat),
                          maxLat: Math.max(acc.maxLat, wp.coordinates.lat),
                        };
                      }, {
                        minLng: validWaypoints[0].coordinates.lng,
                        maxLng: validWaypoints[0].coordinates.lng,
                        minLat: validWaypoints[0].coordinates.lat,
                        maxLat: validWaypoints[0].coordinates.lat,
                      });
                      mapRef.fitBounds(
                        [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                        { padding: 50, duration: 1000 }
                      );
                    }
                  } else {
                    setSelectedDay(dayNum);
                    setShowAllDays(false);
                    // Fit bounds to day waypoints
                    if (mapRef && dayWps.length > 0) {
                      const bounds = dayWps.reduce((acc, wp) => {
                        return {
                          minLng: Math.min(acc.minLng, wp.coordinates.lng),
                          maxLng: Math.max(acc.maxLng, wp.coordinates.lng),
                          minLat: Math.min(acc.minLat, wp.coordinates.lat),
                          maxLat: Math.max(acc.maxLat, wp.coordinates.lat),
                        };
                      }, {
                        minLng: dayWps[0].coordinates.lng,
                        maxLng: dayWps[0].coordinates.lng,
                        minLat: dayWps[0].coordinates.lat,
                        maxLat: dayWps[0].coordinates.lat,
                      });
                      mapRef.fitBounds(
                        [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                        { padding: 50, duration: 1000 }
                      );
                    }
                  }
                }}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-primary-50 border-primary-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-semibold ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                    Day {day}
                  </span>
                  {totalDistance > 0 && (
                    <span className="text-xs text-gray-500 font-semibold">
                      📍 {totalDistance.toFixed(1)} km
                    </span>
                  )}
                </div>
                <div className="text-gray-600 space-y-0.5">
                  <div>📍 {activities} {activities === 1 ? 'activity' : 'activities'}</div>
                  {hotels > 0 && <div>🏨 {hotels} {hotels === 1 ? 'hotel' : 'hotels'}</div>}
                  {totalDuration !== null && totalDuration > 0 && (
                    <div className="text-primary-600 font-semibold mt-1">
                      ⏱️ {totalDuration} min travel
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
