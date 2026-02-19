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
    title?: string;
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
  const [isFullscreenGallery, setIsFullscreenGallery] = useState(false);
  const [dragX, setDragX] = useState(0);

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
      setDragX(0); // Reset drag position
    }
  }, [isOpen, fullAbode?.images]);

  // Reset drag position when image changes
  useEffect(() => {
    setDragX(0);
  }, [selectedImageIndex]);

  // Keyboard navigation for fullscreen gallery
  useEffect(() => {
    if (!isFullscreenGallery || !fullAbode?.images) return;

    const images = fullAbode.images || [];
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        setSelectedImageIndex((prev) => (prev + 1) % images.length);
      } else if (e.key === 'Escape') {
        setIsFullscreenGallery(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreenGallery, fullAbode?.images]);

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


  // Swipe handlers for image navigation
  const handleSwipe = (direction: 'left' | 'right') => {
    const images = fullAbode?.images || [];
    if (images.length <= 1) return;
    
    if (direction === 'left') {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    } else {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50; // Minimum distance for swipe
    const velocityThreshold = 500; // Minimum velocity for swipe
    
    if (Math.abs(info.offset.x) > swipeThreshold || Math.abs(info.velocity.x) > velocityThreshold) {
      if (info.offset.x > 0 || info.velocity.x > 0) {
        // Swiped right - go to previous image
        handleSwipe('right');
      } else {
        // Swiped left - go to next image
        handleSwipe('left');
      }
    }
    setDragX(0);
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

          {/* Fullscreen Image Gallery */}
          <AnimatePresence>
            {isFullscreenGallery && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsFullscreenGallery(false)}
                  className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[102]"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="fixed inset-0 z-[103] flex items-center justify-center p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-full max-w-7xl">
                    {/* Close Button */}
                    <button
                      onClick={() => setIsFullscreenGallery(false)}
                      className="absolute top-6 right-6 z-30 w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/50"
                    >
                      <X className="w-7 h-7 text-gray-800" />
                    </button>

                    {/* Fullscreen Image with Swipe Support */}
                    {imageUrl && (
                      <motion.div
                        className="w-full h-full relative"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.3}
                        onDrag={(event, info) => setDragX(info.offset.x)}
                        onDragEnd={handleDragEnd}
                        whileDrag={{ cursor: 'grabbing' }}
                      >
                        <motion.img
                          key={selectedImageIndex}
                          src={imageUrl}
                          alt={`${hostName}'s ${propertyType} - Image ${selectedImageIndex + 1}`}
                          className="w-full h-full object-contain rounded-2xl cursor-grab active:cursor-grabbing select-none touch-none"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ 
                            opacity: 1, 
                            scale: 1, 
                            x: dragX * 0.3 // Subtle parallax effect during drag
                          }}
                          transition={{ 
                            duration: 0.4,
                            x: { type: "spring", stiffness: 300, damping: 30 }
                          }}
                          drag={false}
                        />
                        {/* Swipe indicator in fullscreen */}
                        {Math.abs(dragX) > 20 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                          >
                            <div className={`flex items-center gap-3 px-8 py-4 rounded-full bg-black/70 backdrop-blur-md text-white text-lg ${
                              dragX > 0 ? 'flex-row-reverse' : ''
                            }`}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={dragX > 0 ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                              </svg>
                              <span className="font-semibold">
                                {dragX > 0 ? 'Previous' : 'Next'}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Navigation in Fullscreen */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                          className="absolute left-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/50"
                        >
                          <svg className="w-7 h-7 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelectedImageIndex((prev) => (prev + 1) % images.length)}
                          className="absolute right-6 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/50"
                        >
                          <svg className="w-7 h-7 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full">
                          {images.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedImageIndex(idx)}
                              className={`h-3 rounded-full transition-all ${
                                selectedImageIndex === idx ? 'w-12 bg-white' : 'w-3 bg-white/50 hover:bg-white/70'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md text-white px-6 py-3 rounded-full text-base font-semibold">
                          {selectedImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col relative border border-gray-100">
              {/* Close Button - Top Right */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 z-30 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all hover:scale-110 border border-gray-200"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>

              {/* Image Gallery Section - Enhanced with Better Visibility */}
              <div className="relative h-[55vh] md:h-[65vh] lg:h-[75vh] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden group">
                {imageUrl ? (
                  <motion.div
                    className="w-full h-full relative"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.3}
                    onDrag={(event, info) => setDragX(info.offset.x)}
                    onDragEnd={handleDragEnd}
                    whileDrag={{ cursor: 'grabbing' }}
                  >
                  <motion.img
                    key={selectedImageIndex}
                    src={imageUrl}
                    alt={`${hostName}'s ${propertyType}`}
                      className="w-full h-full object-cover cursor-grab active:cursor-grabbing select-none touch-none"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: dragX * 0.3 // Subtle parallax effect during drag
                      }}
                      transition={{ 
                        duration: 0.6, 
                        ease: "easeOut",
                        x: { type: "spring", stiffness: 300, damping: 30 }
                      }}
                      onClick={(e) => {
                        // Only open fullscreen if drag was minimal
                        if (Math.abs(dragX) < 10) {
                          setIsFullscreenGallery(true);
                        }
                      }}
                      drag={false}
                    />
                    {/* Swipe indicator */}
                    {Math.abs(dragX) > 20 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                      >
                        <div className={`flex items-center gap-2 px-6 py-3 rounded-full bg-black/60 backdrop-blur-md text-white ${
                          dragX > 0 ? 'flex-row-reverse' : ''
                        }`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={dragX > 0 ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                          <span className="text-sm font-semibold">
                            {dragX > 0 ? 'Previous' : 'Next'}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-24 h-24 text-gray-400" />
                  </div>
                )}

                {/* Minimal Gradient Overlay - Only at very bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                
                {/* Hover overlay for click to expand hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto cursor-pointer"
                    onClick={() => setIsFullscreenGallery(true)}
                  >
                    <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      Click to view fullscreen
                    </span>
                  </motion.div>
                </div>

                {/* Image Navigation - Enhanced */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/50 z-20"
                    >
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex((prev) => (prev + 1) % images.length);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/50 z-20"
                    >
                      <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full z-20">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex(idx);
                          }}
                          className={`h-2.5 rounded-full transition-all ${
                            selectedImageIndex === idx ? 'w-10 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Image Counter */}
                    <div className="absolute top-6 right-20 bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold z-20">
                      {selectedImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}

                {/* Top Badges - Enhanced Visibility */}
                <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
                  {fullAbode.isVerified && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 border-2 border-white/30"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-bold">Verified</span>
                    </motion.div>
                  )}
                  {fullAbode.culturalPractices && fullAbode.culturalPractices.length > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gradient-to-r from-purple-500/95 to-indigo-500/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white/30"
                    >
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-semibold">Cultural Experience</span>
                    </motion.div>
                  )}
                </div>

                {/* Rating Badge - Enhanced */}
                {rating > 0 && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="absolute bottom-6 right-6 bg-white/98 backdrop-blur-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border-2 border-white/50 z-20"
                  >
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <div>
                      <span className="text-xl font-bold text-gray-900">{rating.toFixed(1)}</span>
                      {ratingCount > 0 && (
                        <span className="text-sm text-gray-600 ml-1">({ratingCount})</span>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Content Section - Scrollable */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="p-6 md:p-10 lg:p-12">
                  {/* Header Section - Enhanced Typography */}
                  <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 leading-tight">
                      {fullAbode.abodeDetails?.title || `${hostName}'s ${propertyType}`}
                    </h1>
                    {fullAbode.abodeDetails?.title && (
                      <p className="text-lg md:text-xl text-gray-600 mb-4 font-medium">
                        {hostName}'s {propertyType}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-gray-700 mb-6">
                      <MapPin className="w-5 h-5 md:w-6 md:h-6 text-heritage-gold flex-shrink-0" />
                      <span className="text-base md:text-lg font-medium">{location}</span>
                    </div>

                    {/* Property Stats - Enhanced Cards */}
                    <div className="flex flex-wrap items-center gap-4 mb-8">
                      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors">
                        <div className="p-2 bg-heritage-gold/10 rounded-lg">
                          <Users className="w-5 h-5 text-heritage-gold" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-medium">Guests</div>
                          <div className="text-base font-bold text-gray-900">{fullAbode.abodeDetails?.capacity || 0}</div>
                        </div>
                      </div>
                      {fullAbode.abodeDetails?.bedrooms && fullAbode.abodeDetails.bedrooms > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors">
                          <div className="p-2 bg-heritage-gold/10 rounded-lg">
                            <Bed className="w-5 h-5 text-heritage-gold" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Bedrooms</div>
                            <div className="text-base font-bold text-gray-900">{fullAbode.abodeDetails.bedrooms}</div>
                          </div>
                        </div>
                      )}
                      {fullAbode.abodeDetails?.bathrooms && fullAbode.abodeDetails.bathrooms > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors">
                          <div className="p-2 bg-heritage-gold/10 rounded-lg">
                            <Bath className="w-5 h-5 text-heritage-gold" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Bathrooms</div>
                            <div className="text-base font-bold text-gray-900">{fullAbode.abodeDetails.bathrooms}</div>
                          </div>
                        </div>
                      )}
                      {fullAbode.languages && fullAbode.languages.length > 0 && (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors">
                          <div className="p-2 bg-heritage-gold/10 rounded-lg">
                            <Languages className="w-5 h-5 text-heritage-gold" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Languages</div>
                            <div className="text-sm font-bold text-gray-900">{fullAbode.languages.join(', ')}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs - Enhanced */}
                  <div className="flex gap-2 mb-10 border-b-2 border-gray-200 overflow-x-auto">
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
                          className={`flex items-center gap-2 px-6 py-4 font-semibold text-base transition-all relative whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'text-heritage-gold'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {tab.label}
                          {activeTab === tab.id && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-1 bg-heritage-gold rounded-t-full"
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
                          <div className="mb-8">
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">About this abode</h3>
                            <p className="text-gray-700 leading-relaxed text-base md:text-lg whitespace-pre-line max-w-4xl">
                              {fullAbode.abodeDetails.description}
                            </p>
                          </div>
                        )}

                        {fullAbode.familyInfo?.background && (
                          <div className="bg-gradient-to-br from-heritage-gold/10 via-cream-50/50 to-heritage-gold-light/5 rounded-3xl p-6 md:p-8 border-2 border-heritage-gold/20 mb-8 shadow-sm">
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                              <div className="p-2 bg-heritage-gold/20 rounded-xl">
                                <Award className="w-6 h-6 md:w-7 md:h-7 text-heritage-gold" />
                              </div>
                              About the Family
                            </h3>
                            <p className="text-gray-700 leading-relaxed text-base md:text-lg mb-4">
                              {fullAbode.familyInfo.background}
                            </p>
                            {fullAbode.familyInfo.generations && (
                              <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full w-fit">
                                <Sparkles className="w-4 h-4 text-heritage-gold" />
                                <p className="text-sm md:text-base text-gray-700 font-semibold">
                                {fullAbode.familyInfo.generations} generation{fullAbode.familyInfo.generations !== 1 ? 's' : ''} of tradition
                              </p>
                              </div>
                            )}
                          </div>
                        )}

                        {fullAbode.abodeDetails?.houseRules && fullAbode.abodeDetails.houseRules.length > 0 && (
                          <div className="mb-8">
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">House Rules</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {fullAbode.abodeDetails.houseRules.map((rule, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-heritage-gold/50 transition-colors">
                                  <CheckCircle2 className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700 text-base leading-relaxed">{rule}</span>
                                </div>
                              ))}
                            </div>
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
                                className="flex items-center gap-3 p-4 md:p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-heritage-gold hover:bg-heritage-gold/5 transition-all shadow-sm hover:shadow-md"
                              >
                                <div className="p-2 bg-heritage-gold/10 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-heritage-gold flex-shrink-0" />
                                </div>
                                <span className="text-gray-800 font-semibold text-base">{amenity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No amenities listed</p>
                          </div>
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
                                className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100 rounded-2xl p-6 md:p-7 border-2 border-purple-200 hover:border-purple-400 transition-all shadow-sm hover:shadow-lg"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                                    {practice.category}
                                  </span>
                                  <h4 className="font-bold text-gray-900 text-lg">{practice.practice}</h4>
                                </div>
                                {practice.description && (
                                  <p className="text-gray-700 text-base leading-relaxed">{practice.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-16">
                            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">No cultural practices listed</p>
                          </div>
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
                        <div className="mb-8">
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">Location Details</h3>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 border-2 border-gray-200 shadow-sm">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-heritage-gold/10 rounded-xl">
                                <MapPin className="w-6 h-6 md:w-7 md:h-7 text-heritage-gold" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-gray-900 text-lg md:text-xl mb-2">{location}</p>
                                {fullAbode.location?.address && (
                                  <p className="text-gray-700 text-base leading-relaxed">{fullAbode.location.address}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {fullAbode.nearbyPlaces && fullAbode.nearbyPlaces.length > 0 && (
                          <div>
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-5">Nearby Cultural & Historical Places</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {fullAbode.nearbyPlaces.map((place, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-2xl p-6 md:p-7 border-2 border-amber-200 hover:border-amber-400 transition-all shadow-sm hover:shadow-lg"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <h4 className="font-bold text-gray-900 text-lg md:text-xl flex-1 pr-2">{place.name}</h4>
                                    <span className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold rounded-full shadow-md whitespace-nowrap">
                                      {place.significance}
                                    </span>
                                  </div>
                                  {place.description && (
                                    <p className="text-gray-700 mb-3 text-base leading-relaxed">{place.description}</p>
                                  )}
                                  {place.distance > 0 && (
                                    <div className="flex items-center gap-2 text-amber-700">
                                      <MapPin className="w-4 h-4" />
                                      <p className="text-sm font-semibold">
                                      {place.distance} km away
                                    </p>
                                    </div>
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

              {/* Sticky Footer with Price and CTA - Enhanced */}
              <div className="sticky bottom-0 bg-white/98 backdrop-blur-xl border-t-2 border-gray-200 shadow-2xl z-20">
                <div className="px-6 md:px-10 py-5 md:py-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      {price > 0 ? (
                        <>
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-3xl md:text-4xl font-bold text-gray-900">
                              {(() => {
                                const formatted = formatPrice(price, currency);
                                // Remove .00 or .0 from the end if present
                                return formatted.replace(/\.0+$/, '');
                              })()}
                    </span>
                            <span className="text-base md:text-lg text-gray-600 font-medium">/night</span>
                  </div>
                          {(fullAbode.pricing?.weeklyDiscount ?? 0) > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Save {fullAbode.pricing?.weeklyDiscount ?? 0}%
                              </span>
                              <p className="text-sm text-gray-600">
                                for 7+ nights
                    </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-lg md:text-xl text-gray-600 font-medium">
                          Price on request
                        </div>
                  )}
                </div>
                    <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
                      <motion.button
                    onClick={() => setIsFavorite(!isFavorite)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isFavorite
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border-2 border-gray-200'
                    }`}
                  >
                        <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </motion.button>
                  <motion.button
                    onClick={handleBook}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold text-base md:text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2"
                  >
                        <Calendar className="w-5 h-5" />
                        <span>Book Now</span>
                  </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

