'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Calendar, Users, Home, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/CartContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { getImageUrl } from '@/lib/imageUtils';

interface CartItemProps {
  item: {
    _id?: string;
    type: 'ABODE_STAY' | 'EXPERIENCE';
    abodeStay?: {
      localHostId: {
        _id?: string;
        abodeDetails?: {
          title?: string;
        };
        images?: Array<{ url: string; isMain?: boolean }>;
      };
      variantId?: string | null;
      checkIn: Date | string;
      checkOut: Date | string;
      guests: number;
    };
    experiences?: Array<{
      experienceId: {
        _id?: string;
        title?: string;
        imageUrl?: string;
      };
      date: Date | string;
      startTime: string;
      participants: number;
    }>;
    itemPrice?: number;
  };
  compact?: boolean;
}

export default function CartItem({ item, compact = false }: CartItemProps) {
  const { removeCartItem, removeExperienceFromItem } = useCart();
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  if (item.type === 'ABODE_STAY' && item.abodeStay) {
    const abode = item.abodeStay.localHostId;
    const checkIn = new Date(item.abodeStay.checkIn);
    const checkOut = new Date(item.abodeStay.checkOut);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const mainImage = abode?.images?.find(img => img.isMain) || abode?.images?.[0];

    const handleRemove = async () => {
      if (!item._id) return;
      setIsRemoving(true);
      try {
        await removeCartItem(item._id);
      } catch (error) {
        console.error('Error removing item:', error);
      } finally {
        setIsRemoving(false);
      }
    };

    const handleEdit = () => {
      if (abode?._id) {
        router.push(`/adobes/${abode._id}`);
      }
    };

    const handleRemoveExperience = async (experienceId: string) => {
      if (!item._id) return;
      try {
        await removeExperienceFromItem(item._id, experienceId);
      } catch (error) {
        console.error('Error removing experience:', error);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isRemoving ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden ${
          compact ? 'p-4' : 'p-6'
        }`}
      >
        <div className="flex gap-4">
          {/* Image */}
          {mainImage && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={getImageUrl(mainImage.url)}
                alt={abode?.abodeDetails?.title || 'Abode'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-1 truncate">
                  {abode?.abodeDetails?.title || 'Abode Stay'}
                </h3>
                {item.abodeStay.variantId && (
                  <p className="text-sm text-gray-600 mb-2">Room Variant: {item.abodeStay.variantId}</p>
                )}
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                      {checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{item.abodeStay.guests} guest{item.abodeStay.guests !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!compact && (
                <div className="flex items-start gap-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Linked Experiences */}
            {item.experiences && item.experiences.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-heritage-gold" />
                  <span className="text-sm font-semibold text-gray-900">Added Experiences</span>
                </div>
                <div className="space-y-2">
                  {item.experiences.map((exp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {exp.experienceId?.title || 'Experience'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {new Date(exp.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}{' '}
                          at {exp.startTime} • {exp.participants} participant{exp.participants !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {!compact && (
                        <button
                          onClick={() => handleRemoveExperience(exp.experienceId?._id || '')}
                          className="ml-2 p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Item Total</span>
                <span className="text-lg font-bold text-heritage-gold">
                  {formatPrice(item.itemPrice || 0, item.abodeStay?.localHostId?.pricing?.currency || 'USD')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Experience-only item (standalone)
  return null;
}

