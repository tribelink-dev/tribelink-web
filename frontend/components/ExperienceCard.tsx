'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Star, MapPin, Sparkles, Clock, Users, Award, Calendar } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';

interface ExperienceCardProps {
  experience: {
    _id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    price: number;
    currency?: string;
    averageRating?: number;
    reviewCount?: number;
    category?: string;
    subcategory?: string;
    provider?: {
      name: string;
      profilePicture?: string;
      rating?: number;
    };
    location?: {
      district: string;
      state: string;
    };
    duration?: number;
    maxParticipants?: number;
    culturalMetadata?: {
      heritage?: string;
      traditions?: string[];
      authenticityScore?: number;
    };
    tags?: string[];
  };
  index?: number;
  onClick?: () => void;
  onAddToBucketlist?: (experienceId: string) => void;
  isInBucketlist?: boolean;
}

export default function ExperienceCard({
  experience,
  index = 0,
  onClick,
  onAddToBucketlist,
  isInBucketlist = false
}: ExperienceCardProps) {
  const { formatPrice } = useCurrency();
  const [isFavorite, setIsFavorite] = useState(isInBucketlist);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (onAddToBucketlist) {
      onAddToBucketlist(experience._id);
    }
  };

  const imageUrl = experience.imageUrl ? getImageUrl(experience.imageUrl) : null;
  const rating = experience.averageRating || 0;
  const ratingCount = experience.reviewCount || 0;
  const price = experience.price || 0;
  const currency = experience.currency || 'USD';
  const category = experience.category || '';
  
  // Handle provider name - check multiple possible structures
  let providerName = 'Provider';
  if (experience.provider) {
    if (typeof experience.provider === 'string') {
      providerName = experience.provider;
    } else if (experience.provider.name) {
      providerName = experience.provider.name;
    } else {
      // Provider exists but no name
      providerName = 'Experience Host';
    }
  }
  
  const location = experience.location 
    ? `${experience.location.district}, ${experience.location.state}`
    : 'Location not specified';

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
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-indigo-300 transform hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative h-80 overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
          {imageUrl ? (
            <>
              <motion.img
                src={imageUrl}
                alt={experience.title}
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
            <div className="w-full h-full flex items-center justify-center">
              <motion.div
                animate={{ rotate: isHovered ? 360 : 0 }}
                transition={{ duration: 0.6 }}
              >
                <Sparkles className="w-24 h-24 text-indigo-400 opacity-50" />
              </motion.div>
            </div>
          )}

          {/* Top Right Corner - Favorite & Category Badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            {/* Category Badge */}
            {category && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 + 0.2 }}
                className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-white/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{category}</span>
              </motion.div>
            )}
            
            {/* Favorite Button */}
            <motion.button
              onClick={handleFavoriteClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-11 h-11 rounded-full backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all border ${
                isFavorite || isInBucketlist
                  ? 'bg-red-500 text-white border-red-400'
                  : 'bg-white/95 text-gray-700 hover:bg-white border-white/50'
              }`}
            >
              <motion.div
                animate={{ scale: isFavorite ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite || isInBucketlist ? 'fill-current' : ''}`}
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
              className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/50 z-10"
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

          {/* Authenticity Score Badge */}
          {experience.culturalMetadata?.authenticityScore && experience.culturalMetadata.authenticityScore > 0.8 && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-4 right-4 bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-white/20 z-10"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Authentic</span>
            </motion.div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5 lg:p-6">
          {/* Title */}
          <div className="mb-3">
            <h3 className="font-bold text-lg lg:text-xl text-gray-900 mb-2 line-clamp-2 min-h-[3rem] group-hover:text-indigo-600 transition-colors duration-300">
              {experience.title}
            </h3>
            {experience.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {experience.description}
              </p>
            )}
          </div>

          {/* Provider Information */}
          {(experience.provider || providerName !== 'Provider') && (
            <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-gray-100">
              {experience.provider && typeof experience.provider === 'object' && experience.provider.profilePicture ? (
                <img
                  src={getImageUrl(experience.provider.profilePicture) || ''}
                  alt={providerName}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-100">
                  <span className="text-sm text-white font-bold">
                    {providerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {providerName}
                </p>
                {experience.provider && typeof experience.provider === 'object' && experience.provider.rating && experience.provider.rating > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-gray-600 font-medium">
                      {experience.provider.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Row */}
          <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-gray-100">
            {/* Location */}
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium line-clamp-1">{location}</span>
            </div>
            
            {/* Duration */}
            {experience.duration && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {experience.duration % 1 === 0 
                    ? `${experience.duration} hr${experience.duration !== 1 ? 's' : ''}`
                    : `${experience.duration} hrs`
                  }
                </span>
              </div>
            )}
            
            {/* Max Participants */}
            {experience.maxParticipants && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">Up to {experience.maxParticipants}</span>
              </div>
            )}
          </div>

          {/* Price Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {formatPrice(price, currency)}
                  </span>
                </div>
                <p className="text-xs lg:text-sm text-gray-500 font-medium mt-0.5">per person</p>
              </div>
            </div>
            
            {/* Subcategory Badge - Moved below price */}
            {experience.subcategory && (
              <div className="w-fit px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl border border-indigo-200">
                <span className="text-xs font-bold uppercase tracking-wide">
                  {experience.subcategory}
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          {experience.tags && experience.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {experience.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
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

