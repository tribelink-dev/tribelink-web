'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/imageUtils';

interface Hotel {
  _id: string;
  name: string;
  description?: string;
  amenities?: string[];
  pricePerNight: number;
  rating: number;
  ratingCount?: number;
  roomsAvailable: number;
  images?: Array<{ url: string; isMain?: boolean } | string>;
  location?: {
    district: string;
    state: string;
    address?: string;
  };
  policies?: {
    checkIn?: string;
    checkOut?: string;
  };
}

interface HotelBookingCardProps {
  hotel: Hotel;
  isSelected: boolean;
  onSelect: () => void;
  date: string;
}

export default function HotelBookingCard({ hotel, isSelected, onSelect, date }: HotelBookingCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Get main image - use centralized utility
  const getMainImage = () => {
    if (!hotel.images || hotel.images.length === 0) {
      return null;
    }
    
    // Find main image or use first image
    const mainImageObj = hotel.images.find((img: any) => {
      if (typeof img === 'object' && img !== null) {
        return img.isMain === true;
      }
      return false;
    }) || hotel.images[0];
    
    if (!mainImageObj) {
      return null;
    }
    
    // Use centralized utility which handles both object and string formats
    return getImageUrl(mainImageObj);
  };

  const imageUrl = getMainImage();

  return (
    <>
      <div
        className={`relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-primary-500 shadow-xl scale-[1.02]'
            : 'border-gray-200 hover:border-primary-300 shadow-soft hover:shadow-medium'
        }`}
        onClick={onSelect}
      >
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-4 right-4 z-10 bg-primary-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-large">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Hotel Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hotel.name}
              className="w-full h-full object-cover"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                console.error(`Failed to load hotel image for ${hotel.name}:`, imageUrl);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-ocean-50 via-blue-50 to-ocean-50 flex items-center justify-center">
                      <span class="text-6xl">🏨</span>
                    </div>
                  `;
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean-50 via-blue-50 to-ocean-50">
              <span className="text-6xl">🏨</span>
            </div>
          )}
          {/* Rating Badge */}
          {hotel.rating > 0 && (
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-medium">
              <span className="text-yellow-500 text-sm">⭐</span>
              <span className="font-bold text-gray-900 text-sm">{hotel.rating.toFixed(1)}</span>
              {hotel.ratingCount && hotel.ratingCount > 0 && (
                <span className="text-xs text-gray-600">({hotel.ratingCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Hotel Info */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="font-bold text-gray-900 text-lg flex-1 line-clamp-2">{hotel.name}</h3>
            <div className="flex-shrink-0 text-right">
              <p className="text-2xl font-bold text-primary-600">${hotel.pricePerNight}</p>
              <p className="text-xs text-gray-500">per night</p>
            </div>
          </div>

          {/* Location */}
          {hotel.location && (
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-3">
              <span className="text-primary-600">📍</span>
              <span className="line-clamp-1">{hotel.location.district}, {hotel.location.state}</span>
            </div>
          )}

          {/* Description */}
          {hotel.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hotel.description}</p>
          )}

          {/* Amenities */}
          {hotel.amenities && hotel.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-md font-medium border border-primary-200"
                >
                  {amenity}
                </span>
              ))}
              {hotel.amenities.length > 4 && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md font-medium">
                  +{hotel.amenities.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Availability & Policies */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              {hotel.roomsAvailable > 0 ? (
                <span className="text-green-600 font-semibold">✓ {hotel.roomsAvailable} rooms available</span>
              ) : (
                <span className="text-red-600 font-semibold">✗ No rooms available</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold flex items-center gap-1"
            >
              View Details
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
              {imageUrl ? (
                <img src={imageUrl} alt={hotel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-8xl">🏨</span>
                </div>
              )}
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-large hover:bg-white transition-colors"
              >
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{hotel.name}</h2>
                  {hotel.location && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <span>📍</span>
                      {hotel.location.address || `${hotel.location.district}, ${hotel.location.state}`}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary-600">${hotel.pricePerNight}</p>
                  <p className="text-sm text-gray-500">per night</p>
                </div>
              </div>

              {hotel.description && (
                <p className="text-gray-700 mb-6 leading-relaxed">{hotel.description}</p>
              )}

              {hotel.amenities && hotel.amenities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {hotel.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                        <span className="text-primary-600">✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hotel.policies && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold text-gray-900 mb-3">Policies</h3>
                  <div className="space-y-2 text-sm">
                    {hotel.policies.checkIn && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-semibold text-gray-900">{hotel.policies.checkIn}</span>
                      </div>
                    )}
                    {hotel.policies.checkOut && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-semibold text-gray-900">{hotel.policies.checkOut}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDetails(false)}
                  className="btn-secondary flex-1"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onSelect();
                    setShowDetails(false);
                  }}
                  className={`btn-primary flex-1 ${isSelected ? 'opacity-50' : ''}`}
                  disabled={isSelected}
                >
                  {isSelected ? 'Selected' : 'Select This Hotel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

