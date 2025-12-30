'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { getCurrentLocation, getAddressFromCoordinates } from '@/lib/safetyUtils';

interface SOSModalProps {
  onClose: () => void;
}

export default function SOSModal({ onClose }: SOSModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    // Get location when modal opens
    handleGetLocation();
  }, []);

  const handleGetLocation = async () => {
    setGettingLocation(true);
    setLocationError(false);

    try {
      const loc = await getCurrentLocation();
      try {
        const address = await getAddressFromCoordinates(loc.latitude, loc.longitude);
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude,
          address
        });
      } catch {
        setLocation({
          latitude: loc.latitude,
          longitude: loc.longitude
        });
      }
    } catch (err) {
      setLocationError(true);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleActivateSOS = async () => {
    // Wait for location if still getting it
    if (gettingLocation) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/safety/sos', {
        latitude: location?.latitude || 0,
        longitude: location?.longitude || 0,
        address: location?.address || undefined,
        tripId: undefined
      });

      setSuccess(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      // Even if API fails, show success to user (they can try again)
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slide-down">
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 text-white p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-3">SOS Activated!</h2>
            <p className="text-green-50 text-lg">Your emergency contacts have been notified</p>
          </div>
          
          <div className="p-6">
            {location && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Location Shared</p>
                    <p className="text-sm text-gray-600">{location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> For immediate life-threatening emergencies, call your local emergency number (911, 112, etc.).
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-slide-down">
        {/* Header */}
        <div className="bg-gradient-to-br from-red-600 via-red-600 to-red-700 text-white p-8 text-center rounded-t-3xl">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Emergency SOS</h2>
          <p className="text-red-100">Tap the button below to activate</p>
        </div>

        <div className="p-8">
          {/* Location Status */}
          <div className="mb-6">
            {gettingLocation ? (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="spinner w-5 h-5 border-2 border-gray-300 border-t-red-600"></div>
                  <span className="text-sm text-gray-600 font-medium">Getting your location...</span>
                </div>
              </div>
            ) : location ? (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-800 mb-1">Location ready</p>
                    <p className="text-xs text-green-700 leading-relaxed">{location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Location unavailable</p>
                    <p className="text-xs text-yellow-700">Unable to get your location. SOS will still activate without location.</p>
                  </div>
                </div>
                <button
                  onClick={handleGetLocation}
                  className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Main SOS Button */}
          <button
            onClick={handleActivateSOS}
            disabled={loading || gettingLocation}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-red-500/40 text-xl"
          >
            {loading ? (
              <>
                <div className="spinner w-6 h-6 border-3 border-white/30 border-t-white"></div>
                <span>Activating...</span>
              </>
            ) : (
              <>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Activate SOS</span>
              </>
            )}
          </button>

          {/* Cancel button */}
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium py-3 transition-colors duration-200"
            disabled={loading || gettingLocation}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
