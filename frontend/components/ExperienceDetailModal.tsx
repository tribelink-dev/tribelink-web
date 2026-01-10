'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getImageUrl } from '@/lib/imageUtils';

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  createdAt: string;
}

interface Experience {
  _id: string;
  title: string;
  description: string;
  category?: string;
  subcategory?: string;
  price: number;
  imageUrl?: string;
  contentUrl?: string;
  averageRating: number;
  reviewCount: number;
  provider: {
    name: string;
    rating: number;
  };
  recentReviews?: Review[];
  location?: { state: string; district: string };
  culturalMetadata?: {
    heritage?: string;
    traditions?: string[];
    culturalSignificance?: string;
    authenticityScore?: number;
    experienceType?: string;
    regionalTags?: string[];
  };
  tags?: string[];
  aiFiltered?: boolean;
  matchScore?: number;
  aiReasons?: string[];
  availabilityStatus?: {
    available: boolean;
    reason: string | null;
  };
  duration?: number;
  maxParticipants?: number;
  availableDates?: string[];
}

interface ExperienceDetailModalProps {
  experience: Experience | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToBucketlist?: (experienceId: string) => void;
  isInBucketlist?: boolean;
}

export default function ExperienceDetailModal({
  experience,
  isOpen,
  onClose,
  onAddToBucketlist,
  isInBucketlist = false
}: ExperienceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'location'>('overview');
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  // Hooks must be called unconditionally - always call them
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['2.5deg', '-2.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-2.5deg', '2.5deg']);

  // Get image data - handle null experience safely
  const imageUrl = experience ? getImageUrl(experience.imageUrl ?? undefined) : null;
  const images = imageUrl ? [imageUrl] : [];
  if (experience?.contentUrl) {
    images.push(experience.contentUrl);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isImageZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Don't render if no experience
  if (!experience) return null;

  return (
    <AnimatePresence>
      {isOpen && experience && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header with Close Button */}
              <div className="sticky top-0 bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-20 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {experience.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200">
                      {experience.category}
                    </span>
                  )}
                  {experience.aiFiltered && experience.matchScore && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                      {Math.round(experience.matchScore * 100)}% Match
                    </span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-all group"
                >
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Left Side - Image Gallery */}
                  <div className="relative bg-gray-100 min-h-[400px] md:min-h-[600px]">
                    {images.length > 0 ? (
                      <motion.div
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => setIsImageZoomed(!isImageZoomed)}
                        className="relative w-full h-full cursor-zoom-in"
                        style={{
                          rotateX: isImageZoomed ? rotateX : 0,
                          rotateY: isImageZoomed ? rotateY : 0,
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={imageIndex}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                          >
                            {images[imageIndex]?.endsWith('.mp4') || images[imageIndex]?.includes('video') ? (
                              <video
                                className="w-full h-full object-cover"
                                controls
                                autoPlay
                                loop
                              >
                                <source src={images[imageIndex]} />
                              </video>
                            ) : (
                              <img
                                src={images[imageIndex]}
                                alt={experience.title}
                                className={`w-full h-full object-cover ${isImageZoomed ? 'scale-150' : ''} transition-transform duration-300`}
                              />
                            )}
                          </motion.div>
                        </AnimatePresence>

                        {/* Image Navigation */}
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex((prev) => (prev - 1 + images.length) % images.length);
                              }}
                              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all group"
                            >
                              <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageIndex((prev) => (prev + 1) % images.length);
                              }}
                              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all group"
                            >
                              <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </>
                        )}

                        {/* Image Indicators */}
                        {images.length > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageIndex(idx);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === imageIndex ? 'bg-white w-6' : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Zoom Indicator */}
                        {isImageZoomed && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-lg"
                          >
                            Click to zoom out
                          </motion.div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <span className="text-8xl">🎬</span>
                      </div>
                    )}
                  </div>

                  {/* Right Side - Details */}
                  <div className="p-6 md:p-8 flex flex-col">
                    {/* Title and Price */}
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                        {experience.title}
                      </h2>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {experience.averageRating > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < Math.floor(experience.averageRating)
                                        ? 'text-yellow-400'
                                        : i < experience.averageRating
                                        ? 'text-yellow-300'
                                        : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-gray-700">
                                {experience.averageRating.toFixed(1)}
                              </span>
                              {experience.reviewCount > 0 && (
                                <span className="text-sm text-gray-500">
                                  ({experience.reviewCount} review{experience.reviewCount !== 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{experience.provider.name}</span>
                            <span className="text-gray-400">•</span>
                            <span>{experience.provider.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary-600">
                            ${experience.price}
                          </p>
                          <p className="text-sm text-gray-500">per person</p>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6 border-b border-gray-200">
                      <div className="flex gap-1">
                        {(['overview', 'reviews', 'location'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`
                              px-4 py-2 text-sm font-semibold relative
                              transition-colors duration-200
                              ${activeTab === tab
                                ? 'text-primary-600'
                                : 'text-gray-600 hover:text-gray-900'
                              }
                            `}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {activeTab === tab && (
                              <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto">
                      <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                          <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                          >
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-3">About this experience</h3>
                              <p className="text-gray-700 leading-relaxed">{experience.description}</p>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              {experience.duration && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">⏱️</span>
                                    <span className="text-sm font-semibold text-gray-700">Duration</span>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">{experience.duration} hours</p>
                                </div>
                              )}
                              {experience.maxParticipants && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xl">👥</span>
                                    <span className="text-sm font-semibold text-gray-700">Group Size</span>
                                  </div>
                                  <p className="text-lg font-bold text-gray-900">Up to {experience.maxParticipants}</p>
                                </div>
                              )}
                            </div>

                            {/* Cultural Metadata */}
                            {experience.culturalMetadata && (
                              <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <span>🏛️</span>
                                  Cultural Heritage
                                </h4>
                                {experience.culturalMetadata.heritage && (
                                  <p className="text-gray-700 mb-2">
                                    <span className="font-semibold">Heritage:</span> {experience.culturalMetadata.heritage}
                                  </p>
                                )}
                                {experience.culturalMetadata.traditions && experience.culturalMetadata.traditions.length > 0 && (
                                  <div className="mb-2">
                                    <span className="font-semibold text-gray-700">Traditions:</span>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {experience.culturalMetadata.traditions.map((trad, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-white/60 rounded-lg text-sm font-medium text-gray-700 border border-amber-200">
                                          {trad}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {experience.culturalMetadata.authenticityScore && experience.culturalMetadata.authenticityScore >= 8 && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <span className="text-2xl">✨</span>
                                    <span className="text-sm font-semibold text-amber-700">
                                      Authenticity Score: {experience.culturalMetadata.authenticityScore}/10
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* AI Reasons */}
                            {experience.aiFiltered && experience.aiReasons && experience.aiReasons.length > 0 && (
                              <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                                <h4 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  Why this matches you
                                </h4>
                                <ul className="space-y-2">
                                  {experience.aiReasons.map((reason, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-indigo-800">
                                      <span className="text-indigo-500 mt-1">•</span>
                                      <span>{reason}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Tags */}
                            {experience.tags && experience.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {experience.tags.map((tag, idx) => (
                                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'reviews' && (
                          <motion.div
                            key="reviews"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            {experience.recentReviews && experience.recentReviews.length > 0 ? (
                              experience.recentReviews.map((review) => (
                                <div key={review._id} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold text-gray-900">{review.user.name}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <svg
                                            key={i}
                                            className={`w-4 h-4 ${
                                              i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                          </svg>
                                        ))}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-gray-500">No reviews yet</p>
                                <p className="text-sm text-gray-400 mt-2">Be the first to review this experience!</p>
                              </div>
                            )}
                          </motion.div>
                        )}

                        {activeTab === 'location' && (
                          <motion.div
                            key="location"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                          >
                            {experience.location ? (
                              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                                <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                  <span>📍</span>
                                  Location
                                </h4>
                                <p className="text-lg font-semibold text-gray-900">
                                  {experience.location.district}, {experience.location.state}
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-gray-500">Location information not available</p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                      {onAddToBucketlist && (
                        <button
                          onClick={() => {
                            onAddToBucketlist(experience._id);
                            onClose();
                          }}
                          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                            isInBucketlist
                              ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl'
                              : 'bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          {isInBucketlist ? 'Remove from Bucketlist' : 'Add to Bucketlist'}
                        </button>
                      )}
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

