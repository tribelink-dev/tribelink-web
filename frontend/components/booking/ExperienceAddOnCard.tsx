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
        className={`relative bg-surface rounded-xl shadow-sm border transition-all overflow-hidden flex flex-col sm:flex-row sm:items-center min-w-0 w-full ${
          isAdded
            ? 'border-brand/40 bg-brand/5 shadow-md ring-1 ring-brand/20'
            : 'border-border hover:border-brand/30 hover:shadow-md'
        }`}
      >
        {imageSrc ? (
          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="relative w-full sm:w-20 sm:h-20 aspect-[16/9] sm:aspect-auto flex-shrink-0 overflow-hidden sm:rounded-l-xl cursor-pointer group/image"
          >
            <motion.img
              src={imageSrc}
              alt={experience.title}
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/image:opacity-100 transition-opacity" />
            </div>
            {experience.isAddOn && experience.addOnPricing?.discount && (
              <div className="absolute top-2 left-2 sm:top-1 sm:left-1 bg-success text-white px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm">
                {experience.addOnPricing.discount}%
              </div>
            )}
          </button>
        ) : (
          <div className="relative w-full sm:w-20 sm:h-20 aspect-[16/9] sm:aspect-auto flex-shrink-0 bg-surface-muted flex items-center justify-center sm:rounded-l-xl">
            <Sparkles className="w-5 h-5 text-text-secondary" />
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-1 sm:items-center gap-3 px-4 py-3 sm:py-2.5 min-w-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-text-primary line-clamp-2 sm:truncate">
                {experience.title}
              </h3>
              {isAdded && (
                <CheckCircle2 className="w-4 h-4 text-brand flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-text-secondary">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {experience.duration}h
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Up to {experience.maxParticipants}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border shrink-0">
            <div className="flex items-center gap-2">
              {experience.isAddOn && experience.addOnPricing?.discount && (
                <span className="text-xs text-text-secondary line-through">
                  {formatPrice(experience.price, experience.currency)}
                </span>
              )}
              <span className="text-base font-bold text-brand whitespace-nowrap">
                {formatPrice(displayPrice, experience.currency || experience.addOnPricing?.currency || 'USD')}
              </span>
            </div>

            {!isAdded ? (
              <motion.button
                type="button"
                onClick={handleAdd}
                whileTap={{ scale: 0.95 }}
                className="touch-target px-4 py-2 bg-brand text-white font-medium rounded-lg shadow-sm flex items-center gap-1.5 text-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </motion.button>
            ) : (
              <motion.button
                type="button"
                onClick={onRemove}
                whileTap={{ scale: 0.95 }}
                className="touch-target px-4 py-2 bg-destructive text-white font-medium rounded-lg shadow-sm flex items-center gap-1.5 text-sm flex-shrink-0"
              >
                <X className="w-4 h-4" />
                <span>Remove</span>
              </motion.button>
            )}
          </div>
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
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 safe-area-top safe-area-bottom"
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
                className="absolute top-4 right-4 touch-target bg-white/90 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
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

