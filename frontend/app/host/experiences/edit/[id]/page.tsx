'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function EditExperiencePage() {
  const router = useRouter();
  const params = useParams();
  const experienceId = params?.id as string;
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      country: 'India',
      state: '',
      district: ''
    },
    price: '',
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
      
      setFormData({
        title: experience.title || '',
        description: experience.description || '',
        location: {
          country: experience.location?.country || 'India',
          state: experience.location?.state || '',
          district: experience.location?.district || ''
        },
        price: experience.price?.toString() || '',
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
        const imageUrl = experience.imageUrl.startsWith('http') 
          ? experience.imageUrl 
          : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000'}${experience.imageUrl}`;
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
      router.push('/host/experiences');
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
    if (!formData.title || !formData.description || !formData.location.country || 
        !formData.location.state || !formData.location.district || !formData.price || 
        formData.availableDates.length === 0) {
      setError('Please fill all required fields and add at least one available date');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('location', JSON.stringify(formData.location));
      formDataToSend.append('availableDates', JSON.stringify(formData.availableDates));
      formDataToSend.append('price', formData.price);
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
        router.push('/host/experiences');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update experience. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingExperience) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading experience...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-3xl">
        <div className="content-card">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/host/experiences')}
              className="btn-secondary"
            >
              ← Back to Experiences
            </button>
          </div>

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-500 rounded-2xl mb-6 shadow-medium">
              <span className="text-4xl">✏️</span>
            </div>
            <h1 className="heading-primary text-gray-900">
              Edit Experience
            </h1>
            <p className="text-subtitle text-gray-600 mb-0">
              Update your experience details
            </p>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
            </div>
          )}

          {success && (
            <div className="alert-success mb-6">
              <span className="text-lg">✅</span>
              <span className="flex-1">Experience updated successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Tea Plantation Tour"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={5}
                placeholder="Describe your experience in detail..."
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  disabled
                  className="input-field bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State/Province *
                </label>
                <select
                  value={formData.location.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, state: e.target.value, district: '' }
                  })}
                  required
                  className="input-field"
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
                  District/City *
                </label>
                <select
                  value={formData.location.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, district: e.target.value }
                  })}
                  required
                  disabled={!formData.location.state || availableDistricts.length === 0}
                  className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price per Person (USD) *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  min="1"
                  placeholder="2"
                  className="input-field"
                />
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
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Experience Image
              </label>
              {imagePreview || currentImageUrl ? (
                <div className="mb-4">
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-gray-200">
                    <img 
                      src={imagePreview || currentImageUrl || ''} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Upload a new image to replace the current one</p>
                </div>
              ) : null}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
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
                  <span className="text-gray-600 font-medium">
                    {currentImageUrl ? 'Replace Image' : 'Click to upload image'}
                  </span>
                  <span className="text-sm text-gray-500">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
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
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1.5">Link to video or content about this experience</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Available Dates *
              </label>
              <p className="text-xs text-gray-500 mb-3">Click on dates in the calendar to select/deselect them</p>
              <div className="border border-gray-200 rounded-xl p-4 bg-white">
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
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Dates ({formData.availableDates.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.availableDates.map((dateString, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-700">
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
                <p className="text-sm text-gray-500 mt-2">Add at least one available date</p>
              )}
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <div className="flex flex-col md:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/host/experiences')}
                  className="btn-secondary flex-1 py-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Updating...
                    </span>
                  ) : (
                    'Update Experience'
                  )}
                </button>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || loading}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Experience'
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">This action cannot be undone</p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

