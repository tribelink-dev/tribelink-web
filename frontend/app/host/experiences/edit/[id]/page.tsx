'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { getImageUrl } from '@/lib/imageUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CategorySelector, { EXPERIENCE_CATEGORIES } from '@/components/CategorySelector';
import { CURRENCIES, POPULAR_CURRENCIES, getCurrencyByCode } from '@/lib/currency';
import { motion } from 'framer-motion';

export default function EditExperiencePage() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params?.id as string;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: null as string | null,
    subcategory: null as string | null,
    location: {
      country: 'India',
      state: '',
      district: ''
    },
    price: '',
    currency: 'USD',
    duration: '2',
    maxParticipants: '10',
    contentUrl: '',
    availableDates: [] as string[]
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingExperience, setLoadingExperience] = useState(true);
  const [success, setSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Get districts for selected state
  const availableDistricts = formData.location.state ? (DISTRICTS_BY_STATE[formData.location.state] || []) : [];

  useEffect(() => {
    // Check if user is logged in as host
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
        router.push('/host/login');
        return;
      }
    }
    
    if (experienceId) {
      fetchExperience();
    }
  }, [experienceId, router]);

  const fetchExperience = async () => {
    try {
      setLoadingExperience(true);
      const response = await api.get(`/hosts/experience/${experienceId}`);
      const experience = response.data.experience;
      
      // Map category name back to category ID
      const categoryNameToId = (name: string): string | null => {
        const category = EXPERIENCE_CATEGORIES.find(cat => cat.name === name);
        return category?.id || null;
      };

      setFormData({
        title: experience.title || '',
        description: experience.description || '',
        category: experience.category ? categoryNameToId(experience.category) : null,
        subcategory: experience.subcategory || null,
        location: {
          country: experience.location?.country || 'India',
          state: experience.location?.state || '',
          district: experience.location?.district || ''
        },
        price: experience.price?.toString() || '',
        currency: experience.currency || 'USD',
        duration: experience.duration?.toString() || '2',
        maxParticipants: experience.maxParticipants?.toString() || '10',
        contentUrl: experience.contentUrl || '',
        availableDates: (() => {
          const dates = experience.availableDates?.map((d: any) => {
            // Handle both string and object formats
            let dateValue: string;
            if (typeof d === 'string') {
              dateValue = d.split('T')[0];
            } else if (d && d.date) {
              const date = typeof d.date === 'string' ? d.date : d.date;
              dateValue = new Date(date).toISOString().split('T')[0];
            } else {
              dateValue = new Date(d).toISOString().split('T')[0];
            }
            return dateValue;
          }) || [];
          
          // Initialize selectedDates for calendar highlighting
          const dateObjects = dates.map((d: string | Date) => new Date(d)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
          setSelectedDates(dateObjects);
          
          return dates;
        })()
      });
      
      if (experience.imageUrl) {
        // Use centralized image utility for consistent URL handling
        const imageUrl = getImageUrl(experience.imageUrl ?? undefined) ?? null;
        setCurrentImageUrl(imageUrl);
      }
    } catch (err: any) {
      console.error('Error fetching experience:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to load experience';
      setError(errorMessage);
      
      // Log more details for debugging
      if (err.response?.data?.details) {
        console.error('Error details:', err.response.data.details);
      }
    } finally {
      setLoadingExperience(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB limit for videos, 10MB for images)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        setError(`${isVideo ? 'Video' : 'Image'} size must be less than ${maxSize / (1024 * 1024)}MB`);
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
    setCurrentImageUrl(null);
  };

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    
    const dateString = date.toISOString().split('T')[0];
    const dateOnly = new Date(dateString);
    
    // Check if date is already selected
    const isSelected = selectedDates.some(d => 
      d.toISOString().split('T')[0] === dateString
    );
    
    if (isSelected) {
      // Remove date if already selected
      setSelectedDates(selectedDates.filter(d => 
        d.toISOString().split('T')[0] !== dateString
      ));
      setFormData({
        ...formData,
        availableDates: formData.availableDates.filter(d => d !== dateString)
      });
    } else {
      // Add date if not selected
      const newDates = [...selectedDates, dateOnly].sort((a, b) => a.getTime() - b.getTime());
      setSelectedDates(newDates);
      setFormData({
        ...formData,
        availableDates: [...formData.availableDates, dateString].sort()
      });
    }
  };

  const handleRemoveDate = (dateString: string) => {
    setSelectedDates(selectedDates.filter(d => 
      d.toISOString().split('T')[0] !== dateString
    ));
    setFormData({
      ...formData,
      availableDates: formData.availableDates.filter(d => d !== dateString)
    });
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${formData.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(true);
      await api.delete(`/hosts/experience/${experienceId}`);
      router.push('/host/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete experience');
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    // Validation
    if (!formData.title || !formData.description ||
        !formData.location.country || !formData.location.state || !formData.location.district || 
        !formData.price || formData.availableDates.length === 0) {
      setError('Please fill all required fields and add at least one available date');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      if (formData.subcategory) {
        formDataToSend.append('subcategory', formData.subcategory);
      }
      formDataToSend.append('location', JSON.stringify(formData.location));
      
      // Format availableDates with time slots for backend (matching add page format)
      const formattedDates = formData.availableDates.map((dateString: string) => ({
        date: dateString,
        startTime: '09:00', // Default start time
        endTime: '17:00', // Default end time
        available: true
      }));
      formDataToSend.append('availableDates', JSON.stringify(formattedDates));
      
      formDataToSend.append('price', formData.price);
      formDataToSend.append('currency', formData.currency);
      formDataToSend.append('duration', formData.duration);
      formDataToSend.append('maxParticipants', formData.maxParticipants);
      if (formData.contentUrl) {
        formDataToSend.append('contentUrl', formData.contentUrl);
      }
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const response = await api.put(`/hosts/experience/${experienceId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/host/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error updating experience:', err);
      console.error('Full error response:', err.response?.data);
      
      let errorMessage = 'Failed to update experience. Please try again.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle validation errors with details
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = `Validation errors:\n${errorData.errors.join('\n')}`;
        } else if (errorData.details && Array.isArray(errorData.details)) {
          const detailMessages = errorData.details.map((d: any) => 
            `${d.field || 'Field'}: ${d.message || d}`
          ).join('\n');
          errorMessage = `Validation errors:\n${detailMessages}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingExperience) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
        <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-slate-900">Loading experience details...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <HostSidebar />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
            </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                      Edit Your Experience
            </h1>
                    <p className="text-white/90 text-lg">
                      Update your experience information and make it even more appealing to travelers.
            </p>
          </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="whitespace-pre-line">{error}</span>
            </div>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 rounded-xl shadow-lg"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Experience updated successfully! Redirecting...
            </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  📝
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
              </div>

              <div className="space-y-6">
            <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Experience Title * <span className="text-slate-600 text-xs font-normal">(Max 100 characters)</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                required
                    placeholder="e.g., Tea Plantation Tour in Munnar"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-lg"
              />
                  <p className="mt-1 text-sm text-slate-600">
                    {formData.title.length}/100 characters
                  </p>
            </div>

            <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                    rows={6}
                placeholder="Describe your experience in detail..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
              />
            </div>
              </div>
            </motion.div>

            {/* Category Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  🏷️
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Experience Category (Optional)</h2>
              </div>

              <CategorySelector
                selectedCategory={formData.category}
                selectedSubcategory={formData.subcategory}
                onCategoryChange={(category, subcategory) => {
                  setFormData({ ...formData, category, subcategory });
                }}
              />
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  📍
            </div>
                <h2 className="text-2xl font-bold text-slate-900">Location</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    State *
                </label>
                <select
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value, district: '' }
                  })}
                  required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                >
                    <option value="">Select State</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    District *
                </label>
                <select
                  value={formData.location.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, district: e.target.value }
                  })}
                  required
                  disabled={!formData.location.state || availableDistricts.length === 0}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                    <option value="">Select District</option>
                  {availableDistricts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            </motion.div>

            {/* Pricing & Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  💰
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Pricing & Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Currency *
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      required
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    >
                      {POPULAR_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} - {curr.name}
                        </option>
                      ))}
                      <optgroup label="Other Currencies">
                        {CURRENCIES.filter(c => !POPULAR_CURRENCIES.find(pc => pc.code === c.code)).map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.flag} {curr.code} - {curr.name}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Price per Person *
                    </label>
                    <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                        {getCurrencyByCode(formData.currency)?.symbol || '$'}
                      </span>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="50.00"
                      className="w-full px-4 py-3 pl-8 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      />
                </div>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Duration (hours)
                </label>
                  <div className="relative">
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="1"
                  placeholder="2"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">hrs</span>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Max Participants
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  min="1"
                  placeholder="10"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                />
                </div>
              </div>
            </motion.div>

            {/* Media Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  📷
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Media</h2>
            </div>

              <div className="space-y-6">
            <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                Experience Image
              </label>
              {imagePreview || currentImageUrl ? (
                <div className="mb-4">
                      <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-slate-200 shadow-lg">
                    <img 
                      src={imagePreview || currentImageUrl || ''} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                              parent.innerHTML = '<div class="w-full h-64 bg-slate-100 flex items-center justify-center"><span class="text-6xl">🎬</span></div>';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors z-10 shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                      <p className="text-xs text-slate-500 mt-2">Upload a new image to replace the current one</p>
                </div>
              ) : null}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-colors bg-slate-50">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <span className="text-4xl">📷</span>
                      <span className="text-slate-600 font-medium">
                    {currentImageUrl ? 'Replace Media' : 'Click to upload image or video'}
                  </span>
                      <span className="text-sm text-slate-500">Images: max 10MB | Videos: max 100MB</span>
                </label>
              </div>
            </div>

            <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                Content URL (optional)
              </label>
              <input
                type="url"
                value={formData.contentUrl}
                onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
                placeholder="https://example.com/video.mp4"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
              />
                  <p className="text-xs text-slate-500 mt-1.5">Link to video or content about this experience</p>
                </div>
              </div>
            </motion.div>

            {/* Available Dates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  📅
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Available Dates *</h2>
            </div>

              <p className="text-sm text-slate-600 mb-4">Click on dates in the calendar to select/deselect them</p>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <DatePicker
                  selected={null}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  inline
                  highlightDates={selectedDates}
                  className="w-full"
                />
              </div>
              {formData.availableDates.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    Selected Dates ({formData.availableDates.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.availableDates.map((dateString, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-slate-700">
                          {new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDate(dateString)}
                          className="text-red-500 hover:text-red-700 text-lg font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.availableDates.length === 0 && (
                <p className="text-sm text-slate-500 mt-2">Add at least one available date</p>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-4 pt-6"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/host/dashboard')}
                  className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-slate-600 to-indigo-600 hover:from-slate-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Update Experience</span>
                    </>
                  )}
                </button>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Experience</span>
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 mt-2 text-center">This action cannot be undone</p>
              </div>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
}

