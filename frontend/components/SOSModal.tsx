'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { getCurrentLocation, getAddressFromCoordinates, getCountryCodeFromLocation } from '@/lib/safetyUtils';

interface SOSModalProps {
  onClose: () => void;
}

export default function SOSModal({ onClose }: SOSModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState('');
  const [tripId, setTripId] = useState('');

  useEffect(() => {
    // Automatically get location when modal opens
    handleGetLocation();
    
    // Get active trips for selection
    fetchActiveTrips();
  }, []);

  const fetchActiveTrips = async () => {
    try {
      const response = await api.get('/user/me');
      const trips = response.data.user?.bookings || [];
      // Set first active trip if available
      if (trips.length > 0) {
        setTripId(trips[0]._id || trips[0].id);
      }
    } catch (err) {
      // Silently fail - trip selection is optional
    }
  };

  const handleGetLocation = async () => {
    setGettingLocation(true);
    setError('');

    try {
      const loc = await getCurrentLocation();
      const address = await getAddressFromCoordinates(loc.latitude, loc.longitude);
      setLocation({
        latitude: loc.latitude,
        longitude: loc.longitude,
        address
      });
    } catch (err: any) {
      setError(`Unable to get location: ${err.message}. You can still send SOS manually.`);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleActivateSOS = async () => {
    if (!location) {
      setError('Location is required. Please allow location access or try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/safety/sos', {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        message: message.trim() || undefined,
        tripId: tripId || undefined
      });

      // Show success and close after a moment
      alert(`🚨 SOS Activated!\n\nYour emergency contacts have been notified.\n\nLocation: ${location.address || `${location.latitude}, ${location.longitude}`}`);
      
      onClose();
      
      // Optionally redirect to safety history
      // window.location.href = '/dashboard/safety/history';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate SOS. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-red-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">🚨 Emergency SOS</h2>
              <p className="text-red-100 text-sm">Activate emergency alert</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-red-200 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="alert-error">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Location Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Your Location
            </label>
            {gettingLocation ? (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="spinner w-4 h-4"></span>
                <span>Getting your location...</span>
              </div>
            ) : location ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium mb-1">✓ Location captured</p>
                <p className="text-xs text-green-700">{location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}</p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 mb-2">Location not available</p>
                <button
                  onClick={handleGetLocation}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Get Location
                </button>
              </div>
            )}
          </div>

          {/* Message Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your emergency situation..."
              className="input-field min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-800 mb-1">Important</p>
                <p className="text-sm text-red-700">
                  This will notify your emergency contacts and log the event. 
                  For immediate life-threatening emergencies, call your local emergency number (911, 112, etc.).
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleActivateSOS}
              disabled={loading || !location || gettingLocation}
              className="btn-primary flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner w-4 h-4"></span>
                  Activating...
                </>
              ) : (
                <>
                  🚨 Activate SOS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

