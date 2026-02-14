'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, MapPin, Shield, Users, Bed, Bath, Sparkles } from 'lucide-react';
import { useCurrency } from '@/lib/CurrencyContext';

interface AbodeCardProps {
  abode: {
    _id: string;
    images?: Array<{ url: string; isMain?: boolean }>;
    providerId?: { name: string; profilePicture?: string };
    abodeDetails?: {
      title?: string;
      propertyType: string;
      capacity: number;
      bedrooms: number;
      bathrooms: number;
      amenities?: string[];
    };
    location?: {
      district: string;
      state: string;
      address?: string;
    };
    pricing?: {
      pricePerNight: number;
      currency?: string;
    };
    rating?: number;
    ratingCount?: number;
    isVerified?: boolean;
    culturalPractices?: Array<{ practice: string; category: string }>;
  };
  imageUrl: string | null;
  index?: number;
  onClick?: () => void;
}

export default function AbodeCard({ abode, imageUrl, index = 0, onClick }: AbodeCardProps) {
  const { formatPrice } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const rating = abode.rating || 0;
  const ratingCount = abode.ratingCount || 0;
  const price = abode.pricing?.pricePerNight || 0;
  const propertyType = abode.abodeDetails?.propertyType || 'Property';
  const capacity = abode.abodeDetails?.capacity || 0;
  const bedrooms = abode.abodeDetails?.bedrooms || 0;
  const bathrooms = abode.abodeDetails?.bathrooms || 0;
  const location = abode.location 
    ? `${abode.location.district}, ${abode.location.state}`
    : 'Location not specified';
  const hostName = abode.providerId?.name || 'Host';
  
  // Use custom title if available, otherwise fall back to default format
  const displayTitle = abode.abodeDetails?.title 
    ? abode.abodeDetails.title 
    : `${hostName}'s ${propertyType}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className="group cursor-pointer relative"
    >
      {/* Main Card Container */}
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-heritage-gold/40 transform hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {imageUrl ? (
            <>
              <motion.img
                src={imageUrl}
                alt={`${hostName}'s ${propertyType}`}
                className="w-full h-full object-cover"
                animate={{
                  scale: isHovered ? 1.1 : 1,
                }}
                transition={{
                  duration: 0.7,
                  ease: [0.4, 0, 0.2, 1]
                }}
              />
              {/* Gradient Overlay - Appears on Hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
              />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-heritage-gold/20 via-cream-500/30 to-heritage-gold-light/20 flex items-center justify-center">
              <motion.div
                animate={{ rotate: isHovered ? 360 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="text-7xl opacity-50">🏠</span>
              </motion.div>
            </div>
          )}

          {/* Top Right Corner - Favorite & Verified Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            {/* Verified Badge */}
            {abode.isVerified && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 border border-white/20"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">Verified</span>
              </motion.div>
            )}
            
            {/* Favorite Button */}
            <motion.button
              onClick={handleFavoriteClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all border border-white/50"
            >
              <motion.div
                animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isFavorite
                      ? 'fill-red-500 text-red-500'
                      : 'text-gray-700'
                  }`}
                />
              </motion.div>
            </motion.button>
          </div>

          {/* Bottom Left - Rating Badge */}
          {rating > 0 && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.3 }}
              className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-white/50 z-10"
            >
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-bold text-gray-900">
                  {rating.toFixed(1)}
                </span>
              </div>
              {ratingCount > 0 && (
                <span className="text-xs text-gray-600 font-medium">
                  ({ratingCount})
                </span>
              )}
            </motion.div>
          )}

          {/* Cultural Practices Indicator */}
          {abode.culturalPractices && abode.culturalPractices.length > 0 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 z-10"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Cultural</span>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Title & Location */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-heritage-gold transition-colors duration-300">
              {displayTitle}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium line-clamp-1">{location}</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
            {/* Capacity */}
            <div className="flex items-center gap-1.5 text-gray-700">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold">{capacity}</span>
            </div>
            
            {/* Bedrooms */}
            {bedrooms > 0 && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Bed className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold">{bedrooms}</span>
              </div>
            )}
            
            {/* Bathrooms */}
            {bathrooms > 0 && (
              <div className="flex items-center gap-1.5 text-gray-700">
                <Bath className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold">{bathrooms}</span>
              </div>
            )}
          </div>

          {/* Property Type Badge - Moved above price for better positioning */}
          <div className="mb-3">
            <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-heritage-gold/10 to-cream-500/20 text-heritage-gold-dark rounded-xl border border-heritage-gold/20">
              <span className="text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                {propertyType}
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(price, abode.pricing?.currency || 'INR')}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium mt-0.5">per night</p>
          </div>
        </div>

        {/* Hover Effect - Shine Overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: isHovered ? '100%' : '-100%' }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
        </motion.div>
      </div>
    </motion.div>
  );
}

