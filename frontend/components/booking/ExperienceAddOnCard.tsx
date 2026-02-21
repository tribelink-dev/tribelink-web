'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Plus, CheckCircle2, X, Sparkles, ZoomIn } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';

interface Experience {
  _id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  imageUrl?: string;
  maxParticipants: number;
  availableDates?: Array<{
    date: Date | string;
    startTime?: string;
    endTime?: string;
    available: boolean;
  }>;
  isAddOn?: boolean;
  addOnPricing?: {
    price?: number;
    currency?: string;
    discount?: number;
  };
}

interface ExperienceAddOnCardProps {
  experience: Experience;
  isAdded: boolean;
  onAdd: (experience: Experience) => void;
  onRemove: () => void;
}

export default function ExperienceAddOnCard({
  experience,
  isAdded,
  onAdd,
  onRemove
}: ExperienceAddOnCardProps) {
  const { formatPrice } = useCurrency();
  const [showImageModal, setShowImageModal] = useState(false);

  // Calculate price (use add-on pricing if available)
  let displayPrice = experience.price;
  if (experience.isAddOn && experience.addOnPricing?.price) {
    displayPrice = experience.addOnPricing.price;
    if (experience.addOnPricing.discount) {
      displayPrice *= (1 - experience.addOnPricing.discount / 100);
    }
  }

  const handleAdd = () => {
    onAdd(experience);
  };

  const imageSrc = experience.imageUrl ? getImageUrl(experience.imageUrl) : null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ y: -1 }}
        className={`relative bg-white rounded-lg shadow-sm border transition-all overflow-hidden flex flex-row items-center group min-w-0 w-full ${
          isAdded
            ? 'border-heritage-gold/40 bg-gradient-to-r from-heritage-gold/5 to-transparent shadow-md ring-1 ring-heritage-gold/20'
            : 'border-gray-200/60 hover:border-heritage-gold/30 hover:shadow-md'
        }`}
      >
        {/* Small Image Section - Left Side - Clickable */}
        {imageSrc ? (
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-l-lg cursor-pointer group/image"
          >
            <motion.img
              src={imageSrc}
              alt={experience.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
            </div>
            {experience.isAddOn && experience.addOnPricing?.discount && (
              <div className="absolute top-1 left-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-1 py-0.5 rounded text-[10px] font-bold shadow-sm">
                {experience.addOnPricing.discount}%
              </div>
            )}
          </button>
        ) : (
          <div className="relative w-16 h-16 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-l-lg">
            <Sparkles className="w-4 h-4 text-gray-400" />
          </div>
        )}

        {/* Content Section - Compact Horizontal Layout */}
        <div className="flex flex-1 items-center gap-3 px-3 py-2.5 min-w-0">
          {/* Title & Meta Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-heritage-gold transition-colors">
                {experience.title}
              </h3>
              {isAdded && (
                <CheckCircle2 className="w-3.5 h-3.5 text-heritage-gold flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {experience.duration}h
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {experience.maxParticipants}
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {experience.isAddOn && experience.addOnPricing?.discount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(experience.price, experience.currency)}
              </span>
            )}
            <span className="text-base font-bold bg-gradient-to-r from-heritage-gold to-amber-600 bg-clip-text text-transparent whitespace-nowrap">
              {formatPrice(displayPrice, experience.currency || experience.addOnPricing?.currency || 'USD')}
            </span>
          </div>

          {/* Action Button - Compact */}
          {!isAdded ? (
            <motion.button
              type="button"
              onClick={handleAdd}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-gradient-to-r from-heritage-gold to-amber-500 text-white font-medium rounded-md shadow-sm hover:shadow transition-all flex items-center gap-1 text-xs flex-shrink-0"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </motion.button>
          ) : (
            <motion.button
              type="button"
              onClick={onRemove}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md shadow-sm hover:shadow transition-all flex items-center gap-1 text-xs flex-shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Remove</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {showImageModal && imageSrc && (
          <motion.div
            key="image-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-6xl w-full max-h-[90vh]"
            >
              <img
                src={imageSrc}
                alt={experience.title}
                className="w-full h-full object-contain rounded-2xl shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-xl p-3 text-white">
                <h3 className="font-bold text-lg mb-1">{experience.title}</h3>
                <p className="text-sm text-white/90 line-clamp-2">{experience.description}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

