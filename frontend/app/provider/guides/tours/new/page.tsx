'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import CategorySelector from '@/components/CategorySelector';

interface DateWithTimeSlots {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function NewGuidedTourPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: null as string | null,
    subcategory: null as string | null,
    location: {
      country: 'India',
      state: '',
      district: '',
      coordinates: { lat: 0, lng: 0 }
    },
    price: '',
    duration: '2',
    maxParticipants: '10',
    availableDates: [] as DateWithTimeSlots[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [dateTimeSlots, setDateTimeSlots] = useState<{ [date: string]: { startTime: string; endTime: string } }>({});
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableDistricts = formData.location.state ? (DISTRICTS_BY_STATE[formData.location.state] || []) : [];

  useEffect(() => {
    setIsClient(true);
  }, []);

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
        router.push('/provider/guides');
        return;
      }
    }
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateString = getLocalDateString(date);
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isSelected = selectedDates.some(d => getLocalDateString(d) === dateString);
    
    if (isSelected) {
      const newDates = selectedDates.filter(d => getLocalDateString(d) !== dateString);
      setSelectedDates(newDates);
      
      const newSlots = { ...dateTimeSlots };
      delete newSlots[dateString];
      setDateTimeSlots(newSlots);
      
      setFormData({
        ...formData,
        availableDates: formData.availableDates.filter(d => d.date !== dateString)
      });
    } else {
      const newDates = [...selectedDates, dateOnly].sort((a, b) => a.getTime() - b.getTime());
      setSelectedDates(newDates);
      
      const newSlots = {
        ...dateTimeSlots,
        [dateString]: { startTime: '09:00', endTime: '17:00' }
      };
      setDateTimeSlots(newSlots);
      
      setFormData({
        ...formData,
        availableDates: [
          ...formData.availableDates,
          {
            date: dateString,
            startTime: '09:00',
            endTime: '17:00',
            available: true
          }
        ].sort((a, b) => a.date.localeCompare(b.date))
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!formData.title || !formData.description || !formData.category || !formData.subcategory ||
        !formData.location.country || !formData.location.state || !formData.location.district || 
        !formData.price || formData.availableDates.length === 0) {
      setError('Please fill all required fields and add at least one available date');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category!);
      formDataToSend.append('subcategory', formData.subcategory!);
      formDataToSend.append('location', JSON.stringify(formData.location));
      const formattedDates = formData.availableDates.map(d => ({
        date: d.date,
        startTime: d.startTime || '09:00',
        endTime: d.endTime || '17:00',
        available: d.available !== false
      }));
      formDataToSend.append('availableDates', JSON.stringify(formattedDates));
      formDataToSend.append('price', formData.price);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('maxParticipants', formData.maxParticipants);
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await api.post('/hosts/guides/tours', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/provider/guides/tours');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create guided tour. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/provider/guides/tours')}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 transition-all"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-black text-white mb-2">Create Guided Tour</h1>
              <p className="text-emerald-200">Add a new guided tour for open/free places</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl text-green-200">
            Guided tour created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Tour Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="e.g., Historic Fort Walking Tour"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={5}
                  placeholder="Describe your guided tour..."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Category</h2>
            <CategorySelector
              selectedCategory={formData.category}
              selectedSubcategory={formData.subcategory}
              onCategoryChange={(category, subcategory) => {
                setFormData({ ...formData, category, subcategory });
              }}
            />
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.location.country}
                  disabled
                  className="w-full px-4 py-2 bg-slate-700/30 border border-slate-600 rounded-xl text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">State <span className="text-red-400">*</span></label>
                <select
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value, district: '' }
                  })}
                  required
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">District <span className="text-red-400">*</span></label>
                <select
                  value={formData.location.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, district: e.target.value }
                  })}
                  required
                  disabled={!formData.location.state || availableDistricts.length === 0}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select district</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing & Details */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Pricing & Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">Price (USD) <span className="text-red-400">*</span></label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">Duration (hours)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-emerald-300 mb-2">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  min="1"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Tour Image</h2>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="block w-full h-32 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors flex items-center justify-center">
                <span className="text-slate-400">Click to upload image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Available Dates */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h2 className="text-xl font-black text-white mb-4">Available Dates</h2>
            {isClient && (
              <>
                <style jsx global>{`
                  .rdp {
                    --rdp-cell-size: 40px;
                    --rdp-accent-color: rgb(16, 185, 129);
                    --rdp-background-color: rgb(30, 41, 59);
                    --rdp-accent-color-dark: rgb(16, 185, 129);
                    --rdp-outline: 2px solid var(--rdp-accent-color);
                    --rdp-outline-selected: 3px solid var(--rdp-accent-color);
                    margin: 0;
                  }
                  .rdp-month {
                    background: rgb(30, 41, 59);
                    border-radius: 0.75rem;
                    padding: 1rem;
                  }
                  .rdp-caption_label {
                    color: white;
                    font-weight: 700;
                    font-size: 1.125rem;
                  }
                  .rdp-button {
                    color: white;
                  }
                  .rdp-day {
                    color: white;
                    font-weight: 600;
                  }
                  .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
                    background-color: rgb(16, 185, 129);
                    color: white;
                  }
                  .rdp-day_selected {
                    background-color: rgb(16, 185, 129);
                    color: white;
                    font-weight: 700;
                  }
                  .rdp-day_disabled {
                    color: rgb(71, 85, 105);
                    opacity: 0.5;
                  }
                  .rdp-nav_button {
                    color: white;
                  }
                  .rdp-nav_button:hover {
                    background-color: rgb(51, 65, 85);
                  }
                `}</style>
                <DayPicker
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  disabled={{ before: new Date() }}
                />
              </>
            )}
            {formData.availableDates.length > 0 && (
              <div className="mt-4 space-y-2">
                {formData.availableDates.map((dateSlot) => (
                  <div key={dateSlot.date} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                    <span className="text-white font-semibold">{format(new Date(dateSlot.date), 'MMM dd, yyyy')}</span>
                    <input
                      type="time"
                      value={dateSlot.startTime}
                      onChange={(e) => {
                        const updated = formData.availableDates.map(d =>
                          d.date === dateSlot.date ? { ...d, startTime: e.target.value } : d
                        );
                        setFormData({ ...formData, availableDates: updated });
                      }}
                      className="px-3 py-1 bg-slate-600 border border-slate-500 rounded text-white"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={dateSlot.endTime}
                      onChange={(e) => {
                        const updated = formData.availableDates.map(d =>
                          d.date === dateSlot.date ? { ...d, endTime: e.target.value } : d
                        );
                        setFormData({ ...formData, availableDates: updated });
                      }}
                      className="px-3 py-1 bg-slate-600 border border-slate-500 rounded text-white"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/provider/guides/tours')}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl border-2 border-slate-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border-2 border-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Guided Tour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

