'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';

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
  const [alwaysAvailable, setAlwaysAvailable] = useState(false);
  const toast = useToast();

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

      const parsedHost = JSON.parse(hostData);
      // Any host can now manage availability, regardless of provider type
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
      toast.success('Availability updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update availability');
      toast.error(err.response?.data?.message || 'Failed to update availability');
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  const getDateStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = availability.find(av => av.date === dateStr);
    return entry ? entry.available : null;
  };

  const selectAllDates = (available: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const newAvailability: AvailabilityEntry[] = [];
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      newAvailability.push({
        date: dateStr,
        available,
        timeSlots: []
      });
    }
    setAvailability(newAvailability);
  };

  const selectNext30DaysFromSelected = (available: boolean = true) => {
    let startDate: Date;
    if (selectedDates.length > 0) {
      // Use the first selected date
      startDate = new Date(selectedDates[0]);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // Use today if no date is selected
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 29);
    
    const newAvailability: AvailabilityEntry[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingIndex = availability.findIndex(av => av.date === dateStr);
      
      if (existingIndex >= 0) {
        const updated = [...availability];
        updated[existingIndex].available = available;
        setAvailability(updated);
      } else {
        newAvailability.push({
          date: dateStr,
          available,
          timeSlots: []
        });
      }
    }
    
    if (newAvailability.length > 0) {
      setAvailability([...availability, ...newAvailability]);
    }
    
    // Update selected dates to show the range
    const dates: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    setSelectedDates(dates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600 mb-3"></div>
            <p className="text-sm text-gray-600">Loading availability...</p>
          </div>
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
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
                  <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-1">Availability</h1>
                <p className="text-gray-600 text-sm">Manage your availability calendar for experiences</p>
                </div>
                {availability.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Available</div>
                    <div className="text-lg font-semibold text-green-600">
                        {availability.filter(a => a.available).length}
                      </div>
                    </div>
                  <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Unavailable</div>
                    <div className="text-lg font-semibold text-red-600">
                        {availability.filter(a => !a.available).length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {success}
              </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  selectedDates.forEach(date => toggleDateAvailability(date, true));
                }}
                disabled={selectedDates.length === 0}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Selected as Available
              </button>
              <button
                onClick={() => {
                  selectedDates.forEach(date => toggleDateAvailability(date, false));
                }}
                disabled={selectedDates.length === 0}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Selected as Unavailable
              </button>
              <button
                onClick={() => selectNext30DaysFromSelected(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next 30 Days
              </button>
              <button
                onClick={() => setSelectedDates([])}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => selectAllDates(true)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-200 transition-colors"
              >
                Mark All Available
              </button>
            </div>
          </div>

          {/* Calendar Section */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Dates</h2>
            <div className="flex justify-center">
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={handleDateSelect}
                disabled={(date) => date < today}
                fromDate={today}
                toDate={nextMonth}
                numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                className="rdp-slate"
                modifiers={{
                  available: (date) => getDateStatus(date) === true,
                  unavailable: (date) => getDateStatus(date) === false,
                }}
                modifiersClassNames={{
                  available: 'bg-green-100 text-green-800',
                  unavailable: 'bg-red-100 text-red-800',
                }}
                classNames={{
                  months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0',
                  month: 'space-y-4',
                  caption: 'flex justify-center pt-1 relative items-center mb-4',
                  caption_label: 'text-lg font-bold text-slate-900',
                  nav: 'space-x-1 flex items-center',
                  nav_button: 'h-10 w-10 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border-2 border-slate-300 hover:border-slate-500',
                  nav_button_previous: 'absolute left-1',
                  nav_button_next: 'absolute right-1',
                  table: 'w-full border-collapse space-y-1',
                  head_row: 'flex mb-3',
                  head_cell: 'text-slate-600 rounded-md w-12 font-bold text-sm uppercase tracking-wider',
                  row: 'flex w-full mt-2',
                  cell: 'text-center text-sm p-0 relative',
                  day: 'h-12 w-12 p-0 font-normal rounded-xl transition-all cursor-pointer hover:bg-slate-100 hover:text-slate-900 text-base',
                  day_selected: 'bg-gradient-to-br from-slate-600 to-indigo-600 text-white hover:from-slate-700 hover:to-indigo-700 hover:text-white focus:from-slate-600 focus:to-indigo-600 focus:text-white font-bold shadow-lg',
                  day_today: 'bg-slate-200 text-slate-900 font-bold border-2 border-slate-500',
                  day_outside: 'text-slate-300 opacity-50',
                  day_disabled: 'text-slate-200 opacity-30 cursor-not-allowed',
                  day_hidden: 'invisible',
                }}
              />
            </div>
          </div>

          {/* Current Availability List */}
          {availability.length > 0 && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Availability</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availability
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-900">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1 hover:bg-red-50 rounded-lg transition-colors"
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
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                'Save Availability'
              )}
            </button>
          </div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
