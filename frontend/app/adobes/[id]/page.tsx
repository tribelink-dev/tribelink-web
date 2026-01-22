'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { getImageUrl } from '@/lib/imageUtils';
import { motion } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

interface LocalHost {
  _id: string;
  adobeDetails: {
    description: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    houseRules: string[];
    propertyType: string;
  };
  culturalPractices: Array<{
    practice: string;
    description?: string;
    category: string;
  }>;
  nearbyPlaces: Array<{
    name: string;
    description?: string;
    distance: number;
    significance: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  pricing: {
    pricePerNight: number;
    currency: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  languages: string[];
  familyInfo?: {
    familySize?: number;
    background?: string;
    generations?: number;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    nearbyLandmarks?: string[];
  };
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  providerId: {
    _id: string;
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  availability: Array<{
    date: string;
    available: boolean;
    bookedSlots: number;
  }>;
}

export default function AdobeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [adobe, setAdobe] = useState<LocalHost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [booking, setBooking] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAdobe();
    }
  }, [params.id]);

  const fetchAdobe = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/adobes/${params.id}`);
      setAdobe(response.data.localHost);
    } catch (err: any) {
      console.error('Error fetching adobe:', err);
      setError(err.response?.data?.message || 'Failed to load adobe details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      const currentPath = `/adobes/${params.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (checkOut <= checkIn) {
      alert('Check-out date must be after check-in date');
      return;
    }

    if (guests > (adobe?.adobeDetails.capacity || 1)) {
      alert(`Maximum capacity is ${adobe?.adobeDetails.capacity} guests`);
      return;
    }

    try {
      setBooking(true);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const basePrice = (adobe?.pricing.pricePerNight || 0) * nights;
      let discount = 0;
      
      if (nights >= 30 && adobe?.pricing.monthlyDiscount) {
        discount = basePrice * (adobe.pricing.monthlyDiscount / 100);
      } else if (nights >= 7 && adobe?.pricing.weeklyDiscount) {
        discount = basePrice * (adobe.pricing.weeklyDiscount / 100);
      }
      
      const totalPrice = basePrice - discount;

      const bookingData = {
        bookingType: 'ADOBE_STAY',
        adobeStay: {
          localHost: adobe?._id,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          guests,
        },
        totalPrice,
        status: 'PENDING',
      };

      const response = await api.post('/bookings', bookingData);
      
      if (response.data.success) {
        router.push(`/bookings/${response.data.booking._id}`);
      }
    } catch (err: any) {
      console.error('Error creating booking:', err);
      alert(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white pt-24 pb-16">
        <div className="section-container-luxury">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-charcoal-200 rounded-2xl"></div>
            <div className="h-64 bg-charcoal-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !adobe) {
    return (
      <div className="min-h-screen bg-off-white pt-24 pb-16">
        <div className="section-container-luxury">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-semibold text-charcoal-700 mb-2">
              {error || 'Adobe not found'}
            </h3>
            <button
              onClick={() => router.push('/adobes')}
              className="mt-6 px-6 py-3 bg-heritage-gold text-white font-medium rounded-lg hover:bg-heritage-gold-dark transition-all"
            >
              Browse Adobes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = adobe.images[selectedImageIndex] || adobe.images[0];
  const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const basePrice = adobe.pricing.pricePerNight * nights;
  let discount = 0;
  if (nights >= 30 && adobe.pricing.monthlyDiscount) {
    discount = basePrice * (adobe.pricing.monthlyDiscount / 100);
  } else if (nights >= 7 && adobe.pricing.weeklyDiscount) {
    discount = basePrice * (adobe.pricing.weeklyDiscount / 100);
  }
  const totalPrice = basePrice - discount;

  return (
    <div className="min-h-screen bg-off-white pt-24 pb-16">
      <div className="section-container-luxury">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-charcoal-600 hover:text-charcoal-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-luxury overflow-hidden"
            >
              <div className="relative w-full h-96 bg-gradient-to-br from-charcoal-200 to-charcoal-300">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={adobe.adobeDetails.description}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl">🏠</span>
                  </div>
                )}
              </div>
              
              {adobe.images.length > 1 && (
                <div className="p-4 grid grid-cols-5 gap-2">
                  {adobe.images.slice(0, 5).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-heritage-gold'
                          : 'border-transparent hover:border-charcoal-200'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url) || ''}
                        alt={img.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title & Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-luxury p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-display-md font-serif text-charcoal-700 mb-2">
                    {adobe.providerId.name}'s Adobe
                  </h1>
                  <div className="flex items-center gap-2 text-charcoal-600 mb-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{adobe.location.district}, {adobe.location.state}, {adobe.location.country}</span>
                    {adobe.isVerified && (
                      <span className="px-2 py-1 bg-heritage-gold text-white text-xs font-semibold rounded">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-6 h-6 text-heritage-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xl font-semibold text-charcoal-700">
                    {adobe.rating.toFixed(1)}
                  </span>
                  <span className="text-charcoal-500">
                    ({adobe.ratingCount})
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="flex flex-wrap gap-4 text-sm text-charcoal-600 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {adobe.adobeDetails.capacity} guests
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {adobe.adobeDetails.bedrooms} bedroom{adobe.adobeDetails.bedrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {adobe.adobeDetails.bathrooms} bathroom{adobe.adobeDetails.bathrooms !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-cream-500 text-charcoal-700 text-xs font-semibold rounded-full">
                    {adobe.adobeDetails.propertyType}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-luxury p-6"
            >
              <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">About this adobe</h2>
              <p className="text-charcoal-600 leading-relaxed whitespace-pre-line">
                {adobe.adobeDetails.description}
              </p>
            </motion.div>

            {/* Cultural Practices */}
            {adobe.culturalPractices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">
                  Cultural Practices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adobe.culturalPractices.map((practice, index) => (
                    <div key={index} className="p-4 bg-cream-50 rounded-lg border border-cream-300">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-heritage-gold text-white text-xs font-semibold rounded">
                          {practice.category}
                        </span>
                        <h3 className="font-semibold text-charcoal-700">{practice.practice}</h3>
                      </div>
                      {practice.description && (
                        <p className="text-sm text-charcoal-600">{practice.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Nearby Places */}
            {adobe.nearbyPlaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">
                  Nearby Cultural & Historical Places
                </h2>
                <div className="space-y-4">
                  {adobe.nearbyPlaces.map((place, index) => (
                    <div key={index} className="p-4 bg-cream-50 rounded-lg border border-cream-300">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-charcoal-700">{place.name}</h3>
                        <span className="px-2 py-1 bg-heritage-gold-light text-charcoal-700 text-xs font-semibold rounded">
                          {place.significance}
                        </span>
                      </div>
                      {place.description && (
                        <p className="text-sm text-charcoal-600 mb-2">{place.description}</p>
                      )}
                      {place.distance > 0 && (
                        <p className="text-xs text-charcoal-500">
                          {place.distance} km away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Amenities */}
            {adobe.adobeDetails.amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {adobe.adobeDetails.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-charcoal-600">
                      <svg className="w-5 h-5 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {amenity}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* House Rules */}
            {adobe.adobeDetails.houseRules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {adobe.adobeDetails.houseRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-charcoal-600">
                      <svg className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {rule}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Family Info */}
            {adobe.familyInfo?.background && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">About the Family</h2>
                <p className="text-charcoal-600 leading-relaxed whitespace-pre-line">
                  {adobe.familyInfo.background}
                </p>
                {adobe.familyInfo.generations && (
                  <p className="mt-4 text-sm text-charcoal-500">
                    {adobe.familyInfo.generations} generation{adobe.familyInfo.generations !== 1 ? 's' : ''} of tradition
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="sticky top-24 bg-white rounded-2xl shadow-luxury p-6 border border-charcoal-100"
            >
              <div className="mb-6">
                <div className="text-3xl font-bold text-charcoal-700 mb-1">
                  ₹{adobe.pricing.pricePerNight}
                  <span className="text-lg font-normal text-charcoal-500">/night</span>
                </div>
                {adobe.pricing.weeklyDiscount && (
                  <p className="text-sm text-charcoal-500">
                    {adobe.pricing.weeklyDiscount}% off for 7+ nights
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Check-in
                  </label>
                  <DayPicker
                    mode="single"
                    selected={checkIn}
                    onSelect={setCheckIn}
                    disabled={(date) => date < new Date()}
                    className="rounded-lg border border-charcoal-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Check-out
                  </label>
                  <DayPicker
                    mode="single"
                    selected={checkOut}
                    onSelect={setCheckOut}
                    disabled={(date) => !checkIn || date <= checkIn}
                    className="rounded-lg border border-charcoal-200 p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal-700 mb-2">
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-charcoal-200 rounded-lg focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold"
                  >
                    {[...Array(adobe.adobeDetails.capacity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} guest{i !== 0 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="mb-6 p-4 bg-cream-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm text-charcoal-600">
                    <span>₹{adobe.pricing.pricePerNight} × {nights} nights</span>
                    <span>₹{basePrice}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-charcoal-200 pt-2 flex justify-between font-semibold text-charcoal-700">
                    <span>Total</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Book Button */}
              <button
                onClick={handleBooking}
                disabled={!checkIn || !checkOut || booking}
                className="w-full px-6 py-4 bg-heritage-gold text-white font-semibold rounded-lg hover:bg-heritage-gold-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {booking ? 'Booking...' : 'Reserve Now'}
              </button>

              {!user && (
                <p className="mt-4 text-sm text-center text-charcoal-500">
                  <button
                    onClick={() => router.push('/login?redirect=/adobes/' + params.id)}
                    className="text-heritage-gold hover:underline"
                  >
                    Sign in
                  </button>
                  {' '}to book
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}


