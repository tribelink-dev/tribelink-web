'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

interface AvailabilityEntry {
  date: string;
  available: boolean;
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

export default function DriverAvailabilityPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchDriverProfile(parsedHost._id);
    }
  }, [router]);

  const fetchDriverProfile = async (providerId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/drivers/profile/${providerId}`);
      const profile = response.data.driverProfile;
      setDriverProfile(profile);

      // Parse availability dates
      if (profile?.availability) {
        const availableDates: Date[] = [];
        const unavailableDatesList: Date[] = [];

        profile.availability.forEach((avail: AvailabilityEntry) => {
          const date = new Date(avail.date);
          if (avail.available) {
            availableDates.push(date);
          } else {
            unavailableDatesList.push(date);
          }
        });

        setSelectedDates(availableDates);
        setUnavailableDates(unavailableDatesList);
      }
    } catch (err: any) {
      console.error('Error fetching driver profile:', err);
      setError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if date is in unavailable list
    const isUnavailable = unavailableDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    if (isUnavailable) {
      // Remove from unavailable
      setUnavailableDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
      // Add to available
      setSelectedDates(prev => {
        const exists = prev.some(d => format(d, 'yyyy-MM-dd') === dateStr);
        if (!exists) return [...prev, date];
        return prev;
      });
      return;
    }

    // Check if date is in selected list
    const isSelected = selectedDates.some(d => format(d, 'yyyy-MM-dd') === dateStr);
    if (isSelected) {
      // Remove from available
      setSelectedDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
      // Add to unavailable
      setUnavailableDates(prev => {
        const exists = prev.some(d => format(d, 'yyyy-MM-dd') === dateStr);
        if (!exists) return [...prev, date];
        return prev;
      });
    } else {
      // Add to available
      setSelectedDates(prev => {
        const exists = prev.some(d => format(d, 'yyyy-MM-dd') === dateStr);
        if (!exists) return [...prev, date];
        return prev;
      });
      // Remove from unavailable if exists
      setUnavailableDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
    }
  };

  const handleSaveAvailability = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Combine all dates with availability status
      const availability: AvailabilityEntry[] = [];

      // Add available dates
      selectedDates.forEach(date => {
        availability.push({
          date: format(date, 'yyyy-MM-dd'),
          available: true
        });
      });

      // Add unavailable dates
      unavailableDates.forEach(date => {
        availability.push({
          date: format(date, 'yyyy-MM-dd'),
          available: false
        });
      });

      await api.put(`/drivers/profile/${host._id}`, {
        availability: availability.map(avail => ({
          date: avail.date,
          available: avail.available
        }))
      });

      setSuccess('Availability updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving availability:', err);
      setError(err.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  const markRangeAvailable = (startDate: Date, endDate: Date) => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Remove from unavailable
      setUnavailableDates(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateStr));
      // Add to available if not exists
      setSelectedDates(prev => {
        const exists = prev.some(d => format(d, 'yyyy-MM-dd') === dateStr);
        if (!exists) return [...prev, date];
        return prev;
      });
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading availability...</div>
        </div>
      </div>
    );
  }

  const modifiers = {
    available: selectedDates,
    unavailable: unavailableDates
  };

  const modifiersClassNames = {
    available: 'bg-green-100 text-green-900 font-semibold',
    unavailable: 'bg-red-100 text-red-900 font-semibold'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/driver/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Availability</h1>
                <p className="text-gray-600 mt-1">Set your available dates for trip assignments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                className="btn-secondary"
              >
                {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Your Availability</h2>
              <div className="flex justify-center">
                <DayPicker
                  mode="multiple"
                  selected={selectedDates}
                  modifiers={modifiers}
                  modifiersClassNames={modifiersClassNames}
                  onDayClick={handleDateSelect}
                  className="rounded-lg"
                />
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                  <span>Not Set</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextWeek = new Date();
                    nextWeek.setDate(today.getDate() + 7);
                    markRangeAvailable(today, nextWeek);
                  }}
                  className="w-full btn-secondary text-left"
                >
                  Mark Next 7 Days Available
                </button>
                <button
                  onClick={() => {
                    const today = new Date();
                    const nextMonth = new Date();
                    nextMonth.setMonth(today.getMonth() + 1);
                    markRangeAvailable(today, nextMonth);
                  }}
                  className="w-full btn-secondary text-left"
                >
                  Mark Next Month Available
                </button>
                <button
                  onClick={() => {
                    setSelectedDates([]);
                    setUnavailableDates([]);
                  }}
                  className="w-full btn-secondary text-left text-red-600"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Days:</span>
                  <span className="font-bold text-green-600">{selectedDates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Unavailable Days:</span>
                  <span className="font-bold text-red-600">{unavailableDates.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveAvailability}
              disabled={saving}
              className="w-full btn-primary"
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

