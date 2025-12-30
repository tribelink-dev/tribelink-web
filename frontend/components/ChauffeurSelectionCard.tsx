'use client';

import { useState } from 'react';

interface Driver {
  _id: string;
  driverProfileId: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  rating: number;
  ratingCount?: number;
  vehicleType: string;
  vehicleDetails?: {
    make?: string;
    model?: string;
    year?: number;
    capacity?: number;
  };
  pricing: {
    perDay: number;
    currency: string;
  };
  yearsOfExperience?: number;
  languages?: string[];
  isVerified?: boolean;
}

interface ChauffeurSelectionCardProps {
  driver: Driver;
  isSelected: boolean;
  onSelect: () => void;
  date: string;
}

export default function ChauffeurSelectionCard({ driver, isSelected, onSelect, date }: ChauffeurSelectionCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getVehicleIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      'Sedan': '🚗',
      'SUV': '🚙',
      'Luxury': '✨',
      'Van': '🚐',
      'Mini Bus': '🚌',
      'Bus': '🚍'
    };
    return icons[type] || '🚗';
  };

  return (
    <>
      <div
        className={`relative bg-white rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? 'border-primary-500 shadow-xl scale-[1.02] bg-gradient-to-br from-primary-50 to-white'
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

        {/* Verified Badge */}
        {driver.isVerified && (
          <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold">Verified</span>
          </div>
        )}

        {/* Driver Header */}
        <div className="p-5">
          <div className="flex items-start gap-4 mb-4">
            {/* Driver Avatar */}
            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-medium">
              {driver.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{driver.name}</h3>
                {driver.rating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-2.5 py-1 rounded-lg border border-yellow-200 flex-shrink-0">
                    <span className="text-yellow-500 text-sm">⭐</span>
                    <span className="font-bold text-gray-900 text-sm">{driver.rating.toFixed(1)}</span>
                    {driver.ratingCount && driver.ratingCount > 0 && (
                      <span className="text-xs text-gray-600">({driver.ratingCount})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Vehicle Type */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getVehicleIcon(driver.vehicleType)}</span>
                <span className="text-sm font-semibold text-gray-700">{driver.vehicleType}</span>
                {driver.vehicleDetails && (
                  <>
                    {driver.vehicleDetails.make && driver.vehicleDetails.model && (
                      <span className="text-xs text-gray-500">
                        {driver.vehicleDetails.make} {driver.vehicleDetails.model}
                      </span>
                    )}
                    {driver.vehicleDetails.capacity && (
                      <span className="text-xs text-gray-500">
                        • Up to {driver.vehicleDetails.capacity} passengers
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Experience */}
              {driver.yearsOfExperience && driver.yearsOfExperience > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                  <span>📅</span>
                  <span>{driver.yearsOfExperience} {driver.yearsOfExperience === 1 ? 'year' : 'years'} experience</span>
                </div>
              )}

              {/* Languages */}
              {driver.languages && driver.languages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {driver.languages.slice(0, 3).map((lang, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium border border-blue-200"
                    >
                      {lang}
                    </span>
                  ))}
                  {driver.languages.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                      +{driver.languages.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div>
              <p className="text-2xl font-bold text-primary-600">${driver.pricing.perDay}</p>
              <p className="text-xs text-gray-500">per day</p>
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
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white text-4xl font-bold shadow-medium">
                    {driver.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{driver.name}</h2>
                    {driver.isVerified && (
                      <div className="flex items-center gap-2 text-green-600 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold">Verified Driver</span>
                      </div>
                    )}
                    {driver.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span className="font-bold text-gray-900">{driver.rating.toFixed(1)}</span>
                        {driver.ratingCount && driver.ratingCount > 0 && (
                          <span className="text-sm text-gray-600">({driver.ratingCount} reviews)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="bg-gray-100 hover:bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Vehicle Information */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">{getVehicleIcon(driver.vehicleType)}</span>
                  Vehicle Information
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900 ml-2">{driver.vehicleType}</span>
                  </div>
                  {driver.vehicleDetails?.make && driver.vehicleDetails?.model && (
                    <div>
                      <span className="text-gray-600">Model:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {driver.vehicleDetails.make} {driver.vehicleDetails.model}
                      </span>
                    </div>
                  )}
                  {driver.vehicleDetails?.year && (
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <span className="font-semibold text-gray-900 ml-2">{driver.vehicleDetails.year}</span>
                    </div>
                  )}
                  {driver.vehicleDetails?.capacity && (
                    <div>
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        Up to {driver.vehicleDetails.capacity} passengers
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience & Languages */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {driver.yearsOfExperience && driver.yearsOfExperience > 0 && (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">Experience</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {driver.yearsOfExperience} {driver.yearsOfExperience === 1 ? 'Year' : 'Years'}
                    </p>
                  </div>
                )}
                {driver.languages && driver.languages.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {driver.languages.map((lang, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-900 border border-green-200">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(driver.phoneNumber || driver.email) && (
                <div className="mb-6 p-4 bg-primary-50 rounded-xl">
                  <h4 className="font-bold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    {driver.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600">📞</span>
                        <span className="text-gray-700">{driver.phoneNumber}</span>
                      </div>
                    )}
                    {driver.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-primary-600">✉️</span>
                        <span className="text-gray-700">{driver.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="mb-6 p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border-2 border-primary-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Daily Rate</h4>
                    <p className="text-sm text-gray-600">For {date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-600">${driver.pricing.perDay}</p>
                    <p className="text-sm text-gray-600">{driver.pricing.currency} per day</p>
                  </div>
                </div>
              </div>

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
                  {isSelected ? 'Selected' : 'Select This Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

