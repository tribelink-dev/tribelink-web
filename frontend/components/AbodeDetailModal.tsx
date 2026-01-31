'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Shield, Users, Bed, Bath, Home, Calendar, Heart, Sparkles, CheckCircle2, Clock, Languages, Award } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

interface Abode {
  _id: string;
  images?: Array<{ url: string; isMain?: boolean; caption?: string }>;
  providerId?: {
    _id: string;
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  abodeDetails?: {
    description: string;
    propertyType: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities?: string[];
    houseRules?: string[];
  };
  culturalPractices?: Array<{
    practice: string;
    description?: string;
    category: string;
  }>;
  nearbyPlaces?: Array<{
    name: string;
    description?: string;
    distance: number;
    significance: string;
  }>;
  location?: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  pricing?: {
    pricePerNight: number;
    currency?: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  rating?: number;
  ratingCount?: number;
  isVerified?: boolean;
  languages?: string[];
  familyInfo?: {
    familySize?: number;
    background?: string;
    generations?: number;
  };
}

interface AbodeDetailModalProps {
  abode: Abode | null;
  isOpen: boolean;
  onClose: () => void;
  onBook?: () => void;
}

export default function AbodeDetailModal({
  abode,
  isOpen,
  onClose,
  onBook
}: AbodeDetailModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [fullAbode, setFullAbode] = useState<Abode | null>(abode);
  const [loading, setLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'amenities' | 'cultural' | 'location'>('overview');

  // Fetch full abode details when modal opens
  useEffect(() => {
    if (isOpen && abode?._id && !fullAbode?.abodeDetails?.description) {
      fetchFullAbode();
    } else if (abode) {
      setFullAbode(abode);
    }
  }, [isOpen, abode?._id]);

  // Reset image index when abode changes or modal opens
  useEffect(() => {
    if (isOpen && fullAbode?.images) {
      const images = fullAbode.images || [];
      const mainImageIndex = images.findIndex(img => img.isMain);
      setSelectedImageIndex(mainImageIndex >= 0 ? mainImageIndex : 0);
    }
  }, [isOpen, fullAbode?.images]);

  const fetchFullAbode = async () => {
    if (!abode?._id) return;
    try {
      setLoading(true);
      const response = await api.get(`/abodes/${abode._id}`);
      setFullAbode(response.data.localHost);
    } catch (error) {
      console.error('Error fetching abode details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = () => {
    if (onBook) {
      onBook();
    } else {
      router.push(`/adobes/${fullAbode?._id}`);
    }
    onClose();
  };

  const handleReserve = () => {
    handleBook();
  };

  // Get images and related data (before early return)
  const images = fullAbode?.images || [];
  
  // Reset selectedImageIndex when images change - must be before early return
  useEffect(() => {
    if (images.length > 0 && selectedImageIndex >= images.length) {
      setSelectedImageIndex(0);
    }
  }, [images.length, selectedImageIndex]);

  // Early return after all hooks
  if (!fullAbode) return null;

  // Calculate derived values after early return check
  const mainImage = images.find(img => img.isMain) || images[0];
  const price = fullAbode.pricing?.pricePerNight || 0;
  const currency = fullAbode.pricing?.currency || 'INR';
  const rating = fullAbode.rating || 0;
  const ratingCount = fullAbode.ratingCount || 0;
  const hostName = fullAbode.providerId?.name || 'Host';
  const propertyType = fullAbode.abodeDetails?.propertyType || 'Property';
  const location = fullAbode.location 
    ? `${fullAbode.location.district}, ${fullAbode.location.state}`
    : 'Location not specified';
  
  // Get the currently selected image URL
  const currentImage = images[selectedImageIndex] || images[0];
  const imageUrl = currentImage ? getImageUrl(currentImage.url) : null;

  return (
    <AnimatePresence>
      {isOpen && fullAbode && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[100]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col relative">
              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 border border-gray-200"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              {/* Image Gallery Section */}
              <div className="relative h-80 md:h-96 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {imageUrl ? (
                  <motion.img
                    key={selectedImageIndex}
                    src={imageUrl}
                    alt={`${hostName}'s ${propertyType}`}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                    >
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            selectedImageIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* Top Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
                  {fullAbode.isVerified && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-xl backdrop-blur-sm flex items-center gap-2 border border-white/20"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-bold">Verified</span>
                    </motion.div>
                  )}
                  {fullAbode.culturalPractices && fullAbode.culturalPractices.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-white/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-semibold">Cultural Experience</span>
                    </motion.div>
                  )}
                </div>

                {/* Rating Badge */}
                {rating > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/50 z-20"
                  >
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <div>
                      <span className="text-lg font-bold text-gray-900">{rating.toFixed(1)}</span>
                      {ratingCount > 0 && (
                        <span className="text-sm text-gray-600 ml-1">({ratingCount})</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Content Section - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  {/* Header Section */}
                  <div className="mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
                      {hostName}'s {propertyType}
                    </h1>
                    <div className="flex items-center gap-3 text-gray-600 mb-4">
                      <MapPin className="w-5 h-5 flex-shrink-0" />
                      <span className="text-lg">{location}</span>
                    </div>

                    {/* Property Stats */}
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Users className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold">{fullAbode.abodeDetails?.capacity || 0} guests</span>
                      </div>
                      {fullAbode.abodeDetails?.bedrooms && fullAbode.abodeDetails.bedrooms > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Bed className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold">{fullAbode.abodeDetails.bedrooms} bedroom{fullAbode.abodeDetails.bedrooms !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {fullAbode.abodeDetails?.bathrooms && fullAbode.abodeDetails.bathrooms > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Bath className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold">{fullAbode.abodeDetails.bathrooms} bathroom{fullAbode.abodeDetails.bathrooms !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {fullAbode.languages && fullAbode.languages.length > 0 && (
                        <div className="flex items-center gap-2 text-gray-700">
                          <Languages className="w-5 h-5 text-gray-500" />
                          <span className="font-semibold">{fullAbode.languages.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-2 mb-8 border-b border-gray-200">
                    {[
                      { id: 'overview', label: 'Overview', icon: Home },
                      { id: 'amenities', label: 'Amenities', icon: CheckCircle2 },
                      { id: 'cultural', label: 'Cultural', icon: Sparkles },
                      { id: 'location', label: 'Location', icon: MapPin },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all relative ${
                            activeTab === tab.id
                              ? 'text-heritage-gold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {tab.label}
                          {activeTab === tab.id && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-heritage-gold"
                              transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Content */}
                  <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        {fullAbode.abodeDetails?.description && (
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">About this abode</h3>
                            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                              {fullAbode.abodeDetails.description}
                            </p>
                          </div>
                        )}

                        {fullAbode.familyInfo?.background && (
                          <div className="bg-gradient-to-br from-heritage-gold/5 to-cream-500/10 rounded-2xl p-6 border border-heritage-gold/20">
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                              <Award className="w-6 h-6 text-heritage-gold" />
                              About the Family
                            </h3>
                            <p className="text-gray-700 leading-relaxed">
                              {fullAbode.familyInfo.background}
                            </p>
                            {fullAbode.familyInfo.generations && (
                              <p className="mt-3 text-sm text-gray-600 font-medium">
                                {fullAbode.familyInfo.generations} generation{fullAbode.familyInfo.generations !== 1 ? 's' : ''} of tradition
                              </p>
                            )}
                          </div>
                        )}

                        {fullAbode.abodeDetails?.houseRules && fullAbode.abodeDetails.houseRules.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">House Rules</h3>
                            <ul className="space-y-3">
                              {fullAbode.abodeDetails.houseRules.map((rule, idx) => (
                                <li key={idx} className="flex items-start gap-3 text-gray-700">
                                  <CheckCircle2 className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" />
                                  <span>{rule}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'amenities' && (
                      <motion.div
                        key="amenities"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        {fullAbode.abodeDetails?.amenities && fullAbode.abodeDetails.amenities.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {fullAbode.abodeDetails.amenities.map((amenity, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors"
                              >
                                <CheckCircle2 className="w-5 h-5 text-heritage-gold flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-12">No amenities listed</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'cultural' && (
                      <motion.div
                        key="cultural"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        {fullAbode.culturalPractices && fullAbode.culturalPractices.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fullAbode.culturalPractices.map((practice, idx) => (
                              <div
                                key={idx}
                                className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                                    {practice.category}
                                  </span>
                                  <h4 className="font-bold text-gray-900">{practice.practice}</h4>
                                </div>
                                {practice.description && (
                                  <p className="text-gray-700 text-sm">{practice.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-12">No cultural practices listed</p>
                        )}
                      </motion.div>
                    )}

                    {activeTab === 'location' && (
                      <motion.div
                        key="location"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                      >
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-4">Location Details</h3>
                          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                            <div className="flex items-start gap-3 mb-4">
                              <MapPin className="w-6 h-6 text-heritage-gold mt-1" />
                              <div>
                                <p className="font-semibold text-gray-900 text-lg">{location}</p>
                                {fullAbode.location?.address && (
                                  <p className="text-gray-600 mt-1">{fullAbode.location.address}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {fullAbode.nearbyPlaces && fullAbode.nearbyPlaces.length > 0 && (
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">Nearby Cultural & Historical Places</h3>
                            <div className="space-y-4">
                              {fullAbode.nearbyPlaces.map((place, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-bold text-gray-900 text-lg">{place.name}</h4>
                                    <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                                      {place.significance}
                                    </span>
                                  </div>
                                  {place.description && (
                                    <p className="text-gray-700 mb-2">{place.description}</p>
                                  )}
                                  {place.distance > 0 && (
                                    <p className="text-sm text-gray-600 font-medium">
                                      {place.distance} km away
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sticky Footer with Price and CTA */}
              <div className="sticky bottom-0 bg-gradient-to-r from-white via-gray-50 to-white border-t border-gray-200 px-8 py-6 flex items-center justify-between backdrop-blur-sm z-20">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(price, currency)}
                    </span>
                    <span className="text-lg text-gray-600">/night</span>
                  </div>
                  {fullAbode.pricing?.weeklyDiscount && (
                    <p className="text-sm text-gray-500 mt-1">
                      {fullAbode.pricing.weeklyDiscount}% off for 7+ nights
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isFavorite
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <motion.button
                    onClick={handleReserve}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Reserve Now
                  </motion.button>
                  <motion.button
                    onClick={handleBook}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-gray-900 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all"
                  >
                    Book Now
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

