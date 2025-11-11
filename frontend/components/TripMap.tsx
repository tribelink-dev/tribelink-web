'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>
});
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false });

// Component to handle map initialization - must be inside MapContainer
const MapInitializer = dynamic(() => import('react-leaflet').then(mod => {
  const { useMap } = mod;
  const React = require('react');
  
  return function MapInitializer() {
    const map = useMap();
    
    React.useEffect(() => {
      if (map) {
        // Invalidate size after a short delay to ensure container is rendered
        const timer = setTimeout(() => {
          map.invalidateSize();
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [map]);
    
    return null;
  };
}), { ssr: false });

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
}

export default function TripMap({ mapData }: TripMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Fix default marker icon issue
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    }
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[600px] bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (!mapData || !mapData.waypoints || mapData.waypoints.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Map data not available</p>
      </div>
    );
  }

  // Calculate center and bounds
  const validWaypoints = mapData.waypoints.filter(w => w.coordinates && w.coordinates.lat && w.coordinates.lng);
  
  if (validWaypoints.length === 0) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">No coordinates available for map display</p>
      </div>
    );
  }

  const centerLat = validWaypoints.reduce((sum, w) => sum + w.coordinates.lat, 0) / validWaypoints.length;
  const centerLng = validWaypoints.reduce((sum, w) => sum + w.coordinates.lng, 0) / validWaypoints.length;

  // Create route polyline from waypoints in chronological order
  const routeCoordinates = validWaypoints.map(w => [w.coordinates.lat, w.coordinates.lng] as [number, number]);

  // Group waypoints by day for better visualization
  const waypointsByDay: { [day: number]: Waypoint[] } = {};
  validWaypoints.forEach(wp => {
    if (!waypointsByDay[wp.day]) {
      waypointsByDay[wp.day] = [];
    }
    waypointsByDay[wp.day].push(wp);
  });

  // Calculate zoom level based on bounds
  let zoomLevel = 10;
  if (mapData.bounds) {
    const latDiff = mapData.bounds.north - mapData.bounds.south;
    const lngDiff = mapData.bounds.east - mapData.bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff > 5) zoomLevel = 7;
    else if (maxDiff > 2) zoomLevel = 8;
    else if (maxDiff > 1) zoomLevel = 9;
    else if (maxDiff > 0.5) zoomLevel = 10;
    else zoomLevel = 11;
  }

  return (
    <div className="w-full h-[600px] rounded-xl overflow-hidden border-2 border-gray-200 shadow-medium relative" style={{ position: 'relative' }}>
      <MapContainer
        key={`map-${centerLat}-${centerLng}-${isMounted}`}
        center={[centerLat, centerLng]}
        zoom={zoomLevel}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        className="z-0"
      >
        <MapInitializer />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
          noWrap={false}
        />
        
        {/* Route polyline connecting all waypoints */}
        {routeCoordinates.length > 1 && (
          <Polyline
            positions={routeCoordinates}
            color="#00a085"
            weight={4}
            opacity={0.6}
            dashArray="10, 10"
          />
        )}

        {/* Markers for each waypoint */}
        {validWaypoints.map((waypoint, idx) => {
          const isHotel = waypoint.type === 'hotel';
          
          return (
            <Marker
              key={`${waypoint.type}-${idx}-${waypoint.coordinates.lat}-${waypoint.coordinates.lng}`}
              position={[waypoint.coordinates.lat, waypoint.coordinates.lng]}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mb-2 ${
                    isHotel ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {isHotel ? '🏨 Hotel' : '📍 Activity'}
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    {waypoint.title || waypoint.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-1">{waypoint.location}</p>
                  {waypoint.time && (
                    <p className="text-xs text-gray-500">🕐 {waypoint.time}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1 font-semibold">Day {waypoint.day}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200">
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Activities</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Hotels</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1 bg-primary-500 rounded" style={{ borderStyle: 'dashed' }}></div>
            <span className="text-gray-700">Route</span>
          </div>
        </div>
      </div>

      {/* Day-by-day summary */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000] border border-gray-200 max-h-64 overflow-y-auto">
        <h4 className="font-bold text-gray-900 mb-2 text-sm">Trip Days</h4>
        <div className="flex flex-col gap-1 text-xs">
          {Object.keys(waypointsByDay).sort().map(day => (
            <div key={day} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
              <span className="font-semibold text-primary-600">Day {day}:</span>
              <span className="text-gray-600">
                {waypointsByDay[parseInt(day)].filter(w => w.type === 'activity').length} activities
                {waypointsByDay[parseInt(day)].filter(w => w.type === 'hotel').length > 0 && 
                  `, ${waypointsByDay[parseInt(day)].filter(w => w.type === 'hotel').length} hotel`
                }
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

