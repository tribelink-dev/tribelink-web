'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import AbodeSidebar from '@/components/AbodeSidebar';
import LocationPicker from '@/components/LocationPicker';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion } from 'framer-motion';

const PROPERTY_TYPES = ['Traditional Home', 'Heritage House', 'Village Home', 'Farmhouse', 'Cottage', 'Other'];
const CULTURAL_CATEGORIES = ['Cooking', 'Craft', 'Music', 'Dance', 'Ritual', 'Festival', 'Agriculture', 'Traditional Medicine', 'Other'];
const SIGNIFICANCE_TYPES = ['Cultural', 'Historical', 'Religious', 'Natural', 'Artistic', 'Other'];

export default function EditAbodePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    abodeDetails: {
      title: '',
      description: '',
      capacity: 2,
      bedrooms: 1,
      bathrooms: 1,
      amenities: [] as string[],
      houseRules: [] as string[],
      propertyType: 'Traditional Home',
    },
    culturalPractices: [] as Array<{
      practice: string;
      description: string;
      category: string;
    }>,
    nearbyPlaces: [] as Array<{
      name: string;
      description: string;
      distance: number;
      significance: string;
      coordinates: { lat: number; lng: number };
    }>,
    availability: [] as Array<{
      date: string;
      available: boolean;
      bookedSlots: number;
    }>,
    pricing: {
      pricePerNight: '',
      currency: 'INR',
      weeklyDiscount: 0,
      monthlyDiscount: 0,
    },
    languages: [] as string[],
    familyInfo: {
      familySize: '',
      background: '',
      generations: '',
    },
    location: {
      country: 'India',
      state: '',
      district: '',
      address: '',
      coordinates: { lat: 0, lng: 0 },
      nearbyLandmarks: [] as string[],
    },
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newHouseRule, setNewHouseRule] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [alwaysAvailable, setAlwaysAvailable] = useState(false);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
        router.push('/host/login');
        return;
      }

      try {
        const hostData = JSON.parse(host);
        if (hostData.providerType !== 'LOCAL_HOST') {
          router.push('/host/dashboard');
          return;
        }
      } catch (e) {
        router.push('/host/login');
      }
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      fetchAbode();
    }
  }, [params.id]);

  const fetchAbode = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/abodes/${params.id}`);
      const abode = response.data.localHost;

      setFormData({
        abodeDetails: {
          title: abode.abodeDetails?.title || '',
          description: abode.abodeDetails?.description || '',
          capacity: abode.abodeDetails?.capacity || 2,
          bedrooms: abode.abodeDetails?.bedrooms || 1,
          bathrooms: abode.abodeDetails?.bathrooms || 1,
          amenities: abode.abodeDetails?.amenities || [],
          houseRules: abode.abodeDetails?.houseRules || [],
          propertyType: abode.abodeDetails?.propertyType || 'Traditional Home',
        },
        culturalPractices: abode.culturalPractices || [],
        nearbyPlaces: abode.nearbyPlaces || [],
        availability: abode.availability || [],
        pricing: {
          pricePerNight: abode.pricing?.pricePerNight || '',
          currency: abode.pricing?.currency || 'INR',
          weeklyDiscount: abode.pricing?.weeklyDiscount || 0,
          monthlyDiscount: abode.pricing?.monthlyDiscount || 0,
        },
        languages: abode.languages || [],
        familyInfo: {
          familySize: abode.familyInfo?.familySize || '',
          background: abode.familyInfo?.background || '',
          generations: abode.familyInfo?.generations || '',
        },
        location: {
          country: abode.location?.country || 'India',
          state: abode.location?.state || '',
          district: abode.location?.district || '',
          address: abode.location?.address || '',
          coordinates: {
            lat: abode.location?.coordinates?.lat || 0,
            lng: abode.location?.coordinates?.lng || 0,
          },
          nearbyLandmarks: abode.location?.nearbyLandmarks || [],
        },
      });

      setExistingImages(abode.images || []);
      
      // Set selected dates from availability
      if (abode.availability && abode.availability.length > 0) {
        const dates = abode.availability
          .filter((a: any) => a.available)
          .map((a: any) => new Date(a.date));
        setSelectedDates(dates);
      }
    } catch (err: any) {
      console.error('Error fetching abode:', err);
      setError(err.response?.data?.message || 'Failed to load abode');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 10) {
      setError('Maximum 10 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFiles(prev => [...prev, file]);
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggedExistingIndex, setDraggedExistingIndex] = useState<number | null>(null);

  const handleDragStart = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setDraggedExistingIndex(index);
    } else {
      setDraggedIndex(index);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, isExisting: boolean = false) => {
    e.preventDefault();
    if (isExisting) {
      if (draggedExistingIndex === null || draggedExistingIndex === dropIndex) {
        setDraggedExistingIndex(null);
        return;
      }
      const newImages = [...existingImages];
      const draggedImage = newImages[draggedExistingIndex];
      newImages.splice(draggedExistingIndex, 1);
      newImages.splice(dropIndex, 0, draggedImage);
      setExistingImages(newImages);
      setDraggedExistingIndex(null);
    } else {
      if (draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        return;
      }
      const newImageFiles = [...imageFiles];
      const newImagePreviews = [...imagePreviews];
      const draggedFile = newImageFiles[draggedIndex];
      const draggedPreview = newImagePreviews[draggedIndex];
      newImageFiles.splice(draggedIndex, 1);
      newImagePreviews.splice(draggedIndex, 1);
      newImageFiles.splice(dropIndex, 0, draggedFile);
      newImagePreviews.splice(dropIndex, 0, draggedPreview);
      setImageFiles(newImageFiles);
      setImagePreviews(newImagePreviews);
      setDraggedIndex(null);
    }
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.abodeDetails.amenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        abodeDetails: {
          ...prev.abodeDetails,
          amenities: [...prev.abodeDetails.amenities, newAmenity.trim()],
        },
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      abodeDetails: {
        ...prev.abodeDetails,
        amenities: prev.abodeDetails.amenities.filter((_, i) => i !== index),
      },
    }));
  };

  const addHouseRule = () => {
    if (newHouseRule.trim() && !formData.abodeDetails.houseRules.includes(newHouseRule.trim())) {
      setFormData(prev => ({
        ...prev,
        abodeDetails: {
          ...prev.abodeDetails,
          houseRules: [...prev.abodeDetails.houseRules, newHouseRule.trim()],
        },
      }));
      setNewHouseRule('');
    }
  };

  const removeHouseRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      abodeDetails: {
        ...prev.abodeDetails,
        houseRules: prev.abodeDetails.houseRules.filter((_, i) => i !== index),
      },
    }));
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()],
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index),
    }));
  };

  const addCulturalPractice = () => {
    setFormData(prev => ({
      ...prev,
      culturalPractices: [
        ...prev.culturalPractices,
        { practice: '', description: '', category: 'Cooking' },
      ],
    }));
  };

  const updateCulturalPractice = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      culturalPractices: prev.culturalPractices.map((cp, i) =>
        i === index ? { ...cp, [field]: value } : cp
      ),
    }));
  };

  const removeCulturalPractice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      culturalPractices: prev.culturalPractices.filter((_, i) => i !== index),
    }));
  };

  const addNearbyPlace = () => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: [
        ...prev.nearbyPlaces,
        { name: '', description: '', distance: 0, significance: 'Cultural', coordinates: { lat: 0, lng: 0 } },
      ],
    }));
  };

  const updateNearbyPlace = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.map((np, i) =>
        i === index ? { ...np, [field]: value } : np
      ),
    }));
  };

  const removeNearbyPlace = (index: number) => {
    setFormData(prev => ({
      ...prev,
      nearbyPlaces: prev.nearbyPlaces.filter((_, i) => i !== index),
    }));
  };

  const addLandmark = () => {
    if (newLandmark.trim() && !formData.location.nearbyLandmarks.includes(newLandmark.trim())) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          nearbyLandmarks: [...prev.location.nearbyLandmarks, newLandmark.trim()],
        },
      }));
      setNewLandmark('');
    }
  };

  const removeLandmark = (index: number) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        nearbyLandmarks: prev.location.nearbyLandmarks.filter((_, i) => i !== index),
      },
    }));
  };

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (dates) {
      setSelectedDates(dates);
      const availability = dates.map(date => ({
        date: date.toISOString(),
        available: true,
        bookedSlots: 0,
      }));
      setFormData(prev => ({ ...prev, availability }));
    }
  };

  const handleRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setDateRange(range);
      if (range.from && range.to) {
        const dates: Date[] = [];
        const from = new Date(range.from);
        const to = new Date(range.to);
        
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
          dates.push(new Date(d));
        }
        handleDateSelect(dates);
      } else if (range.from) {
        setSelectedDates([range.from]);
        handleDateSelect([range.from]);
      }
    }
  };

  // Quick selection helpers
  const selectNext30Days = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 29);
    setDateRange({ from: today, to: endDate });
    handleRangeSelect({ from: today, to: endDate });
  };

  const selectNext30DaysFromSelected = () => {
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
    setDateRange({ from: startDate, to: endDate });
    handleRangeSelect({ from: startDate, to: endDate });
  };

  const selectNext90Days = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 89);
    setDateRange({ from: today, to: endDate });
    handleRangeSelect({ from: today, to: endDate });
  };

  const selectNext6Months = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 6);
    setDateRange({ from: today, to: endDate });
    handleRangeSelect({ from: today, to: endDate });
  };

  const selectAllWeekends = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 6);
    
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dates.push(new Date(d));
      }
    }
    handleDateSelect([...selectedDates, ...dates]);
  };

  const selectAllWeekdays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates: Date[] = [];
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 6);
    
    for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        dates.push(new Date(d));
      }
    }
    handleDateSelect([...selectedDates, ...dates]);
  };

  const clearAllDates = () => {
    setSelectedDates([]);
    setDateRange({});
    setFormData(prev => ({ ...prev, availability: [] }));
  };

  const handleAlwaysAvailableToggle = (checked: boolean) => {
    setAlwaysAvailable(checked);
    if (checked) {
      // Select next 365 days when "always available" is enabled
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 364);
      setDateRange({ from: today, to: endDate });
      handleRangeSelect({ from: today, to: endDate });
    } else {
      clearAllDates();
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: { lat, lng },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (!formData.abodeDetails.title.trim()) {
        throw new Error('Catchy title is required');
      }
      if (!formData.abodeDetails.description.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.location.state || !formData.location.district) {
        throw new Error('State and district are required');
      }
      if (!formData.pricing.pricePerNight || Number(formData.pricing.pricePerNight) <= 0) {
        throw new Error('Valid price per night is required');
      }
      if (formData.location.coordinates.lat === 0 || formData.location.coordinates.lng === 0) {
        throw new Error('Please set location on the map');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('abodeDetails', JSON.stringify(formData.abodeDetails));
      formDataToSend.append('culturalPractices', JSON.stringify(formData.culturalPractices));
      formDataToSend.append('nearbyPlaces', JSON.stringify(formData.nearbyPlaces));
      formDataToSend.append('availability', JSON.stringify(formData.availability));
      formDataToSend.append('pricing', JSON.stringify({
        ...formData.pricing,
        pricePerNight: Number(formData.pricing.pricePerNight),
      }));
      formDataToSend.append('languages', JSON.stringify(formData.languages));
      formDataToSend.append('familyInfo', JSON.stringify({
        ...formData.familyInfo,
        familySize: formData.familyInfo.familySize ? Number(formData.familyInfo.familySize) : undefined,
        generations: formData.familyInfo.generations ? Number(formData.familyInfo.generations) : undefined,
      }));
      formDataToSend.append('location', JSON.stringify(formData.location));

      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await api.put(`/abodes/${params.id}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/host/abodes/manage');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error updating abode:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update abode');
    } finally {
      setSaving(false);
    }
  };

  const districts = formData.location.state ? DISTRICTS_BY_STATE[formData.location.state] || [] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AbodeSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-slate-900">Loading abode details...</div>
          </div>
        </div>
      </div>
    );
  }

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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                      Edit Your Abode
                    </h1>
                    <p className="text-white/90 text-lg">
                      Update your abode information and make it even more appealing to travelers.
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
                {error}
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
                Abode updated successfully! Redirecting...
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
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
                    Catchy Title * <span className="text-slate-600 text-xs font-normal">(Max 100 characters)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.abodeDetails.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      abodeDetails: { ...prev.abodeDetails, title: e.target.value },
                    }))}
                    maxLength={100}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all text-lg"
                    placeholder="e.g., 'Cozy Heritage Home in the Heart of Kerala'"
                    required
                  />
                    <p className="mt-1 text-sm text-slate-600">
                    {formData.abodeDetails.title.length}/100 characters
                  </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.abodeDetails.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      abodeDetails: { ...prev.abodeDetails, description: e.target.value },
                    }))}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
                    placeholder="Describe your abode..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Property Type *
                    </label>
                    <select
                      value={formData.abodeDetails.propertyType}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abodeDetails: { ...prev.abodeDetails, propertyType: e.target.value },
                      }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    >
                      {PROPERTY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Capacity *
                    </label>
                    <input
                      type="number"
                      value={formData.abodeDetails.capacity}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abodeDetails: { ...prev.abodeDetails, capacity: Number(e.target.value) },
                      }))}
                      min="1"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      value={formData.abodeDetails.bedrooms}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abodeDetails: { ...prev.abodeDetails, bedrooms: Number(e.target.value) },
                      }))}
                      min="1"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      value={formData.abodeDetails.bathrooms}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abodeDetails: { ...prev.abodeDetails, bathrooms: Number(e.target.value) },
                      }))}
                      min="1"
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Location with Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  📍
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Location</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      State *
                    </label>
                    <select
                      value={formData.location.state}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, state: e.target.value, district: '' },
                      }))}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                      required
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      District *
                    </label>
                    <select
                      value={formData.location.district}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, district: e.target.value },
                      }))}
                      disabled={!formData.location.state || districts.length === 0}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                      required
                    >
                      <option value="">Select District</option>
                      {districts.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value },
                    }))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    placeholder="Street address (optional)"
                  />
                </div>

                {/* Map Location Picker */}
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Exact Location on Map *
                  </label>
                  <LocationPicker
                    district={formData.location.district}
                    state={formData.location.state}
                    initialLat={formData.location.coordinates.lat || undefined}
                    initialLng={formData.location.coordinates.lng || undefined}
                    onLocationChange={handleLocationChange}
                    required
                  />
                </div>
              </div>
            </motion.div>

            {/* Pricing */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  💰
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Pricing</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Price per Night (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.pricePerNight}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, pricePerNight: e.target.value },
                    }))}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    required
                  />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Weekly Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.weeklyDiscount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, weeklyDiscount: Number(e.target.value) },
                    }))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Monthly Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.pricing.monthlyDiscount}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pricing: { ...prev.pricing, monthlyDiscount: Number(e.target.value) },
                    }))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                </div>
              </div>
            </motion.div>

            {/* Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                  🖼️
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Images</h2>
              </div>

              <div className="space-y-6">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((img, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index, true)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index, true)}
                          className={`relative group cursor-move ${
                            draggedExistingIndex === index ? 'opacity-50' : ''
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-md"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            {index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Images</h3>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <svg className="w-16 h-16 text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-slate-700 font-semibold mb-2">Click to upload images</p>
                      <p className="text-sm text-slate-600">Up to 10 images, max 5MB each</p>
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index, false)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index, false)}
                          className={`relative group cursor-move ${
                            draggedIndex === index ? 'opacity-50' : ''
                          }`}
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-md"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                            </svg>
                            {existingImages.length + index + 1}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600 z-10"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {(existingImages.length > 1 || imagePreviews.length > 1) && (
                    <p className="mt-2 text-sm text-slate-600 text-center">
                      💡 Drag images to rearrange. The first image will be your main photo.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Additional sections - Amenities, Rules, Languages, etc. */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Amenities */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    ⭐
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Amenities</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                    placeholder="e.g., WiFi, Kitchen, Air Conditioning"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                {formData.abodeDetails.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.abodeDetails.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        {amenity}
                        <button
                          type="button"
                          onClick={() => removeAmenity(index)}
                          className="text-slate-600 hover:text-slate-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* House Rules */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    📋
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">House Rules</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newHouseRule}
                    onChange={(e) => setNewHouseRule(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHouseRule())}
                    placeholder="e.g., No smoking, Respect local customs"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addHouseRule}
                    className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                {formData.abodeDetails.houseRules.length > 0 && (
                  <ul className="space-y-2">
                    {formData.abodeDetails.houseRules.map((rule, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border border-slate-200 hover:shadow-md transition-all"
                        >
                          <span className="text-slate-900 font-medium">{rule}</span>
                        <button
                          type="button"
                          onClick={() => removeHouseRule(index)}
                          className="px-3 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Languages */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                    🗣️
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Languages Spoken</h3>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                    placeholder="e.g., English, Hindi, Malayalam"
                    className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={addLanguage}
                    className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                {formData.languages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-slate-100 text-slate-800 rounded-full text-sm font-medium flex items-center gap-2"
                      >
                        {lang}
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="text-slate-600 hover:text-slate-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white">
                      📅
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Availability Calendar</h3>
                  </div>
                  {selectedDates.length > 0 && (
                    <span className="px-4 py-2 bg-gradient-to-r from-slate-600 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-md">
                      {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                </div>

                {/* Always Available Toggle */}
                <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                  <label className="flex items-center gap-4 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={alwaysAvailable}
                        onChange={(e) => handleAlwaysAvailableToggle(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-14 h-8 rounded-full transition-all duration-300 ${
                        alwaysAvailable 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                          : 'bg-gray-300'
                      }`}>
                        <div className={`w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300 mt-1 ${
                          alwaysAvailable ? 'translate-x-7' : 'translate-x-1'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-bold text-green-900">Always Available</p>
                          <p className="text-sm text-green-700">Enable this if your abode is available year-round. You can still block specific dates later.</p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {!alwaysAvailable && (
                  <>
                    {/* Quick Actions */}
                    <div className="mb-6 p-5 bg-slate-50 rounded-xl border-2 border-slate-200">
                      <p className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Quick Selection (Click to apply):
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                          type="button"
                          onClick={selectNext30DaysFromSelected}
                          className="px-4 py-3 bg-white border-2 border-indigo-300 text-indigo-700 rounded-xl hover:bg-indigo-50 hover:border-indigo-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105"
                        >
                          📅 30 Days (from selected)
                        </button>
                        <button
                          type="button"
                          onClick={selectNext90Days}
                          className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105"
                        >
                          📅 90 Days
                        </button>
                        <button
                          type="button"
                          onClick={selectNext6Months}
                          className="px-4 py-3 bg-white border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 hover:border-slate-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105"
                        >
                          📅 6 Months
                        </button>
                        <button
                          type="button"
                          onClick={selectAllWeekends}
                          className="px-4 py-3 bg-white border-2 border-purple-300 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105"
                        >
                          🎉 Weekends
                        </button>
                        <button
                          type="button"
                          onClick={selectAllWeekdays}
                          className="px-4 py-3 bg-white border-2 border-blue-300 text-blue-700 rounded-xl hover:bg-blue-50 hover:border-blue-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105"
                        >
                          💼 Weekdays
                        </button>
                        {selectedDates.length > 0 && (
                          <button
                            type="button"
                            onClick={clearAllDates}
                            className="px-4 py-3 bg-red-50 border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-100 hover:border-red-500 hover:shadow-md transition-all text-sm font-semibold transform hover:scale-105 col-span-2 md:col-span-1"
                          >
                            🗑️ Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Calendar */}
                    <div className="mb-4">
                      <p className="text-sm text-slate-700 text-center mb-4 font-medium">
                        📅 <span className="font-semibold">Click dates to select</span> • Click again to deselect
                      </p>
                      <div className="flex justify-center">
                        <DayPicker
                          mode="multiple"
                          selected={selectedDates}
                          onSelect={(dates) => handleDateSelect(dates as Date[])}
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                          }}
                          numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
                            className="rdp-slate"
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
                  </>
                )}

                {/* Summary */}
                {selectedDates.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-indigo-50 rounded-xl border-2 border-slate-300">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                          ✓
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {alwaysAvailable 
                              ? 'Your abode is set to always available!' 
                              : `${selectedDates.length} date${selectedDates.length !== 1 ? 's' : ''} selected for availability`
                            }
                          </p>
                          {!alwaysAvailable && dateRange.from && dateRange.to && (
                            <p className="text-sm text-slate-700 mt-1">
                            From {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>

            {/* Submit Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex justify-end gap-4"
            >
              <button
                type="button"
                onClick={() => router.push('/host/abodes/manage')}
                className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </form>
        </div>
      </div>
    </div>
  );
}

