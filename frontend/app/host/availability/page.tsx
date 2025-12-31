'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DayPicker } from 'react-day-picker';
import HostSidebar from '@/components/HostSidebar';

interface AvailabilityEntry {
  date: string;
  available: boolean;
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

export default function AvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [currentAvailability, setCurrentAvailability] = useState<AvailabilityEntry[]>([]);

  useEffect(() => {
    checkAuth();
    fetchAvailability();
  }, []);

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }
    }
  };

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hosts/availability');
      
      if (response.data.availability) {
        const avail = response.data.availability.map((av: any) => ({
          date: new Date(av.date).toISOString().split('T')[0],
          available: av.available,
          timeSlots: av.timeSlots || []
        }));
        setCurrentAvailability(avail);
        setAvailability(avail);
      }
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      // If endpoint doesn't exist, start with empty availability
      setCurrentAvailability([]);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) return;
    setSelectedDates(dates);
  };

  const toggleDateAvailability = (date: Date, available: boolean) => {
    const dateStr = date.toISOString().split('T')[0];
    const existingIndex = availability.findIndex(av => av.date === dateStr);
    
    if (existingIndex >= 0) {
      const updated = [...availability];
      updated[existingIndex].available = available;
      setAvailability(updated);
    } else {
      setAvailability([...availability, {
        date: dateStr,
        available,
        timeSlots: []
      }]);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const availabilityData = availability.map(av => ({
        date: av.date,
        available: av.available,
        timeSlots: av.timeSlots || []
      }));

      await api.post('/hosts/availability', { availability: availabilityData });
      
      setSuccess('Availability updated successfully!');
      setCurrentAvailability(availability);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update availability');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = availability.find(av => av.date === dateStr);
    return entry ? entry.available : null; // null means not set
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading availability...</div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                Manage Availability
              </h1>
              <p className="text-gray-600">
                Set your availability calendar for the next few months
              </p>
            </div>
            <button
              onClick={() => router.push('/host/dashboard')}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6">
              <span className="text-lg">✅</span>
              <span className="flex-1">{success}</span>
              <button onClick={() => setSuccess('')} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Calendar Section */}
        <div className="content-card mb-6">
          <h2 className="heading-tertiary text-gray-900 mb-4">Select Dates</h2>
          <div className="flex justify-center">
            <DayPicker
              mode="multiple"
              selected={selectedDates}
              onSelect={handleDateSelect}
              disabled={(date) => date < today}
              fromDate={today}
              toDate={nextMonth}
              className="rounded-lg border border-gray-200 p-4"
              modifiers={{
                available: (date) => getDateStatus(date) === true,
                unavailable: (date) => getDateStatus(date) === false,
              }}
              modifiersClassNames={{
                available: 'bg-green-100 text-green-800',
                unavailable: 'bg-red-100 text-red-800',
              }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="content-card mb-6">
          <h2 className="heading-tertiary text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                selectedDates.forEach(date => toggleDateAvailability(date, true));
              }}
              disabled={selectedDates.length === 0}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Selected as Available
            </button>
            <button
              onClick={() => {
                selectedDates.forEach(date => toggleDateAvailability(date, false));
              }}
              disabled={selectedDates.length === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark Selected as Unavailable
            </button>
            <button
              onClick={() => {
                setSelectedDates([]);
              }}
              className="btn-secondary"
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Current Availability List */}
        {availability.length > 0 && (
          <div className="content-card mb-6">
            <h2 className="heading-tertiary text-gray-900 mb-4">Current Availability</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {availability
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((entry) => (
                  <div
                    key={entry.date}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          entry.available
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {entry.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = availability.filter(av => av.date !== entry.date);
                        setAvailability(updated);
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-semibold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => router.push('/host/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                Save Availability
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </>
            )}
          </button>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}

