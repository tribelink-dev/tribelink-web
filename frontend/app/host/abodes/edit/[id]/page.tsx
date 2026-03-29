'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
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
        // Any host can now edit abodes, regardless of provider type
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

  // Fetch available experiences for the host
  const fetchAvailableExperiences = async () => {
    try {
      setLoadingExperiences(true);
      const response = await api.get('/hosts/experiences');
      const experiences = response.data.experiences || [];
      setAvailableExperiences(experiences.filter((exp: any) => !exp.isArchived));
    } catch (err: any) {
      console.error('Error fetching experiences:', err);
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
      
      // Load room variants
      if (abode.roomVariants && abode.roomVariants.length > 0) {
        setRoomVariants(abode.roomVariants);
        setDefaultVariantId(abode.defaultVariantId || abode.roomVariants[0]?.variantId || null);
      }
      
      // Load linked experiences
      if (abode.linkedExperiences && abode.linkedExperiences.length > 0) {
        setSelectedExperienceIds(abode.linkedExperiences.map((exp: any) => 
          typeof exp === 'string' ? exp : exp._id || exp
        ));
      }
      
      // Fetch available experiences
      fetchAvailableExperiences();
      
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
      
      // Add room variants if any
      if (roomVariants.length > 0) {
        formDataToSend.append('roomVariants', JSON.stringify(roomVariants));
        if (defaultVariantId) {
          formDataToSend.append('defaultVariantId', defaultVariantId);
        }
      } else {
        // Clear room variants if none
        formDataToSend.append('roomVariants', JSON.stringify([]));
      }
      
      // Add linked experiences if any
      if (selectedExperienceIds.length > 0) {
        formDataToSend.append('linkedExperiences', JSON.stringify(selectedExperienceIds));
      } else {
        // Clear linked experiences if none
        formDataToSend.append('linkedExperiences', JSON.stringify([]));
      }

      // Send existing images that should be kept (with their IDs)
      if (existingImages.length > 0) {
        formDataToSend.append('existingImages', JSON.stringify(existingImages.map(img => ({
          _id: img._id,
          url: img.url,
          isMain: img.isMain,
          caption: img.caption
        }))));
      }

      // Send new image files
      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await api.put(`/abodes/${params.id}`, formDataToSend, {
        timeout: 600000,
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/host/abodes');
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
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-indigo-600 mb-3"></div>
            <p className="text-sm text-gray-600">Loading abode details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

              {/* Room Variants Section */}
              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Room Types (Optional)</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Offer different room types with varying prices and capacities. If you don't add room variants, the base price above will be used.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRoomVariant}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    <span>+</span> Add Room Type
                  </button>
                </div>

                {roomVariants.length > 0 && (
                  <div className="space-y-4">
                    {roomVariants.map((variant, index) => (
                      <div key={variant.variantId} className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">Room Type {index + 1}</h4>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="radio"
                                name="defaultVariant"
                                checked={defaultVariantId === variant.variantId}
                                onChange={() => setDefaultVariantId(variant.variantId)}
                                className="w-4 h-4"
                              />
                              Default
                            </label>
                            <button
                              type="button"
                              onClick={() => removeRoomVariant(variant.variantId)}
                              className="text-red-600 hover:text-red-700 text-sm font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                              Room Name *
                            </label>
                            <input
                              type="text"
                              value={variant.name}
                              onChange={(e) => updateRoomVariant(variant.variantId, 'name', e.target.value)}
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                              placeholder="e.g., Standard Room, Deluxe Suite"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                              Price per Night (₹) *
                            </label>
                            <input
                              type="number"
                              value={variant.pricePerNight}
                              onChange={(e) => updateRoomVariant(variant.variantId, 'pricePerNight', Number(e.target.value))}
                              min="0"
                              step="0.01"
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                              Capacity (Guests) *
                            </label>
                            <input
                              type="number"
                              value={variant.capacity}
                              onChange={(e) => updateRoomVariant(variant.variantId, 'capacity', Number(e.target.value))}
                              min="1"
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                              Bedrooms *
                            </label>
                            <input
                              type="number"
                              value={variant.bedrooms}
                              onChange={(e) => updateRoomVariant(variant.variantId, 'bedrooms', Number(e.target.value))}
                              min="1"
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-slate-900 mb-2">
                              Bathrooms *
                            </label>
                            <input
                              type="number"
                              value={variant.bathrooms}
                              onChange={(e) => updateRoomVariant(variant.variantId, 'bathrooms', Number(e.target.value))}
                              min="1"
                              className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-slate-900 mb-2">
                            Description
                          </label>
                          <textarea
                            value={variant.description}
                            onChange={(e) => updateRoomVariant(variant.variantId, 'description', e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                            placeholder="Brief description of this room type..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Media</h3>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {imagePreviews.map((preview, index) => {
                        const file = imageFiles[index];
                        const isVideo = file?.type.startsWith('video/');
                        return (
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
                        );
                      })}
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
                onClick={() => router.push('/host/abodes')}
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
                    id="new-experience-image-edit"
                  />
                  <label
                    htmlFor="new-experience-image-edit"
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
  );
}

