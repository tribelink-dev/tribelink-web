'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import LocationPicker from '@/components/LocationPicker';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';

const PROPERTY_TYPES = ['Traditional Home', 'Heritage House', 'Village Home', 'Farmhouse', 'Cottage', 'Other'];
const CULTURAL_CATEGORIES = ['Cooking', 'Craft', 'Music', 'Dance', 'Ritual', 'Festival', 'Agriculture', 'Traditional Medicine', 'Other'];
const SIGNIFICANCE_TYPES = ['Cultural', 'Historical', 'Religious', 'Natural', 'Artistic', 'Other'];

export default function RegisterAbodePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
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
  
  // Room variants state
  const [roomVariants, setRoomVariants] = useState<Array<{
    variantId: string;
    name: string;
    description: string;
    pricePerNight: number;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
  }>>([]);
  const [defaultVariantId, setDefaultVariantId] = useState<string | null>(null);
  
  // Linked experiences state (Local Experiences)
  const [availableExperiences, setAvailableExperiences] = useState<Array<{
    _id: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    imageUrl?: string;
  }>>([]);
  const [selectedExperienceIds, setSelectedExperienceIds] = useState<string[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [showCreateExperienceModal, setShowCreateExperienceModal] = useState(false);
  const [creatingExperience, setCreatingExperience] = useState(false);
  
  // New experience form state
  const [newExperience, setNewExperience] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'INR',
    duration: '2',
    maxParticipants: '10',
  });
  const [newExperienceImage, setNewExperienceImage] = useState<File | null>(null);
  const [newExperienceImagePreview, setNewExperienceImagePreview] = useState<string | null>(null);

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
        // Any host can now register abodes, regardless of provider type
        // Fetch available experiences for this host
        fetchAvailableExperiences();
      } catch (e) {
        router.push('/host/login');
      }
    }
  }, [router]);

  // Fetch available experiences for the host
  const fetchAvailableExperiences = async () => {
    try {
      setLoadingExperiences(true);
      const response = await api.get('/hosts/experiences');
      const experiences = response.data.experiences || [];
      // Filter to only show experiences that can be linked (isAddOn or can be made addon)
      setAvailableExperiences(experiences.filter((exp: any) => !exp.isArchived));
    } catch (err: any) {
      console.error('Error fetching experiences:', err);
      // Don't show error, just continue without experiences
    } finally {
      setLoadingExperiences(false);
    }
  };

  // Room variant management functions
  const addRoomVariant = () => {
    const newVariantId = `variant-${Date.now()}`;
    setRoomVariants(prev => [...prev, {
      variantId: newVariantId,
      name: '',
      description: '',
      pricePerNight: Number(formData.pricing.pricePerNight) || 0,
      capacity: formData.abodeDetails.capacity,
      bedrooms: formData.abodeDetails.bedrooms,
      bathrooms: formData.abodeDetails.bathrooms,
      amenities: [...formData.abodeDetails.amenities],
    }]);
    // Set as default if it's the first variant
    if (roomVariants.length === 0) {
      setDefaultVariantId(newVariantId);
    }
  };

  const updateRoomVariant = (variantId: string, field: string, value: any) => {
    setRoomVariants(prev => prev.map(variant =>
      variant.variantId === variantId ? { ...variant, [field]: value } : variant
    ));
  };

  const removeRoomVariant = (variantId: string) => {
    setRoomVariants(prev => prev.filter(v => v.variantId !== variantId));
    if (defaultVariantId === variantId) {
      const remaining = roomVariants.filter(v => v.variantId !== variantId);
      setDefaultVariantId(remaining.length > 0 ? remaining[0].variantId : null);
    }
  };

  // Linked experiences management
  const toggleExperienceSelection = (experienceId: string) => {
    setSelectedExperienceIds(prev =>
      prev.includes(experienceId)
        ? prev.filter(id => id !== experienceId)
        : [...prev, experienceId]
    );
  };

  // Create abode-specific experience
  const handleCreateExperience = async () => {
    if (!newExperience.title.trim() || !newExperience.description.trim() || !newExperience.price) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCreatingExperience(true);
      setError('');

      const formDataToSend = new FormData();
      formDataToSend.append('title', newExperience.title);
      formDataToSend.append('description', newExperience.description);
      formDataToSend.append('price', newExperience.price);
      formDataToSend.append('currency', newExperience.currency);
      formDataToSend.append('duration', newExperience.duration);
      formDataToSend.append('maxParticipants', newExperience.maxParticipants);
      formDataToSend.append('location', JSON.stringify({
        country: formData.location.country,
        state: formData.location.state,
        district: formData.location.district,
        coordinates: formData.location.coordinates
      }));
      
      // Add default availability (next 90 days)
      const availableDates = [];
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        availableDates.push({
          date: date.toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '17:00',
          available: true
        });
      }
      formDataToSend.append('availableDates', JSON.stringify(availableDates));
      formDataToSend.append('isAddOn', 'true'); // Mark as add-on experience
      
      if (newExperienceImage) {
        formDataToSend.append('image', newExperienceImage);
      }

      const response = await api.post('/hosts/experience', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success || response.data.experience) {
        const createdExperience = response.data.experience || response.data;
        // Add to selected experiences and refresh list
        setSelectedExperienceIds(prev => [...prev, createdExperience._id]);
        await fetchAvailableExperiences();
        
        // Reset form
        setNewExperience({
          title: '',
          description: '',
          price: '',
          currency: 'INR',
          duration: '2',
          maxParticipants: '10',
        });
        setNewExperienceImage(null);
        setNewExperienceImagePreview(null);
        setShowCreateExperienceModal(false);
      }
    } catch (err: any) {
      console.error('Error creating experience:', err);
      setError(err.response?.data?.message || 'Failed to create experience');
    } finally {
      setCreatingExperience(false);
    }
  };

  const handleNewExperienceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewExperienceImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewExperienceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      // Check file size (100MB limit for videos, 10MB for images)
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      
      if (file.size > maxSize) {
        setError(`${isVideo ? 'Video' : 'Image'} must be less than ${maxSize / (1024 * 1024)}MB`);
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

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.abodeDetails.title.trim()) {
        throw new Error('Catchy title is required');
      }
      if (formData.abodeDetails.title.length > 100) {
        throw new Error('Title must be 100 characters or less');
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
      if (imageFiles.length === 0) {
        throw new Error('At least one image is required');
      }
      if (formData.location.coordinates.lat === 0 || formData.location.coordinates.lng === 0) {
        throw new Error('Please set location coordinates');
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
      
      // Add room variants if any
      if (roomVariants.length > 0) {
        formDataToSend.append('roomVariants', JSON.stringify(roomVariants));
        if (defaultVariantId) {
          formDataToSend.append('defaultVariantId', defaultVariantId);
        }
      }
      
      // Add linked experiences if any
      if (selectedExperienceIds.length > 0) {
        formDataToSend.append('linkedExperiences', JSON.stringify(selectedExperienceIds));
      }

      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await api.post('/abodes/register', formDataToSend, {
        timeout: 180000,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/host/abodes');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Error registering abode:', err);
      setError(err.response?.data?.message || err.message || 'Failed to register abode');
    } finally {
      setLoading(false);
    }
  };

  const districts = formData.location.state ? DISTRICTS_BY_STATE[formData.location.state] || [] : [];

  const steps = [
    { number: 1, title: 'Basic Info', icon: '🏠' },
    { number: 2, title: 'Location', icon: '📍' },
    { number: 3, title: 'Pricing', icon: '💰' },
    { number: 4, title: 'Images', icon: '📸' },
    { number: 5, title: 'Details', icon: '✨' },
    { number: 6, title: 'Review', icon: '✓' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-indigo-700 to-slate-800 p-8 md:p-12 shadow-2xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-slate-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Register Your Abode
                </h1>
                <p className="text-white/90 text-lg md:text-xl">
                  Share your home and culture with travelers. Create an authentic experience that connects people.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                          currentStep >= step.number
                            ? 'bg-gradient-to-br from-slate-600 to-indigo-600 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {currentStep > step.number ? '✓' : step.number}
                      </div>
                      <span className={`mt-2 text-sm font-medium ${
                        currentStep >= step.number ? 'text-slate-700' : 'text-slate-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 rounded ${
                        currentStep > step.number ? 'bg-slate-600' : 'bg-slate-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
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
                exit={{ opacity: 0 }}
                className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Abode registered successfully! Redirecting to dashboard...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    🏠
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Basic Information</h2>
                </div>

                <div className="space-y-6">
                  {/* Title */}
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

                  {/* Description */}
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
                      placeholder="Describe your abode, what makes it special, and what guests can expect..."
                      required
                    />
                  </div>

                  {/* Property Details Grid */}
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

                <div className="mt-8 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Next: Location →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    📍
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Location Details</h2>
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
                      onLocationChange={(lat, lng) => {
                        setFormData(prev => ({
                          ...prev,
                          location: {
                            ...prev.location,
                            coordinates: { lat, lng },
                          },
                        }));
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Next: Pricing →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    💰
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Pricing Information</h2>
                </div>

                <div className="space-y-6">
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

                  {/* Room Variants Section */}
                  <div className="mt-8 pt-8 border-t border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Room Types (Optional)</h3>
                        <p className="text-sm text-slate-600">
                          Offer different room types with varying prices and capacities. If you don't add room variants, the base price above will be used.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addRoomVariant}
                        className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Room Type
                      </button>
                    </div>

                    {roomVariants.length > 0 && (
                      <div className="space-y-6">
                        {roomVariants.map((variant, index) => (
                          <motion.div
                            key={variant.variantId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative border-2 rounded-2xl p-6 transition-all ${
                              defaultVariantId === variant.variantId
                                ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-lg'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                            }`}
                          >
                            {/* Default Badge */}
                            {defaultVariantId === variant.variantId && (
                              <div className="absolute -top-3 left-6 px-4 py-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Default Room Type
                              </div>
                            )}

                            {/* Header */}
                            <div className="flex items-start justify-between mb-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                    defaultVariantId === variant.variantId
                                      ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <h4 className="text-lg font-bold text-slate-900">
                                    {variant.name || `Room Type ${index + 1}`}
                                  </h4>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {/* Set as Default Button */}
                                <button
                                  type="button"
                                  onClick={() => setDefaultVariantId(variant.variantId)}
                                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                                    defaultVariantId === variant.variantId
                                      ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                                  }`}
                                >
                                  {defaultVariantId === variant.variantId ? (
                                    <>
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Default
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Set Default
                                    </>
                                  )}
                                </button>
                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => removeRoomVariant(variant.variantId)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  title="Remove room type"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                              {/* Room Name and Price - Side by Side */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Room Name *
                                  </label>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => updateRoomVariant(variant.variantId, 'name', e.target.value)}
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                                    placeholder="e.g., Standard Room, Deluxe Suite"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    Price per Night (₹) *
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-semibold">₹</span>
                                    <input
                                      type="number"
                                      value={variant.pricePerNight}
                                      onChange={(e) => updateRoomVariant(variant.variantId, 'pricePerNight', Number(e.target.value))}
                                      min="0"
                                      step="0.01"
                                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Capacity, Bedrooms, Bathrooms - Three columns */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      Capacity (Guests) *
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.capacity}
                                    onChange={(e) => updateRoomVariant(variant.variantId, 'capacity', Number(e.target.value))}
                                    min="1"
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                      </svg>
                                      Bedrooms *
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.bedrooms}
                                    onChange={(e) => updateRoomVariant(variant.variantId, 'bedrooms', Number(e.target.value))}
                                    min="1"
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                                    <span className="flex items-center gap-1">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                      </svg>
                                      Bathrooms *
                                    </span>
                                  </label>
                                  <input
                                    type="number"
                                    value={variant.bathrooms}
                                    onChange={(e) => updateRoomVariant(variant.variantId, 'bathrooms', Number(e.target.value))}
                                    min="1"
                                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white"
                                    required
                                  />
                                </div>
                              </div>

                              {/* Description */}
                              <div>
                                <label className="block text-sm font-semibold text-slate-900 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={variant.description}
                                  onChange={(e) => updateRoomVariant(variant.variantId, 'description', e.target.value)}
                                  rows={3}
                                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none bg-white"
                                  placeholder="Brief description of this room type (e.g., features, view, size)..."
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {roomVariants.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50">
                        <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <p className="text-slate-600 mb-4">No room types added yet</p>
                        <p className="text-sm text-slate-500">Click "Add Room Type" above to create different room options</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Next: Images →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Images */}
            {currentStep === 4 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    📸
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Upload Media</h2>
                </div>

                <div className="space-y-6">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-slate-400 transition-all">
                    <input
                      type="file"
                      accept="image/*,video/*"
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
                      <p className="text-slate-700 font-semibold mb-2">Click to upload images and videos</p>
                      <p className="text-sm text-slate-600">Images: max 10MB each | Videos: max 100MB each</p>
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => {
                        const file = imageFiles[index];
                        const isVideo = file?.type.startsWith('video/');
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`relative group cursor-move ${
                              draggedIndex === index ? 'opacity-50' : ''
                            }`}
                          >
                            {isVideo ? (
                              <video
                                src={preview}
                                className="w-full h-32 object-cover rounded-xl shadow-md"
                                controls={false}
                              />
                            ) : (
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-xl shadow-md"
                              />
                            )}
                            {isVideo && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full flex items-center gap-1">
                              {isVideo ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                </svg>
                              )}
                              {index + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg hover:bg-red-600 z-10"
                            >
                              ×
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-2 left-2 px-2 py-1 bg-slate-600 text-white text-xs rounded-full font-semibold">
                                Main
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                  {imagePreviews.length > 1 && (
                    <p className="mt-2 text-sm text-slate-600 text-center">
                      💡 Drag images to rearrange. The first image will be your main photo.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Next: Details →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 5: Additional Details */}
            {currentStep === 5 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Amenities */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Amenities</h3>
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
                  <h3 className="text-xl font-bold text-slate-900 mb-4">House Rules</h3>
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
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                        >
                          <span className="text-slate-900">{rule}</span>
                          <button
                            type="button"
                            onClick={() => removeHouseRule(index)}
                            className="text-red-500 hover:text-red-700"
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
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Languages Spoken</h3>
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
                <div className="bg-white rounded-2xl shadow-xl border border-amber-100 p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-amber-900">Availability Calendar</h3>
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

                      {/* Calendar - Supports both range and multiple selection */}
                      <div className="mb-4">
                        <p className="text-sm text-slate-700 text-center mb-4 font-medium">
                          📅 <span className="font-semibold">Click dates to select</span> • Drag to select a range • Click again to deselect
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

                {/* Additional Experiences Section */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl">
                          ✨
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900">Additional Experiences (Optional)</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Your abode stay includes accommodation, meals, and cultural immersion. Link existing experiences or create new ones specific to this abode.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCreateExperienceModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all text-sm font-semibold flex items-center gap-2 whitespace-nowrap"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New
                      </button>
                    </div>
                  </div>

                  {loadingExperiences ? (
                    <div className="text-center py-8">
                      <div className="inline-block w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-slate-600">Loading your experiences...</p>
                    </div>
                  ) : availableExperiences.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl">
                      <p className="text-slate-600 mb-4">You don't have any experiences yet.</p>
                      <button
                        type="button"
                        onClick={() => router.push('/host/experiences')}
                        className="px-6 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all"
                      >
                        Create Experience
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 mb-4 bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <span className="font-semibold text-indigo-900">Note:</span> Your abode already includes accommodation, meals, and cultural immersion. Select additional experiences below that guests can optionally add to their booking.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2 custom-scrollbar">
                        {availableExperiences.map((experience) => {
                          const isSelected = selectedExperienceIds.includes(experience._id);
                          return (
                            <motion.div
                              key={experience._id}
                              onClick={() => toggleExperienceSelection(experience._id)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg ring-2 ring-indigo-200'
                                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex items-start gap-3">
                                {experience.imageUrl && (
                                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                    <img
                                      src={experience.imageUrl}
                                      alt={experience.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-slate-900 mb-1 line-clamp-1">{experience.title}</h4>
                                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{experience.description}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-indigo-600">
                                      ₹{experience.price.toLocaleString()}
                                    </span>
                                    {experience.currency !== 'INR' && (
                                      <span className="text-xs text-slate-500">{experience.currency}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                      {selectedExperienceIds.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm font-semibold text-indigo-900">
                              {selectedExperienceIds.length} additional experience{selectedExperienceIds.length !== 1 ? 's' : ''} selected
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg"
                  >
                    Review & Submit →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    ✓
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Review & Submit</h2>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-xl">
                    <h3 className="font-bold text-slate-900 mb-2">Title</h3>
                    <p className="text-slate-700">{formData.abodeDetails.title || 'Not set'}</p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-xl">
                    <h3 className="font-bold text-slate-900 mb-2">Location</h3>
                    <p className="text-slate-700">
                      {formData.location.district}, {formData.location.state}, {formData.location.country}
                    </p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-xl">
                    <h3 className="font-bold text-slate-900 mb-2">Pricing</h3>
                    <p className="text-slate-700">₹{formData.pricing.pricePerNight} per night</p>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-xl">
                    <h3 className="font-bold text-slate-900 mb-2">Images</h3>
                    <p className="text-slate-700">{imageFiles.length} image(s) uploaded</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-slate-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-slate-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register Abode'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>

          {/* Create Experience Modal */}
          {showCreateExperienceModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-900">Create Experience for this Abode</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateExperienceModal(false);
                        setError('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 mt-2">
                    Create an experience that will be linked specifically to this abode listing.
                  </p>
                </div>

                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Experience Title *
                    </label>
                    <input
                      type="text"
                      value={newExperience.title}
                      onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Traditional Cooking Class"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newExperience.description}
                      onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                      placeholder="Describe the experience..."
                      required
                    />
                  </div>

                  {/* Price and Currency */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        value={newExperience.price}
                        onChange={(e) => setNewExperience({ ...newExperience, price: e.target.value })}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Currency
                      </label>
                      <select
                        value={newExperience.currency}
                        onChange={(e) => setNewExperience({ ...newExperience, currency: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration and Max Participants */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        value={newExperience.duration}
                        onChange={(e) => setNewExperience({ ...newExperience, duration: e.target.value })}
                        min="1"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">
                        Max Participants
                      </label>
                      <input
                        type="number"
                        value={newExperience.maxParticipants}
                        onChange={(e) => setNewExperience({ ...newExperience, maxParticipants: e.target.value })}
                        min="1"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Experience Image
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleNewExperienceImageChange}
                        className="hidden"
                        id="new-experience-image"
                      />
                      <label
                        htmlFor="new-experience-image"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        {newExperienceImagePreview ? (
                          <img
                            src={newExperienceImagePreview}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <svg className="w-12 h-12 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                        <span className="text-sm text-slate-600">Click to upload image</span>
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateExperienceModal(false);
                      setError('');
                    }}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateExperience}
                    disabled={creatingExperience}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creatingExperience ? 'Creating...' : 'Create Experience'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
