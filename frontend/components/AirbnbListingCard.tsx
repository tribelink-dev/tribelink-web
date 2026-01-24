'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';

interface AirbnbListingCardProps {
  id: string;
  imageUrl: string | null;
  location: string;
  title: string;
  subtitle?: string;
  rating: number;
  ratingCount: number;
  price: number;
  priceLabel?: string;
  onClick?: () => void;
  index?: number;
}

export default function AirbnbListingCard({
  id,
  imageUrl,
  location,
  title,
  subtitle,
  rating,
  ratingCount,
  price,
  priceLabel = 'night',
  onClick,
  index = 0
}: AirbnbListingCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const { formatPrice } = useCurrency();

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group cursor-pointer"
    >
      {/* Image */}
      <div 
        className="relative w-full aspect-square rounded-xl overflow-hidden mb-3"
        onClick={handleClick}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-6xl">🏠</span>
          </div>
        )}
        
        {/* Heart Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm hover:shadow-md z-10"
        >
          <svg 
            className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-700'}`}
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div onClick={handleClick}>
        {/* Location & Rating */}
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-900 truncate flex-1">
            {location}
          </div>
          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
            <svg className="w-3 h-3 fill-black text-black" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">
              {rating.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-sm text-gray-500 mb-1 line-clamp-1">
          {title}
        </div>

        {/* Subtitle */}
        {subtitle && (
          <div className="text-sm text-gray-500 mb-2 line-clamp-1">
            {subtitle}
          </div>
        )}

        {/* Price */}
        <div className="text-sm">
          <span className="font-semibold text-gray-900">{formatPrice(price, 'USD')}</span>
          <span className="text-gray-600"> {priceLabel}</span>
        </div>
      </div>
    </motion.div>
  );
}

