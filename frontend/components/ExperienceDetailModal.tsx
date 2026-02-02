'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';

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
  const { formatPrice } = useCurrency();

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
            <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-gray-100">
              {/* Hero Image Section with Overlay Content */}
              <div className="relative h-[45vh] min-h-[400px] max-h-[500px] overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
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
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
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
                            className={`w-full h-full object-cover ${isImageZoomed ? 'scale-150' : ''} transition-transform duration-500`}
                          />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Gradient Overlay - Matching Card Style */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Glassmorphism Header Overlay */}
                    <div className="absolute top-0 left-0 right-0 px-6 py-4 flex items-center justify-between z-30">
                      <div className="flex items-center gap-3">
                        {experience.category && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-white/20"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                            <span className="text-xs font-bold">{experience.category}</span>
                          </motion.span>
                        )}
                        {experience.aiFiltered && experience.matchScore && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-r from-emerald-500/90 to-teal-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-white/20"
                          >
                            <span className="text-xs font-bold">{Math.round(experience.matchScore * 100)}% Match</span>
                          </motion.span>
                        )}
                      </div>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={onClose}
                        className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl hover:shadow-2xl transition-all border border-white/50"
                      >
                        <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>

                    {/* Rating Badge - Bottom Left (matching card style) */}
                    {experience.averageRating > 0 && (
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-white/50 z-10"
                      >
                        <svg className="w-5 h-5 fill-amber-400 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div>
                          <span className="text-lg font-bold text-gray-900">{experience.averageRating.toFixed(1)}</span>
                          {experience.reviewCount > 0 && (
                            <span className="text-sm text-gray-600 ml-1">({experience.reviewCount})</span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Image Navigation */}
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageIndex((prev) => (prev - 1 + images.length) % images.length);
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all group z-30"
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
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all group z-30"
                        >
                          <svg className="w-5 h-5 text-gray-700 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}

                    {/* Image Indicators */}
                    {images.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
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
                        className="absolute top-20 right-4 px-4 py-2 bg-black/70 backdrop-blur-md text-white text-sm font-medium rounded-xl border border-white/20 z-30"
                      >
                        Click to zoom out
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-8xl">🎬</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div className="p-5 lg:p-6">
                  {/* Title and Price Section - Matching Card Style */}
                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <h2 className="font-bold text-2xl lg:text-3xl text-gray-900 mb-4 leading-tight group-hover:text-indigo-600 transition-colors duration-300">
                      {experience.title}
                    </h2>
                    
                    {/* Provider Information - Matching Card Style */}
                    {experience.provider && (
                      <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-indigo-100">
                          <span className="text-sm text-white font-bold">
                            {experience.provider.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {experience.provider.name}
                          </p>
                          {experience.provider.rating > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <svg className="w-3 h-3 text-amber-400 fill-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs text-gray-600 font-medium">
                                {experience.provider.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Details Row - Matching Card Style */}
                    <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                      {experience.location && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium line-clamp-1">{experience.location.district}, {experience.location.state}</span>
                        </div>
                      )}
                      {experience.duration && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium">{experience.duration} hours</span>
                        </div>
                      )}
                      {experience.maxParticipants && (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-sm font-medium">Up to {experience.maxParticipants}</span>
                        </div>
                      )}
                    </div>

                    {/* Price Section - Matching Card Style */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl lg:text-3xl font-bold text-gray-900">
                              {formatPrice(experience.price, 'USD')}
                            </span>
                          </div>
                          <p className="text-xs lg:text-sm text-gray-500 font-medium mt-0.5">per person</p>
                        </div>
                      </div>
                      {experience.subcategory && (
                        <div className="w-fit px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl border border-indigo-200">
                          <span className="text-xs font-bold uppercase tracking-wide">
                            {experience.subcategory}
                          </span>
                        </div>
                      )}
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
                              ? 'text-indigo-600'
                              : 'text-gray-600 hover:text-gray-900'
                            }
                          `}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          {activeTab === tab && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"
                              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-6">
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
                                <motion.div
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-100 shadow-sm hover:shadow-md transition-all"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">⏱️</span>
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Duration</span>
                                  </div>
                                  <p className="text-2xl font-black text-indigo-700">{experience.duration} hours</p>
                                </motion.div>
                              )}
                              {experience.maxParticipants && (
                                <motion.div
                                  whileHover={{ scale: 1.02, y: -2 }}
                                  className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border-2 border-pink-100 shadow-sm hover:shadow-md transition-all"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">👥</span>
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Group Size</span>
                                  </div>
                                  <p className="text-2xl font-black text-pink-700">Up to {experience.maxParticipants}</p>
                                </motion.div>
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
                                <motion.div
                                  key={review._id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-5 bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <p className="font-bold text-gray-900 text-lg">{review.user.name}</p>
                                      <div className="flex items-center gap-1.5 mt-2">
                                        {[...Array(5)].map((_, i) => (
                                          <svg
                                            key={i}
                                            className={`w-5 h-5 ${
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
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                      {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                                </motion.div>
                              ))
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300"
                              >
                                <p className="text-gray-500 text-lg font-semibold">No reviews yet</p>
                                <p className="text-sm text-gray-400 mt-2">Be the first to review this experience!</p>
                              </motion.div>
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
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    {onAddToBucketlist && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onAddToBucketlist(experience._id);
                          onClose();
                        }}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl ${
                          isInBucketlist
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700'
                        }`}
                      >
                        {isInBucketlist ? 'Remove from Bucketlist' : 'Add to Bucketlist'}
                      </motion.button>
                    )}
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

