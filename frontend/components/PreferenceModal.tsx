'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

interface PreferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PreferenceModal({ isOpen, onClose, onSuccess }: PreferenceModalProps) {
  const [preferences, setPreferences] = useState({
    travelStyle: '',
    pace: '',
    transport: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!preferences.travelStyle || !preferences.pace || !preferences.transport) {
      setError('Please answer all questions');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post('/user/kyt', {
        preferences
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Set Your Preferences</h2>
                  <p className="text-sm text-gray-600 mt-1">Help us personalize your trip planning</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-800 text-sm font-medium">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Travel Style */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                        <span className="text-xl">🏨</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        What's your travel style?
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.travelStyle === 'flexible' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="travelStyle"
                          value="flexible"
                          checked={preferences.travelStyle === 'flexible'}
                          onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Flexible</div>
                          <div className={`text-xs ${preferences.travelStyle === 'flexible' ? 'text-white/90' : 'text-gray-600'}`}>
                            I want hotel recommendations to choose from and book through the platform
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.travelStyle === 'fixed' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="travelStyle"
                          value="fixed"
                          checked={preferences.travelStyle === 'fixed'}
                          onChange={(e) => setPreferences({ ...preferences, travelStyle: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Fixed Package</div>
                          <div className={`text-xs ${preferences.travelStyle === 'fixed' ? 'text-white/90' : 'text-gray-600'}`}>
                            I prefer pre-booked hotels in a package/schedule
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Pace */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-accent-100 rounded-lg">
                        <span className="text-xl">⚡</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        What's your travel pace?
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.pace === 'fast' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="pace"
                          value="fast"
                          checked={preferences.pace === 'fast'}
                          onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Fast Paced</div>
                          <div className={`text-xs ${preferences.pace === 'fast' ? 'text-white/90' : 'text-gray-600'}`}>
                            I want to visit more places in less time
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.pace === 'slow' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="pace"
                          value="slow"
                          checked={preferences.pace === 'slow'}
                          onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Slow Paced</div>
                          <div className={`text-xs ${preferences.pace === 'slow' ? 'text-white/90' : 'text-gray-600'}`}>
                            I prefer spending more time at fewer places
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
                        <span className="text-xl">🚗</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        How do you prefer to travel?
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.transport === 'native' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="transport"
                          value="native"
                          checked={preferences.transport === 'native'}
                          onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Native Experience</div>
                          <div className={`text-xs ${preferences.transport === 'native' ? 'text-white/90' : 'text-gray-600'}`}>
                            I want to experience local culture using regional or public transport options
                          </div>
                        </div>
                      </label>
                      <label className={`flex items-start p-4 rounded-lg cursor-pointer transition-all ${
                        preferences.transport === 'luxury' 
                          ? 'bg-primary-500 text-white shadow-md border-2 border-primary-600' 
                          : 'bg-white border-2 border-gray-200 hover:border-primary-300'
                      }`}>
                        <input
                          type="radio"
                          name="transport"
                          value="luxury"
                          checked={preferences.transport === 'luxury'}
                          onChange={(e) => setPreferences({ ...preferences, transport: e.target.value })}
                          className="mt-1 mr-3 w-4 h-4"
                        />
                        <div className="flex-1">
                          <div className="font-bold text-base mb-1">Luxury Tourist</div>
                          <div className={`text-xs ${preferences.transport === 'luxury' ? 'text-white/90' : 'text-gray-600'}`}>
                            I prefer comfortable cab bookings for transfers
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                          Saving...
                        </>
                      ) : (
                        'Save & Continue'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

