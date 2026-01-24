'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { motion } from 'framer-motion';

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
  
  const [formData, setFormData] = useState({
    abodeDetails: {
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

  useEffect(() => {
    // Check if user is logged in as LOCAL_HOST
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
          setError('You must be registered as a LOCAL_HOST provider. Please update your provider type first.');
        }
      } catch (e) {
        router.push('/host/login');
      }
    }
  }, [router]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
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

      imageFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      const response = await api.post('/abodes/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/host/dashboard');
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

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-16">
      <div className="section-container-luxury max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-display-md font-serif text-charcoal-700 mb-4">
            Register Your Abode
          </h1>
          <p className="text-lg text-charcoal-600">
            Share your home and culture with travelers. Create an authentic experience that connects people.
          </p>
        </motion.div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            Abode registered successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Basic Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.abodeDetails.description}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    abodeDetails: { ...prev.abodeDetails, description: e.target.value },
                  }))}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  placeholder="Describe your abode, what makes it special, and what guests can expect..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.abodeDetails.propertyType}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      abodeDetails: { ...prev.abodeDetails, propertyType: e.target.value },
                    }))}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  >
                    {PROPERTY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Capacity (Guests) *
                  </label>
                  <input
                    type="number"
                    value={formData.abodeDetails.capacity}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      abodeDetails: { ...prev.abodeDetails, capacity: Number(e.target.value) },
                    }))}
                    min="1"
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Location</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.location.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, state: e.target.value, district: '' },
                    }))}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    District *
                  </label>
                  <select
                    value={formData.location.district}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, district: e.target.value },
                    }))}
                    disabled={!formData.location.state || districts.length === 0}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold disabled:bg-charcoal-50"
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
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value },
                  }))}
                  className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  placeholder="Street address (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lat}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: { ...prev.location.coordinates, lat: Number(e.target.value) },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.location.coordinates.lng}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: {
                        ...prev.location,
                        coordinates: { ...prev.location.coordinates, lng: Number(e.target.value) },
                      },
                    }))}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Pricing</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
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
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Images */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Images *</h2>
            
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
              />
              
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Amenities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Amenities</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                  placeholder="e.g., WiFi, Kitchen, Air Conditioning"
                  className="flex-1 px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                />
                <button
                  type="button"
                  onClick={addAmenity}
                  className="px-6 py-2.5 bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold-dark transition-all"
                >
                  Add
                </button>
              </div>
              
              {formData.abodeDetails.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.abodeDetails.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cream-500 text-charcoal-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* House Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">House Rules</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHouseRule}
                  onChange={(e) => setNewHouseRule(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHouseRule())}
                  placeholder="e.g., No smoking, Respect local customs"
                  className="flex-1 px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                />
                <button
                  type="button"
                  onClick={addHouseRule}
                  className="px-6 py-2.5 bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold-dark transition-all"
                >
                  Add
                </button>
              </div>
              
              {formData.abodeDetails.houseRules.length > 0 && (
                <ul className="space-y-2">
                  {formData.abodeDetails.houseRules.map((rule, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-cream-50 rounded-lg"
                    >
                      <span className="text-charcoal-700">{rule}</span>
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
          </motion.div>

          {/* Cultural Practices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Cultural Practices</h2>
            
            <div className="space-y-4">
              {formData.culturalPractices.map((practice, index) => (
                <div key={index} className="p-4 border border-charcoal-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-charcoal-700">Practice {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeCulturalPractice(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={practice.practice}
                    onChange={(e) => updateCulturalPractice(index, 'practice', e.target.value)}
                    placeholder="Practice name (e.g., Traditional Cooking)"
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                  <select
                    value={practice.category}
                    onChange={(e) => updateCulturalPractice(index, 'category', e.target.value)}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  >
                    {CULTURAL_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <textarea
                    value={practice.description}
                    onChange={(e) => updateCulturalPractice(index, 'description', e.target.value)}
                    placeholder="Description of the practice..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCulturalPractice}
                className="px-6 py-2.5 border border-heritage-gold text-heritage-gold rounded-lg hover:bg-heritage-gold hover:text-white transition-all"
              >
                + Add Cultural Practice
              </button>
            </div>
          </motion.div>

          {/* Nearby Places */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Nearby Cultural & Historical Places</h2>
            
            <div className="space-y-4">
              {formData.nearbyPlaces.map((place, index) => (
                <div key={index} className="p-4 border border-charcoal-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-charcoal-700">Place {index + 1}</h3>
                    <button
                      type="button"
                      onClick={() => removeNearbyPlace(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={place.name}
                    onChange={(e) => updateNearbyPlace(index, 'name', e.target.value)}
                    placeholder="Place name"
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                  <select
                    value={place.significance}
                    onChange={(e) => updateNearbyPlace(index, 'significance', e.target.value)}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  >
                    {SIGNIFICANCE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={place.distance}
                      onChange={(e) => updateNearbyPlace(index, 'distance', Number(e.target.value))}
                      placeholder="Distance (km)"
                      min="0"
                      step="0.1"
                      className="px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    />
                    <input
                      type="text"
                      value={place.description}
                      onChange={(e) => updateNearbyPlace(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                    />
                  </div>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addNearbyPlace}
                className="px-6 py-2.5 border border-heritage-gold text-heritage-gold rounded-lg hover:bg-heritage-gold hover:text-white transition-all"
              >
                + Add Nearby Place
              </button>
            </div>
          </motion.div>

          {/* Languages */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Languages Spoken</h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                  placeholder="e.g., English, Hindi, Malayalam"
                  className="flex-1 px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                />
                <button
                  type="button"
                  onClick={addLanguage}
                  className="px-6 py-2.5 bg-heritage-gold text-white rounded-lg hover:bg-heritage-gold-dark transition-all"
                >
                  Add
                </button>
              </div>
              
              {formData.languages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.languages.map((lang, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-cream-500 text-charcoal-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {lang}
                      <button
                        type="button"
                        onClick={() => removeLanguage(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Family Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Family Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Family Size
                  </label>
                  <input
                    type="number"
                    value={formData.familyInfo.familySize}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      familyInfo: { ...prev.familyInfo, familySize: e.target.value },
                    }))}
                    min="1"
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Generations
                  </label>
                  <input
                    type="number"
                    value={formData.familyInfo.generations}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      familyInfo: { ...prev.familyInfo, generations: e.target.value },
                    }))}
                    min="1"
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal-700 mb-2">
                  Family Background/Story
                </label>
                <textarea
                  value={formData.familyInfo.background}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    familyInfo: { ...prev.familyInfo, background: e.target.value },
                  }))}
                  rows={5}
                  className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  placeholder="Share your family's story, traditions, and background..."
                />
              </div>
            </div>
          </motion.div>

          {/* Availability */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="bg-white rounded-2xl shadow-luxury p-6"
          >
            <h2 className="text-2xl font-semibold text-charcoal-700 mb-6">Availability</h2>
            
            <div className="space-y-4">
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={(dates) => handleDateSelect(dates as Date[])}
                disabled={(date) => date < new Date()}
                className="rounded-lg border border-charcoal-200 p-4"
              />
              <p className="text-sm text-charcoal-500">
                Select dates when your abode is available for guests. You can update this later.
              </p>
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="flex justify-end gap-4"
          >
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 border border-charcoal-200 text-charcoal-700 rounded-lg hover:bg-charcoal-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-heritage-gold text-white font-semibold rounded-lg hover:bg-heritage-gold-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Abode'}
            </button>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

