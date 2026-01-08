'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { hostLogout } from '@/lib/providerUtils';
import 'react-day-picker/dist/style.css';

interface AvailabilityEntry {
  date: string;
  available: boolean;
  timeSlots?: Array<{
    startTime: string;
    endTime: string;
    available: boolean;
  }>;
}

export default function GuideAvailabilityPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [availability, setAvailability] = useState<AvailabilityEntry[]>([]);
  const [currentAvailability, setCurrentAvailability] = useState<AvailabilityEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'GUIDE') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchAvailability();
    }
  }, [router]);

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

  const handleBulkToggle = (available: boolean) => {
    if (selectedDates.length === 0) {
      setError('Please select dates first');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updated = [...availability];
    selectedDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const existingIndex = updated.findIndex(av => av.date === dateStr);
      
      if (existingIndex >= 0) {
        updated[existingIndex].available = available;
      } else {
        updated.push({
          date: dateStr,
          available,
          timeSlots: []
        });
      }
    });
    
    setAvailability(updated);
    setSelectedDates([]);
    setSuccess(`Marked ${selectedDates.length} dates as ${available ? 'available' : 'unavailable'}`);
    setTimeout(() => setSuccess(''), 3000);
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
    return entry ? entry.available : null;
  };

  const getAvailableCount = () => {
    return availability.filter(av => av.available).length;
  };

  const getUnavailableCount = () => {
    return availability.filter(av => !av.available).length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg font-semibold">Loading availability...</p>
        </motion.div>
      </div>
    );
  }

  const today = new Date();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .rdp {
          --rdp-cell-size: 45px;
          --rdp-accent-color: #10b981;
          --rdp-background-color: rgba(30, 41, 59, 0.9);
          --rdp-accent-color-dark: #34d399;
          --rdp-outline: 2px solid var(--rdp-accent-color);
          --rdp-outline-selected: 3px solid var(--rdp-accent-color);
          margin: 0;
          font-family: inherit;
        }
        
        .rdp-months {
          display: flex;
          justify-content: center;
        }
        
        .rdp-month {
          margin: 0;
          background-color: rgba(30, 41, 59, 0.95);
          border-radius: 1rem;
          padding: 1.5rem;
        }
        
        .rdp-month_caption {
          background-color: transparent;
        }
        
        .rdp-table {
          width: 100%;
          max-width: none;
          border-collapse: collapse;
        }
        
        .rdp-head_cell {
          color: #cbd5e1 !important;
          font-weight: 700;
          font-size: 0.875rem;
          padding: 0.75rem 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .rdp-head_cell * {
          color: #cbd5e1 !important;
        }
        
        .rdp-cell {
          padding: 0.25rem;
        }
        
        .rdp-button {
          width: var(--rdp-cell-size);
          height: var(--rdp-cell-size);
          border-radius: 0.5rem;
          border: 2px solid rgba(148, 163, 184, 0.3);
          background-color: rgba(51, 65, 85, 1) !important;
          color: #f1f5f9 !important;
          font-weight: 600;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        
        .rdp-button_reset {
          color: #f1f5f9 !important;
        }
        
        .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
          background-color: rgba(16, 185, 129, 0.3) !important;
          border-color: rgba(16, 185, 129, 0.6) !important;
          color: #10b981 !important;
        }
        
        .rdp-day_selected,
        .rdp-day_selected:focus-visible,
        .rdp-day_selected:hover {
          background-color: #10b981 !important;
          color: white !important;
          font-weight: 700;
          border-color: #10b981 !important;
        }
        
        .rdp-day_today:not(.rdp-day_selected) {
          background-color: rgba(16, 185, 129, 0.2) !important;
          border-color: rgba(16, 185, 129, 0.5) !important;
          color: #10b981 !important;
          font-weight: 600;
        }
        
        .rdp-day_disabled {
          opacity: 0.3;
          cursor: not-allowed;
          color: #64748b !important;
        }
        
        .rdp-day_outside {
          opacity: 0.4;
          color: #64748b !important;
        }
        
        .rdp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          margin-bottom: 0.5rem;
        }
        
        .rdp-caption_label {
          color: #f1f5f9 !important;
          font-weight: 700;
          font-size: 1.25rem;
        }
        
        .rdp-caption_label * {
          color: #f1f5f9 !important;
        }
        
        .rdp-nav_button {
          color: #cbd5e1 !important;
        }
        
        .rdp-nav_button:hover {
          color: #10b981 !important;
        }
        
        .rdp-nav {
          display: flex;
          gap: 0.5rem;
        }
        
        .rdp-button_previous,
        .rdp-button_next {
          width: 2rem;
          height: 2rem;
          border-radius: 0.5rem;
          background-color: rgba(51, 65, 85, 0.8) !important;
          border: 1px solid rgba(148, 163, 184, 0.3) !important;
          color: #cbd5e1 !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .rdp-button_previous:hover,
        .rdp-button_next:hover {
          background-color: rgba(16, 185, 129, 0.3) !important;
          border-color: rgba(16, 185, 129, 0.6) !important;
          color: #10b981 !important;
        }
        
        .rdp-day.available {
          background-color: rgba(16, 185, 129, 0.3) !important;
          border-color: rgba(16, 185, 129, 0.6) !important;
          color: #10b981 !important;
        }
        
        .rdp-day.unavailable {
          background-color: rgba(239, 68, 68, 0.3) !important;
          border-color: rgba(239, 68, 68, 0.6) !important;
          color: #ef4444 !important;
        }
        
        /* Ensure all text is visible */
        .rdp-day {
          color: #f1f5f9 !important;
        }
        
        .rdp-day_number {
          color: #f1f5f9 !important;
        }
        
        .rdp-button_reset.rdp-day {
          color: #f1f5f9 !important;
        }
        
        .rdp-button_reset.rdp-day_number {
          color: #f1f5f9 !important;
        }
        
        /* Force visibility of all calendar elements */
        .rdp * {
          color: inherit;
        }
        
        .rdp-day_selected .rdp-day_number {
          color: white !important;
        }
        
        .rdp-day_today .rdp-day_number {
          color: #10b981 !important;
          font-weight: 700;
        }
        
        .rdp-day.available .rdp-day_number {
          color: #10b981 !important;
          font-weight: 600;
        }
        
        .rdp-day.unavailable .rdp-day_number {
          color: #ef4444 !important;
          font-weight: 600;
        }
      `}</style>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/provider/guides')}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">Availability</h1>
                <p className="text-emerald-200">Manage your tour schedule availability</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={hostLogout}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all"
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Available Days</p>
                <motion.div
                  key={getAvailableCount()}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-black text-white"
                >
                  {getAvailableCount()}
                </motion.div>
              </div>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                ✅
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-red-500/30 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Unavailable Days</p>
                <motion.div
                  key={getUnavailableCount()}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-black text-white"
                >
                  {getUnavailableCount()}
                </motion.div>
              </div>
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                ❌
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-3xl shadow-2xl border border-blue-500/30 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Selected Dates</p>
                <motion.div
                  key={selectedDates.length}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="text-3xl font-black text-white"
                >
                  {selectedDates.length}
                </motion.div>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-4xl"
              >
                📅
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {success}
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 border-b border-emerald-400/30">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Select Dates
              </h2>
            </div>
            <div className="p-8 bg-slate-700/80 backdrop-blur-sm">
              <div className="flex justify-center">
                <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-600/50 shadow-xl">
                  <DayPicker
                    mode="multiple"
                    selected={selectedDates}
                    onSelect={handleDateSelect}
                    fromDate={today}
                    toDate={nextMonth}
                    month={currentMonth}
                    onMonthChange={setCurrentMonth}
                    modifiers={{
                      available: (date) => getDateStatus(date) === true,
                      unavailable: (date) => getDateStatus(date) === false,
                    }}
                    modifiersClassNames={{
                      available: 'available',
                      unavailable: 'unavailable',
                    }}
                    className="calendar-dark"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 border-b border-emerald-400/30">
                <h2 className="text-xl font-black text-white">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBulkToggle(true)}
                  disabled={selectedDates.length === 0}
                  className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Available
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleBulkToggle(false)}
                  disabled={selectedDates.length === 0}
                  className="w-full p-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Mark as Unavailable
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDates([])}
                  disabled={selectedDates.length === 0}
                  className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Selection
                </motion.button>
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="p-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 rounded-xl text-white font-black text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Availability
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>

            {/* Legend */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 border-b border-emerald-400/30">
                <h2 className="text-xl font-black text-white">Legend</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/30 border-2 border-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-emerald-300 text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Available</p>
                    <p className="text-slate-400 text-xs">You can accept tours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/30 border-2 border-red-500 rounded-lg flex items-center justify-center">
                    <span className="text-red-300 text-sm font-bold">✗</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Unavailable</p>
                    <p className="text-slate-400 text-xs">Not accepting tours</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-700 border-2 border-slate-600 rounded-lg flex items-center justify-center">
                    <span className="text-slate-400 text-xs">—</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Not Set</p>
                    <p className="text-slate-400 text-xs">No availability set</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-700">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">T</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">Today</p>
                    <p className="text-slate-400 text-xs">Current date</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
