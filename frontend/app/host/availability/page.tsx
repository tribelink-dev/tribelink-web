'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import AbodeSidebar from '@/components/AbodeSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { motion } from 'framer-motion';

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
      if (parsedHost.providerType !== 'LOCAL_HOST') {
        router.push('/host/dashboard');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AbodeSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-slate-900">Loading availability...</div>
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <AbodeSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Modern Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-700 to-slate-800 p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Availability</h1>
                    <p className="text-white/90 text-lg">Manage your abode availability calendar</p>
                  </div>
                </div>
                
                {availability.length > 0 && (
                  <div className="mt-6 flex items-center gap-6">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Available Dates</div>
                      <div className="text-white text-3xl font-bold">
                        {availability.filter(a => a.available).length}
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30">
                      <div className="text-white/70 text-sm font-medium mb-1">Unavailable Dates</div>
                      <div className="text-white text-3xl font-bold">
                        {availability.filter(a => !a.available).length}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  selectedDates.forEach(date => toggleDateAvailability(date, true));
                }}
                disabled={selectedDates.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                Mark Selected as Available
              </button>
              <button
                onClick={() => {
                  selectedDates.forEach(date => toggleDateAvailability(date, false));
                }}
                disabled={selectedDates.length === 0}
                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Mark Selected as Unavailable
              </button>
              <button
                onClick={() => selectNext30DaysFromSelected(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-700 transition-all font-medium shadow-lg"
              >
                📅 Next 30 Days (from selected)
              </button>
              <button
                onClick={() => setSelectedDates([])}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium border-2 border-slate-200"
              >
                Clear Selection
              </button>
              <button
                onClick={() => selectAllDates(true)}
                className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-all font-medium border-2 border-indigo-200"
              >
                Mark All Available (6 months)
              </button>
            </div>
          </motion.div>

          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
          >
            <h2 className="text-xl font-bold text-slate-900 mb-4">Select Dates</h2>
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
          </motion.div>

          {/* Current Availability List */}
          {availability.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
            >
              <h2 className="text-xl font-bold text-slate-900 mb-4">Current Availability</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availability
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((entry) => (
                    <div
                      key={entry.date}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-slate-900">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                        <span
                          className={`px-4 py-2 rounded-full text-xs font-semibold ${
                            entry.available
                              ? 'bg-green-100 text-green-700 border-2 border-green-200'
                              : 'bg-red-100 text-red-700 border-2 border-red-200'
                          }`}
                        >
                          {entry.available ? '✓ Available' : '✕ Unavailable'}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const updated = availability.filter(av => av.date !== entry.date);
                          setAvailability(updated);
                        }}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold px-3 py-1 hover:bg-red-50 rounded-lg transition-all"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end gap-4"
          >
            <button
              onClick={() => router.push('/host/abodes/dashboard')}
              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium border-2 border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
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
          </motion.div>
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
