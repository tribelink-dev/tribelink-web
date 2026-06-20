'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import Link from 'next/link';
import { formatEmergencyNumbers } from '@/lib/safetyUtils';

export default function SafetySettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [emergencyNumbers, setEmergencyNumbers] = useState<any>(null);
  const [error, setError] = useState('');

  const commonCountries = [
    { code: 'US', name: 'United States' },
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'ES', name: 'Spain' },
    { code: 'IT', name: 'Italy' },
    { code: 'RU', name: 'Russia' },
    { code: 'KR', name: 'South Korea' }
  ];

  useEffect(() => {
    fetchEmergencyNumbers(selectedCountry);
  }, [selectedCountry]);

  const fetchEmergencyNumbers = async (country: string) => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/safety/emergency-numbers/${country}`);
      setEmergencyNumbers(response.data.numbers);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load emergency numbers');
      setEmergencyNumbers(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="page-container pt-below-nav pb-sos-clear">
      <div className="section-container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Safety Settings
              </h1>
              <p className="text-lg text-gray-600">Local emergency numbers and safety information</p>
            </div>
            <Link 
              href="/dashboard" 
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}
        </div>

        {/* Country Selection */}
        <div className="content-card mb-8">
          <h2 className="heading-tertiary text-gray-900 mb-4">Select Country</h2>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="input-field"
          >
            {commonCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Emergency Numbers */}
        {loading ? (
          <div className="content-card text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <p className="text-gray-600">Loading emergency numbers...</p>
          </div>
        ) : emergencyNumbers ? (
          <div className="content-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="heading-tertiary text-gray-900 mb-1">
                  Emergency Numbers - {emergencyNumbers.countryName || selectedCountry}
                </h2>
                <p className="text-sm text-gray-600">Tap to call emergency services</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {emergencyNumbers.police && (
                <button
                  onClick={() => handleCall(emergencyNumbers.police)}
                  className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-xl p-6 text-left transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚓</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Police</p>
                      <p className="text-2xl font-bold text-gray-900">{emergencyNumbers.police}</p>
                    </div>
                  </div>
                </button>
              )}

              {emergencyNumbers.fire && (
                <button
                  onClick={() => handleCall(emergencyNumbers.fire)}
                  className="bg-red-50 hover:bg-red-100 border-2 border-red-200 rounded-xl p-6 text-left transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚒</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Fire</p>
                      <p className="text-2xl font-bold text-gray-900">{emergencyNumbers.fire}</p>
                    </div>
                  </div>
                </button>
              )}

              {emergencyNumbers.ambulance && (
                <button
                  onClick={() => handleCall(emergencyNumbers.ambulance)}
                  className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-xl p-6 text-left transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚑</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Ambulance</p>
                      <p className="text-2xl font-bold text-gray-900">{emergencyNumbers.ambulance}</p>
                    </div>
                  </div>
                </button>
              )}

              {emergencyNumbers.emergency && (
                <button
                  onClick={() => handleCall(emergencyNumbers.emergency)}
                  className="bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-200 rounded-xl p-6 text-left transition-all transform hover:scale-105"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🚨</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">General Emergency</p>
                      <p className="text-2xl font-bold text-gray-900">{emergencyNumbers.emergency}</p>
                    </div>
                  </div>
                </button>
              )}
            </div>

            {emergencyNumbers.notes && (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <p className="text-sm text-blue-700">{emergencyNumbers.notes}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="content-card text-center py-12">
            <p className="text-gray-600">Emergency numbers not available for this country</p>
          </div>
        )}

        {/* Safety Tips */}
        <div className="content-card bg-gradient-to-br from-purple-50 to-blue-50 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Safety Tips</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Save these numbers in your phone contacts for quick access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>In case of emergency, call the appropriate number immediately</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Use the SOS button in the app to notify your emergency contacts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Keep your emergency information card updated</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

