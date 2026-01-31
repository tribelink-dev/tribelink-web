'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { MapRef } from 'react-map-gl';

// Dynamically import Mapbox GL to avoid SSR issues
const Map = dynamic(() => import('react-map-gl').then(mod => mod.Map), { 
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>
});
const Marker = dynamic(() => import('react-map-gl').then(mod => mod.Marker), { ssr: false });

interface LocationPickerProps {
  district?: string;
  state?: string;
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  required?: boolean;
}

export default function LocationPicker({ 
  district, 
  state, 
  initialLat, 
  initialLng, 
  onLocationChange,
  required = false 
}: LocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(initialLat || null);
  const [selectedLng, setSelectedLng] = useState<number | null>(initialLng || null);
  const [address, setAddress] = useState<string>('');

  // Update selected coordinates when initial values change
  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedLat(initialLat);
      setSelectedLng(initialLng);
    }
  }, [initialLat, initialLng]);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set initial center based on district or default
  useEffect(() => {
    if (initialLat && initialLng) {
      setSelectedLat(initialLat);
      setSelectedLng(initialLng);
    } else if (district && districtCoordinates[district] && !selectedLat && !selectedLng) {
      const coords = districtCoordinates[district];
      setSelectedLat(coords.lat);
      setSelectedLng(coords.lng);
      onLocationChange(coords.lat, coords.lng);
    }
  }, [district, initialLat, initialLng]);

  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat;
    setSelectedLat(lat);
    setSelectedLng(lng);
    onLocationChange(lat, lng);
    
    // Reverse geocode to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          setAddress(data.display_name);
        }
      })
      .catch(() => {
        setAddress('');
      });
  }, [onLocationChange]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLat(lat);
          setSelectedLng(lng);
          onLocationChange(lat, lng);
          
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setAddress(data.display_name);
              }
            })
            .catch(() => {
              setAddress('');
            });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please click on the map to set it manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser. Please click on the map to set location.');
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
        <p className="text-gray-500">Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file</p>
      </div>
    );
  }

  const centerLat = selectedLat || (district && districtCoordinates[district]?.lat) || 10.5;
  const centerLng = selectedLng || (district && districtCoordinates[district]?.lng) || 76.5;
  const zoom = selectedLat && selectedLng ? 15 : (district ? 12 : 10);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">📍</span>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">Set Exact Location</h4>
            <p className="text-sm text-blue-700 mb-3">
              {required 
                ? 'Click on the map to set the exact location of your experience/hotel. This helps travelers find you easily!'
                : 'Click on the map to set the exact location (recommended for better map accuracy).'
              }
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                📍 Use My Current Location
              </button>
              {selectedLat && selectedLng && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLat(null);
                    setSelectedLng(null);
                    setAddress('');
                    onLocationChange(0, 0);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
                >
                  Clear Location
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-96 rounded-xl overflow-hidden border-2 border-gray-300 shadow-medium relative">
        <Map
          mapboxAccessToken={mapboxToken}
          initialViewState={{
            longitude: centerLng,
            latitude: centerLat,
            zoom: zoom
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          onClick={handleMapClick}
          scrollZoom={true}
          doubleClickZoom={true}
          dragRotate={false}
          touchZoomRotate={true}
        >
          {selectedLat && selectedLng && (
            <Marker
              longitude={selectedLng}
              latitude={selectedLat}
              anchor="bottom"
            >
              <div className="text-3xl cursor-pointer transform transition-transform hover:scale-110" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                📍
              </div>
            </Marker>
          )}
        </Map>
      </div>

      {selectedLat && selectedLng && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">✅</span>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-2">Location Selected</h4>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700">
                  <span className="font-semibold">Latitude:</span> {selectedLat.toFixed(6)}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Longitude:</span> {selectedLng.toFixed(6)}
                </p>
                {address && (
                  <p className="text-gray-700 mt-2">
                    <span className="font-semibold">Address:</span> {address}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {required && !selectedLat && !selectedLng && (
        <p className="text-sm text-red-600 font-semibold">
          ⚠️ Please select a location on the map above
        </p>
      )}
    </div>
  );
}
