'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import LocationPicker from '@/components/LocationPicker';

interface DateWithTimeSlots {
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  available: boolean;
}

export default function AddExperiencePage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      country: 'India',
      state: '',
      district: '',
      coordinates: { lat: 0, lng: 0 }
    },
    price: '',
    duration: '2',
    maxParticipants: '10',
    contentUrl: '',
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
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);

  // Get districts for selected state
  const availableDistricts = formData.location.state ? (DISTRICTS_BY_STATE[formData.location.state] || []) : [];

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Check if user is logged in as host
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
        router.push('/host/login');
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

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Helper function to get date string in local timezone (YYYY-MM-DD)
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Use local date string to avoid timezone issues
    const dateString = getLocalDateString(date);
    // Create a new date object at midnight local time
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Check if date is already selected
    const isSelected = selectedDates.some(d => 
      getLocalDateString(d) === dateString
    );
    
    if (isSelected) {
      // Remove date if already selected
      const newDates = selectedDates.filter(d => 
        getLocalDateString(d) !== dateString
      );
      setSelectedDates(newDates);
      
      // Remove from dateTimeSlots and availableDates
      const newSlots = { ...dateTimeSlots };
      delete newSlots[dateString];
      setDateTimeSlots(newSlots);
      
      setFormData({
        ...formData,
        availableDates: formData.availableDates.filter(d => d.date !== dateString)
      });
    } else {
      // Add date if not selected with default time slots
      const newDates = [...selectedDates, dateOnly].sort((a, b) => a.getTime() - b.getTime());
      setSelectedDates(newDates);
      
      // Set default time slots (9 AM - 5 PM)
      const newSlots = {
        ...dateTimeSlots,
        [dateString]: { startTime: '09:00', endTime: '17:00' }
      };
      setDateTimeSlots(newSlots);
      
      // Add to availableDates
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

  const handleTimeSlotChange = (dateString: string, field: 'startTime' | 'endTime', value: string) => {
    const currentSlots = dateTimeSlots[dateString] || { startTime: '09:00', endTime: '17:00' };
    const newSlots = {
      ...dateTimeSlots,
      [dateString]: {
        ...currentSlots,
        [field]: value
      }
    };
    setDateTimeSlots(newSlots);
    
    // Update availableDates
    setFormData({
      ...formData,
      availableDates: formData.availableDates.map(d => 
        d.date === dateString 
          ? { ...d, [field]: value }
          : d
      )
    });
  };

  const handleRemoveDate = (dateString: string) => {
    setSelectedDates(selectedDates.filter(d => 
      getLocalDateString(d) !== dateString
    ));
    
    const newSlots = { ...dateTimeSlots };
    delete newSlots[dateString];
    setDateTimeSlots(newSlots);
    
    setFormData({
      ...formData,
      availableDates: formData.availableDates.filter(d => d.date !== dateString)
    });
  };

  // Helper function to add dates with default time slots
  const addDatesWithDefaults = (dates: Date[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validDates = dates.filter(d => {
      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return dateOnly >= today;
    });

    const newDateStrings = validDates.map(d => getLocalDateString(d));
    const existingDateStrings = selectedDates.map(d => getLocalDateString(d));
    const datesToAdd = validDates.filter(d => {
      const dateStr = getLocalDateString(d);
      return !existingDateStrings.includes(dateStr);
    });

    if (datesToAdd.length === 0) return;

    // Add new dates
    const updatedDates = [...selectedDates, ...datesToAdd].sort((a, b) => a.getTime() - b.getTime());
    setSelectedDates(updatedDates);

    // Add time slots and available dates
    const newSlots = { ...dateTimeSlots };
    const newAvailableDates = [...formData.availableDates];

    datesToAdd.forEach(date => {
      const dateStr = getLocalDateString(date);
      newSlots[dateStr] = { startTime: '09:00', endTime: '17:00' };
      newAvailableDates.push({
        date: dateStr,
        startTime: '09:00',
        endTime: '17:00',
        available: true
      });
    });

    setDateTimeSlots(newSlots);
    setFormData({
      ...formData,
      availableDates: newAvailableDates.sort((a, b) => a.date.localeCompare(b.date))
    });
  };

  // Quick selection functions
  const selectDateRange = (type: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];

    switch (type) {
      case 'weekends':
        // All weekends (Saturdays and Sundays) for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dayOfWeek = date.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
            dates.push(new Date(date));
          }
        }
        break;

      case 'weekdays':
        // All weekdays (Monday-Friday) for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dayOfWeek = date.getDay();
          if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
            dates.push(new Date(date));
          }
        }
        break;

      case 'sundays':
        // All Sundays for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (date.getDay() === 0) { // Sunday
            dates.push(new Date(date));
          }
        }
        break;

      case 'saturdays':
        // All Saturdays for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (date.getDay() === 6) { // Saturday
            dates.push(new Date(date));
          }
        }
        break;

      case 'mondays':
        // All Mondays for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (date.getDay() === 1) { // Monday
            dates.push(new Date(date));
          }
        }
        break;

      case 'fridays':
        // All Fridays for next 6 months
        for (let i = 0; i < 180; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          if (date.getDay() === 5) { // Friday
            dates.push(new Date(date));
          }
        }
        break;

      case 'next30':
        // Next 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(new Date(date));
        }
        break;

      case 'next60':
        // Next 60 days
        for (let i = 0; i < 60; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(new Date(date));
        }
        break;

      case 'thismonth':
        // All days in current month
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = today.getDate(); day <= daysInMonth; day++) {
          const date = new Date(currentYear, currentMonth, day);
          dates.push(new Date(date));
        }
        break;

      case 'nextmonth':
        // All days in next month
        const nextMonth = today.getMonth() + 1;
        const nextYear = today.getFullYear();
        if (nextMonth === 12) {
          const daysInNextMonth = new Date(nextYear + 1, 1, 0).getDate();
          for (let day = 1; day <= daysInNextMonth; day++) {
            const date = new Date(nextYear + 1, 0, day);
            dates.push(new Date(date));
          }
        } else {
          const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
          for (let day = 1; day <= daysInNextMonth; day++) {
            const date = new Date(nextYear, nextMonth, day);
            dates.push(new Date(date));
          }
        }
        break;
    }

    addDatesWithDefaults(dates);
  };

  // Apply date range
  const applyDateRange = () => {
    if (!rangeStart || !rangeEnd) return;
    applyDateRangeWithDates(rangeStart, rangeEnd);
  };

  const applyDateRangeWithDates = (start: Date, end: Date) => {
    const dates: Date[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    addDatesWithDefaults(dates);
    setRangeStart(undefined);
    setRangeEnd(undefined);
    setRangeMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validation
    if (!formData.title || !formData.description || !formData.location.country || 
        !formData.location.state || !formData.location.district || !formData.price || 
        formData.availableDates.length === 0) {
      setError('Please fill all required fields and add at least one available date');
      setLoading(false);
      return;
    }

    // Validate time slots
    const invalidSlots = formData.availableDates.filter(d => {
      if (!d.startTime || !d.endTime) return true;
      const start = d.startTime.split(':').map(Number);
      const end = d.endTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      return startMinutes >= endMinutes;
    });
    
    if (invalidSlots.length > 0) {
      setError('Please ensure all dates have valid time slots (start time must be before end time)');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', JSON.stringify(formData.location));
      // Format availableDates with time slots for backend
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
      if (formData.contentUrl) {
        formDataToSend.append('contentUrl', formData.contentUrl);
      }
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await api.post('/hosts/experience', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        location: {
          country: 'India',
          state: '',
          district: '',
          coordinates: { lat: 0, lng: 0 }
        },
        price: '',
        duration: '2',
        maxParticipants: '10',
        contentUrl: '',
        availableDates: []
      });
      setSelectedDates([]);
      setDateTimeSlots({});
      setImageFile(null);
      setImagePreview(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/host/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="page-container py-8 md:py-12">
        <div className="section-container max-w-5xl">
          {/* Professional Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/host/dashboard')}
              className="btn-secondary mb-6 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
            
            <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 rounded-2xl md:rounded-3xl shadow-large p-8 md:p-12 text-white relative overflow-hidden">
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl mb-6 shadow-large border-2 border-white/30 p-3">
                  <span className="text-5xl">✨</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                  Create New Experience
                </h1>
                <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
                  Share your unique experience with travelers around the world. Set your availability with dates and time slots.
                </p>
              </div>
            </div>
          </div>

          <div className="content-card shadow-large border-0">

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-soft">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-start gap-3 shadow-soft">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-lg">✅</span>
                </div>
                <div className="flex-1">
                  <p className="text-green-800 font-medium">Experience created successfully! Redirecting to dashboard...</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                    <p className="text-sm text-gray-600">Tell travelers about your experience</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      placeholder="e.g., Tea Plantation Tour"
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={5}
                      placeholder="Describe your experience in detail..."
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Location</h2>
                    <p className="text-sm text-gray-600">Where is your experience located?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location.country}
                      disabled
                      className="input-field bg-white/80 border-2 border-green-200 cursor-not-allowed font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      State/Province <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.location.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, state: e.target.value, district: '' }
                      })}
                      required
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    >
                      <option value="">Select a state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      District/City <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.location.district}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, district: e.target.value }
                      })}
                      required
                      disabled={!formData.location.state || availableDistricts.length === 0}
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {!formData.location.state 
                          ? 'Select a state first' 
                          : availableDistricts.length === 0 
                          ? 'No districts available'
                          : 'Select a district/city'}
                      </option>
                      {availableDistricts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Picker Map */}
                {formData.location.district && (
                  <div className="mt-6">
                    <LocationPicker
                      district={formData.location.district}
                      state={formData.location.state}
                      initialLat={formData.location.coordinates.lat || undefined}
                      initialLng={formData.location.coordinates.lng || undefined}
                      onLocationChange={(lat, lng) => {
                        setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            coordinates: { lat, lng }
                          }
                        });
                      }}
                      required={true}
                    />
                  </div>
                )}
              </div>

              {/* Pricing & Details Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Pricing & Details</h2>
                    <p className="text-sm text-gray-600">Set your pricing and experience details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price per Person (USD) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">$</span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="50.00"
                        className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 pl-8"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (hours)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        min="1"
                        placeholder="2"
                        className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">hrs</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Participants
                    </label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                      min="1"
                      placeholder="10"
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                  </div>
                </div>
              </div>

              {/* Media Section */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-200 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center shadow-medium">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Media</h2>
                    <p className="text-sm text-gray-600">Add images and content to showcase your experience</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Experience Image (recommended)
                    </label>
                    {imagePreview ? (
                      <div className="mb-4">
                        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200 shadow-soft">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-medium"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors bg-white">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <span className="text-4xl">📷</span>
                          <span className="text-gray-600 font-medium">Click to upload image</span>
                          <span className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content URL (optional)
                    </label>
                    <input
                      type="url"
                      value={formData.contentUrl}
                      onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                      placeholder="https://example.com/video.mp4"
                      className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">Link to video or content about this experience</p>
                  </div>
                </div>
              </div>

              {/* Available Dates & Time Slots Section - Enhanced */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 md:p-8 border-2 border-purple-200 shadow-soft">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center shadow-medium">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-900">
                    Available Dates & Time Slots <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-600">Select dates and set time slots for your experience</p>
                </div>
              </div>

              {/* Quick Selection Options */}
              <div className="bg-white rounded-xl p-4 md:p-6 shadow-medium border border-gray-200 mb-6">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Selection Options</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => selectDateRange('weekends')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Weekends
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('weekdays')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('sundays')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Sundays
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('saturdays')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Saturdays
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('next30')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      Next 30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('next60')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      Next 60 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('thismonth')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      This Month
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('nextmonth')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      Next Month
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('mondays')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Mondays
                    </button>
                    <button
                      type="button"
                      onClick={() => selectDateRange('fridays')}
                      className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      All Fridays
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDates([]);
                        setFormData(prev => ({ ...prev, availableDates: [] }));
                        setDateTimeSlots({});
                      }}
                      className="px-3 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all hover:shadow-sm"
                    >
                      Clear All
                    </button>
                    <button
                      type="button"
                      onClick={() => setRangeMode(!rangeMode)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg transition-all hover:shadow-sm ${
                        rangeMode 
                          ? 'bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700' 
                          : 'text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {rangeMode ? '✓ Range Mode' : 'Range Mode'}
                    </button>
                  </div>
                </div>

                {/* Date Range Picker (when range mode is enabled) */}
                {rangeMode && (
                  <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Date Range
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={rangeStart ? getLocalDateString(rangeStart) : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const date = new Date(e.target.value);
                              setRangeStart(date);
                            }
                          }}
                          min={getLocalDateString(new Date())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          value={rangeEnd ? getLocalDateString(rangeEnd) : ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              const date = new Date(e.target.value);
                              setRangeEnd(date);
                            }
                          }}
                          min={rangeStart ? getLocalDateString(rangeStart) : getLocalDateString(new Date())}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={applyDateRange}
                          disabled={!rangeStart || !rangeEnd}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm"
                        >
                          Apply Range
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modern Calendar */}
                {isClient && (
                  rangeMode ? (
                    <DayPicker
                      mode="range"
                      required={false}
                      selected={rangeStart && rangeEnd ? { from: rangeStart, to: rangeEnd } : rangeStart ? { from: rangeStart } : undefined}
                      onSelect={(dates) => {
                        // Handle range selection
                        if (dates && 'from' in dates) {
                          if (dates.from && !dates.to) {
                            setRangeStart(dates.from);
                            setRangeEnd(undefined);
                          } else if (dates.from && dates.to) {
                            setRangeStart(dates.from);
                            setRangeEnd(dates.to);
                            // Auto-apply range when both dates are selected
                            const fromDate = dates.from;
                            const toDate = dates.to;
                            if (fromDate && toDate) {
                              setTimeout(() => applyDateRangeWithDates(fromDate, toDate), 100);
                            }
                          }
                        }
                      }}
                      disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                      numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                      className="rdp-calendar"
                      classNames={{
                        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                        month: 'space-y-4',
                        caption: 'flex justify-center pt-1 relative items-center mb-4',
                        caption_label: 'text-lg font-bold text-gray-900',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary-50 rounded-lg transition-all cursor-pointer',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex mb-2',
                        head_cell: 'text-gray-500 rounded-md w-10 font-semibold text-sm',
                        row: 'flex w-full mt-2',
                        cell: 'text-center text-sm p-0 relative',
                        day: 'h-10 w-10 p-0 font-normal rounded-lg transition-all cursor-pointer',
                        day_selected: 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white font-semibold',
                        day_today: 'bg-blue-100 text-blue-900 font-semibold',
                        day_outside: 'text-gray-400 opacity-50',
                        day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
                        day_hidden: 'invisible',
                      }}
                      styles={{
                        months: { display: 'flex', gap: '1rem' },
                        month: { margin: 0 },
                        caption: { position: 'relative', paddingTop: '0.5rem' },
                        nav: { display: 'flex', gap: '0.25rem' },
                      }}
                    />
                  ) : (
                    <DayPicker
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => {
                        // Handle multiple date selection
                        if (dates && Array.isArray(dates)) {
                          // Handle multiple date selection using local date strings
                          const dateStrings = dates.map(d => getLocalDateString(d));
                          const currentDateStrings = selectedDates.map(d => getLocalDateString(d));
                          
                          // Find newly added dates
                          const newDates = dates.filter(d => {
                            const dateStr = getLocalDateString(d);
                            return !currentDateStrings.includes(dateStr);
                          });
                          
                          // Find removed dates
                          const removedDates = selectedDates.filter(d => {
                            const dateStr = getLocalDateString(d);
                            return !dateStrings.includes(dateStr);
                          });
                          
                          // Add new dates with default time slots
                          newDates.forEach(date => {
                            const dateStr = getLocalDateString(date);
                            // Create date at midnight local time
                            const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                            setDateTimeSlots(prev => ({
                              ...prev,
                              [dateStr]: { startTime: '09:00', endTime: '17:00' }
                            }));
                            setFormData(prev => ({
                              ...prev,
                              availableDates: [
                                ...prev.availableDates,
                                {
                                  date: dateStr,
                                  startTime: '09:00',
                                  endTime: '17:00',
                                  available: true
                                }
                              ].sort((a, b) => a.date.localeCompare(b.date))
                            }));
                          });
                          
                          // Remove deleted dates
                          removedDates.forEach(date => {
                            const dateStr = getLocalDateString(date);
                            setDateTimeSlots(prev => {
                              const newSlots = { ...prev };
                              delete newSlots[dateStr];
                              return newSlots;
                            });
                            setFormData(prev => ({
                              ...prev,
                              availableDates: prev.availableDates.filter(d => d.date !== dateStr)
                            }));
                          });
                          
                          // Update selectedDates with properly normalized dates
                          const normalizedDates = dates.map(d => 
                            new Date(d.getFullYear(), d.getMonth(), d.getDate())
                          );
                          setSelectedDates(normalizedDates);
                        }
                      }}
                      disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                      numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                      className="rdp-calendar"
                      classNames={{
                        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                        month: 'space-y-4',
                        caption: 'flex justify-center pt-1 relative items-center mb-4',
                        caption_label: 'text-lg font-bold text-gray-900',
                        nav: 'space-x-1 flex items-center',
                        nav_button: 'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-primary-50 rounded-lg transition-all cursor-pointer',
                        nav_button_previous: 'absolute left-1',
                        nav_button_next: 'absolute right-1',
                        table: 'w-full border-collapse space-y-1',
                        head_row: 'flex mb-2',
                        head_cell: 'text-gray-500 rounded-md w-10 font-semibold text-sm',
                        row: 'flex w-full mt-2',
                        cell: 'text-center text-sm p-0 relative',
                        day: 'h-10 w-10 p-0 font-normal rounded-lg transition-all cursor-pointer',
                        day_selected: 'bg-primary-500 text-white hover:bg-primary-600 hover:text-white focus:bg-primary-500 focus:text-white font-semibold',
                        day_today: 'bg-blue-100 text-blue-900 font-semibold',
                        day_outside: 'text-gray-400 opacity-50',
                        day_disabled: 'text-gray-300 opacity-50 cursor-not-allowed',
                        day_hidden: 'invisible',
                      }}
                      styles={{
                        months: { display: 'flex', gap: '1rem' },
                        month: { margin: 0 },
                        caption: { position: 'relative', paddingTop: '0.5rem' },
                        nav: { display: 'flex', gap: '0.25rem' },
                      }}
                    />
                  )
                )}
              </div>

              {/* Selected Dates with Time Slots */}
              {formData.availableDates.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Selected Dates ({formData.availableDates.length}):
                    </p>
                    <span className="text-xs text-gray-500">Click dates in calendar to add/remove</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.availableDates.map((dateSlot, idx) => {
                      const dateObj = new Date(dateSlot.date);
                      const slots = dateTimeSlots[dateSlot.date] || { startTime: dateSlot.startTime, endTime: dateSlot.endTime };
                      
                      return (
                        <div
                          key={idx}
                          className="bg-white rounded-xl p-5 border-2 border-purple-200 shadow-soft hover:border-purple-300 transition-all"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-medium">
                                {format(dateObj, 'd')}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">
                                  {format(dateObj, 'MMMM d, yyyy')}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(dateObj, 'EEEE')}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDate(dateSlot.date)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all"
                              title="Remove date"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Time Slot Selection */}
                          <div className="space-y-3 pt-3 border-t border-gray-200">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                              Time Slots <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                  Start Time
                                </label>
                                <input
                                  type="time"
                                  value={slots.startTime}
                                  onChange={(e) => handleTimeSlotChange(dateSlot.date, 'startTime', e.target.value)}
                                  className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 text-sm py-2"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                  End Time
                                </label>
                                <input
                                  type="time"
                                  value={slots.endTime}
                                  onChange={(e) => handleTimeSlotChange(dateSlot.date, 'endTime', e.target.value)}
                                  className="input-field bg-white border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 text-sm py-2"
                                  required
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-primary-50 px-3 py-2 rounded-lg border border-primary-200">
                              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-xs font-semibold text-primary-700">
                                {slots.startTime} - {slots.endTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl border-2 border-dashed border-purple-300">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-gray-600 font-medium mb-1">No dates selected</p>
                  <p className="text-sm text-gray-500">Click on dates in the calendar above to add availability</p>
                </div>
              )}
            </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/host/dashboard')}
                  className="btn-secondary flex-1 py-4 text-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed shadow-large hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Creating Experience...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Create Experience</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

