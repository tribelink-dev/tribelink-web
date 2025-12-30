'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { INDIAN_STATES, DISTRICTS_BY_STATE } from '@/lib/indianStates';
import LocationPicker from '@/components/LocationPicker';

const AMENITIES_OPTIONS = [
  'WiFi', 'Pool', 'Gym', 'Breakfast', 'Parking', 'Air Conditioning', 
  'Room Service', 'Restaurant', 'Bar', 'Spa', 'Laundry', 'Elevator'
];

export default function AddHotelPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    country: 'India',
    state: '',
    district: '',
    address: '',
    lat: '',
    lng: '',
    totalRooms: '',
    roomsAvailable: '',
    pricePerNight: '',
    amenities: [] as string[],
    contactPhone: '',
    contactEmail: '',
    checkIn: '14:00',
    checkOut: '11:00',
    cancellationPolicy: ''
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableDistricts = formData.state ? (DISTRICTS_BY_STATE[formData.state] || []) : [];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!host || !token) {
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
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setImageFiles(prev => [...prev, ...files]);
  };

  const handleRemoveImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    if (!formData.name || !formData.country || !formData.state || !formData.district || 
        !formData.totalRooms || !formData.pricePerNight) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }

    if (imageFiles.length === 0) {
      setError('Please upload at least one hotel image');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('district', formData.district);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.lat && formData.lng) {
        formDataToSend.append('lat', formData.lat);
        formDataToSend.append('lng', formData.lng);
      }
      formDataToSend.append('totalRooms', formData.totalRooms);
      formDataToSend.append('roomsAvailable', formData.roomsAvailable || formData.totalRooms);
      formDataToSend.append('pricePerNight', formData.pricePerNight);
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));
      if (formData.contactPhone) formDataToSend.append('contactPhone', formData.contactPhone);
      if (formData.contactEmail) formDataToSend.append('contactEmail', formData.contactEmail);
      formDataToSend.append('checkIn', formData.checkIn);
      formDataToSend.append('checkOut', formData.checkOut);
      if (formData.cancellationPolicy) formDataToSend.append('cancellationPolicy', formData.cancellationPolicy);

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      await api.post('/hotels', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/host/hotels');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create hotel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="section-container max-w-4xl">
        <div className="content-card">
          <div className="mb-8">
            <h1 className="heading-secondary text-gray-900 mb-2">
              Add New Hotel
            </h1>
            <p className="text-gray-600">
              Create a new hotel listing for travelers
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
              <span className="flex-1">Hotel created successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hotel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter hotel name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe your hotel..."
                  className="input-field"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Location</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value, district: '' })}
                    required
                    className="input-field"
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    required
                    disabled={!formData.state}
                    className="input-field"
                  >
                    <option value="">Select District</option>
                    {availableDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, building number, etc."
                  className="input-field"
                />
              </div>

              {/* Location Picker Map */}
              {formData.district && (
                <div className="mt-4">
                  <LocationPicker
                    district={formData.district}
                    state={formData.state}
                    initialLat={formData.lat ? parseFloat(formData.lat) : undefined}
                    initialLng={formData.lng ? parseFloat(formData.lng) : undefined}
                    onLocationChange={(lat, lng) => {
                      setFormData({
                        ...formData,
                        lat: lat.toString(),
                        lng: lng.toString()
                      });
                    }}
                    required={true}
                  />
                </div>
              )}
            </div>

            {/* Pricing & Capacity */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Pricing & Capacity</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Rooms <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalRooms}
                    onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
                    required
                    min="1"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rooms Available <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.roomsAvailable}
                    onChange={(e) => setFormData({ ...formData, roomsAvailable: e.target.value })}
                    required
                    min="0"
                    max={formData.totalRooms || 999}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price Per Night ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                    required
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AMENITIES_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Hotel Images</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Images <span className="text-red-500">*</span> (Max 10, first image will be main)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Each image max 5MB. Supported: JPEG, PNG, GIF, WebP</p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+1234567890"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    placeholder="hotel@example.com"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="space-y-4">
              <h3 className="heading-tertiary">Policies</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-in Time
                  </label>
                  <input
                    type="time"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Check-out Time
                  </label>
                  <input
                    type="time"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cancellation Policy
                </label>
                <textarea
                  value={formData.cancellationPolicy}
                  onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                  rows={3}
                  placeholder="E.g., Free cancellation up to 24 hours before check-in..."
                  className="input-field"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => router.push('/host/hotels')}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="spinner w-4 h-4"></span>
                    Creating...
                  </span>
                ) : (
                  'Create Hotel'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

