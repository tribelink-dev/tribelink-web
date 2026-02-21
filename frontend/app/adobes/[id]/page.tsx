'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/CartContext';
import { getImageUrl } from '@/lib/imageUtils';
import { useCurrency } from '@/lib/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { Calendar, Users, ChevronLeft, ChevronRight, Star, MapPin, Shield, Home, Bed, Bath, CheckCircle2, Sparkles, Award, Languages, ShoppingCart } from 'lucide-react';
import RoomVariantSelector from '@/components/booking/RoomVariantSelector';
import ExperienceAddOnCard from '@/components/booking/ExperienceAddOnCard';
import CartSidebar from '@/components/cart/CartSidebar';
import 'react-day-picker/dist/style.css';

interface LocalHost {
  _id: string;
  abodeDetails: {
    title?: string;
    description: string;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    houseRules: string[];
    propertyType: string;
  };
  culturalPractices: Array<{
    practice: string;
    description?: string;
    category: string;
  }>;
  nearbyPlaces: Array<{
    name: string;
    description?: string;
    distance: number;
    significance: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;
  pricing: {
    pricePerNight: number;
    currency: string;
    weeklyDiscount?: number;
    monthlyDiscount?: number;
  };
  images: Array<{
    url: string;
    isMain: boolean;
    caption?: string;
  }>;
  languages: string[];
  familyInfo?: {
    familySize?: number;
    background?: string;
    generations?: number;
  };
  location: {
    country: string;
    state: string;
    district: string;
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    nearbyLandmarks?: string[];
  };
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  providerId: {
    _id: string;
    name: string;
    profilePicture?: string;
    rating?: number;
  };
  availability: Array<{
    date: string;
    available: boolean;
    bookedSlots: number;
  }>;
  roomVariants?: Array<{
    variantId: string;
    name: string;
    description?: string;
    pricePerNight: number;
    capacity: number;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    images: Array<{
      url: string;
      isMain?: boolean;
      caption?: string;
    }>;
  }>;
  defaultVariantId?: string | null;
  linkedExperiences?: Array<{
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
  }>;
}

export default function AbodeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { addAbodeToCart, addExperienceToCartItem } = useCart();
  const [abode, setAbode] = useState<LocalHost | null>(null);
  const [linkedExperiences, setLinkedExperiences] = useState<LocalHost['linkedExperiences']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [addedExperiences, setAddedExperiences] = useState<Map<string, { date: Date; startTime: string; participants: number }>>(new Map());
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'checkin' | 'checkout' | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchAbode();
    }
  }, [params.id]);

  useEffect(() => {
    // Check if current user is the owner of this abode
    if (abode && typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      if (hostData) {
        try {
          const host = JSON.parse(hostData);
          // Check if host ID matches the abode's providerId
          if (host._id === abode.providerId._id) {
            setIsOwner(true);
            return;
          }
        } catch (err) {
          console.error('Error parsing host data:', err);
        }
      }
      setIsOwner(false);
    }
  }, [abode]);

  const fetchAbode = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/abodes/${params.id}`);
      const fetchedAbode = response.data.localHost;
      
      // Debug: Log room variants
      if (process.env.NODE_ENV === 'development') {
        console.log('[AbodeDetailPage] Fetched abode:', {
          id: fetchedAbode._id,
          hasRoomVariants: !!(fetchedAbode.roomVariants && fetchedAbode.roomVariants.length > 0),
          roomVariantsCount: fetchedAbode.roomVariants?.length || 0,
          roomVariants: fetchedAbode.roomVariants,
          defaultVariantId: fetchedAbode.defaultVariantId
        });
      }
      
      setAbode(fetchedAbode);
      setLinkedExperiences(response.data.linkedExperiences || []);
      
      // Set default variant
      if (fetchedAbode?.defaultVariantId) {
        setSelectedVariantId(fetchedAbode.defaultVariantId);
      } else if (fetchedAbode?.roomVariants && fetchedAbode.roomVariants.length > 0) {
        setSelectedVariantId(fetchedAbode.roomVariants[0].variantId);
      }
    } catch (err: any) {
      console.error('Error fetching abode:', err);
      setError(err.response?.data?.message || 'Failed to load abode details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      const currentPath = `/abodes/${params.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (checkOut <= checkIn) {
      alert('Check-out date must be after check-in date');
      return;
    }

    if (!abode) return;

    // Check capacity based on variant
    const selectedVariant = abode.roomVariants?.find(v => v.variantId === selectedVariantId);
    const maxCapacity = selectedVariant ? selectedVariant.capacity : abode.abodeDetails.capacity;
    
    if (guests > maxCapacity) {
      alert(`Maximum capacity is ${maxCapacity} guests`);
      return;
    }

    try {
      setAddingToCart(true);
      
      // Add abode to cart
      await addAbodeToCart({
        localHostId: abode._id,
        variantId: selectedVariantId,
        checkIn,
        checkOut,
        guests,
        specialRequests: ''
      });

      // Get the cart item ID (we'll need to refresh cart to get it)
      // For now, we'll add experiences after a short delay
      setTimeout(async () => {
        // Add experiences if any
        const cartResponse = await api.get('/cart');
        if (cartResponse.data.success && cartResponse.data.cart.items.length > 0) {
          const cartItemId = cartResponse.data.cart.items[cartResponse.data.cart.items.length - 1]._id;
          
          for (const [experienceId, expData] of addedExperiences.entries()) {
            try {
              // Ensure participants is a valid number (between 1 and 50)
              const participants = Math.max(1, Math.min(50, Number(expData.participants) || 1));
              await addExperienceToCartItem(cartItemId, {
                experienceId,
                date: expData.date,
                startTime: expData.startTime,
                participants
              });
            } catch (err) {
              console.error('Error adding experience to cart:', err);
            }
          }
        }
        
        setShowCartSidebar(true);
        setAddingToCart(false);
      }, 500);
    } catch (err: any) {
      console.error('Error adding to cart:', err);
      alert(err.message || 'Failed to add to cart');
      setAddingToCart(false);
    }
  };

  const handleAddExperience = (experience: any) => {
    setAddedExperiences(prev => {
      const newMap = new Map(prev);
      // Use default values: today's date, default time, 1 participant
      const defaultDate = new Date();
      newMap.set(experience._id, { 
        date: defaultDate, 
        startTime: '09:00', 
        participants: 1 
      });
      return newMap;
    });
  };

  const handleRemoveExperience = (experienceId: string) => {
    setAddedExperiences(prev => {
      const newMap = new Map(prev);
      newMap.delete(experienceId);
      return newMap;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !abode) {
    return (
      <div className="min-h-screen bg-off-white pt-24 pb-16">
        <div className="section-container-luxury">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-2xl font-semibold text-charcoal-700 mb-2">
              {error || 'Abode not found'}
            </h3>
            <button
              onClick={() => router.push('/abodes')}
              className="mt-6 px-6 py-3 bg-heritage-gold text-white font-medium rounded-lg hover:bg-heritage-gold-dark transition-all"
            >
              Browse Abodes
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mainImage = abode.images[selectedImageIndex] || abode.images[0];
  const imageUrl = mainImage ? getImageUrl(mainImage.url) : null;
  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Calculate price based on selected variant
  const selectedVariant = abode.roomVariants?.find(v => v.variantId === selectedVariantId);
  let basePrice = 0;
  if (selectedVariant && nights > 0) {
    basePrice = selectedVariant.pricePerNight * nights;
  } else if (nights > 0) {
    basePrice = abode.pricing.pricePerNight * nights;
  }
  
  let discount = 0;
  if (nights >= 30 && abode.pricing.monthlyDiscount) {
    discount = basePrice * (abode.pricing.monthlyDiscount / 100);
  } else if (nights >= 7 && abode.pricing.weeklyDiscount) {
    discount = basePrice * (abode.pricing.weeklyDiscount / 100);
  }
  
  // Add experience prices
  let experienceTotal = 0;
  for (const [expId, expData] of addedExperiences.entries()) {
    const experience = linkedExperiences.find(e => e._id === expId);
    if (experience) {
      let expPrice = experience.price;
      if (experience.isAddOn && experience.addOnPricing?.price) {
        expPrice = experience.addOnPricing.price;
        if (experience.addOnPricing.discount) {
          expPrice *= (1 - experience.addOnPricing.discount / 100);
        }
      }
      experienceTotal += expPrice * expData.participants;
    }
  }
  
  const totalPrice = basePrice - discount + experienceTotal;
  
  // Get price per night for display
  const pricePerNight = selectedVariant ? selectedVariant.pricePerNight : abode.pricing.pricePerNight;
  
  // Check if we should show "from" prefix (multiple variants with different prices)
  const showFromPrefix = abode.roomVariants && abode.roomVariants.length > 1 && 
    !selectedVariant && 
    Math.min(...abode.roomVariants.map(v => v.pricePerNight)) !== 
    Math.max(...abode.roomVariants.map(v => v.pricePerNight));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </motion.button>

        <div className={`grid grid-cols-1 gap-8 ${!isOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-5xl mx-auto'}`}>
          {/* Main Content */}
          <div className={!isOwner ? 'lg:col-span-2 space-y-8' : 'space-y-8'}>
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
            >
              <div className="relative w-full h-[500px] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                {imageUrl ? (
                  <motion.img
                    key={selectedImageIndex}
                    src={imageUrl}
                    alt={abode.abodeDetails.description}
                    className="w-full h-full object-cover"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="w-24 h-24 text-gray-400" />
                  </div>
                )}
                
                {/* Image Navigation */}
                {abode.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev - 1 + abode.images.length) % abode.images.length)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev + 1) % abode.images.length)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:scale-110 transition-all"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-700" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {abode.images.slice(0, 5).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`h-2 rounded-full transition-all ${
                            selectedImageIndex === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {abode.images.length > 1 && (
                <div className="p-4 grid grid-cols-5 gap-3">
                  {abode.images.slice(0, 5).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImageIndex === index
                          ? 'border-heritage-gold shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={getImageUrl(img.url) || ''}
                        alt={img.caption || `Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title & Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {abode.isVerified && (
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-bold">Verified</span>
                      </div>
                    )}
                    {abode.culturalPractices && abode.culturalPractices.length > 0 && (
                      <div className="bg-gradient-to-r from-purple-500/90 to-indigo-500/90 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-semibold">Cultural Experience</span>
                      </div>
                    )}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                    {abode.abodeDetails.title || `${abode.providerId.name}'s ${abode.abodeDetails.propertyType}`}
                  </h1>
                  {abode.abodeDetails.title && (
                    <p className="text-xl text-gray-600 mb-4 font-medium">
                      {abode.providerId.name}'s {abode.abodeDetails.propertyType}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-gray-600 mb-6">
                    <MapPin className="w-5 h-5" />
                    <span className="text-lg">{abode.location.district}, {abode.location.state}, {abode.location.country}</span>
                  </div>
                </div>
                {abode.rating > 0 && (
                  <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 shadow-lg border border-gray-200">
                    <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                    <div>
                      <span className="text-2xl font-bold text-gray-900">{abode.rating.toFixed(1)}</span>
                      {abode.ratingCount > 0 && (
                        <span className="text-sm text-gray-600 ml-1">({abode.ratingCount})</span>
                      )}
                    </div>
                </div>
                )}
              </div>

              {/* Property Details */}
              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold">{abode.abodeDetails.capacity} guests</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Bed className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold">{abode.abodeDetails.bedrooms} bedroom{abode.abodeDetails.bedrooms !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Bath className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold">{abode.abodeDetails.bathrooms} bathroom{abode.abodeDetails.bathrooms !== 1 ? 's' : ''}</span>
                </div>
                {abode.languages && abode.languages.length > 0 && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Languages className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold">{abode.languages.join(', ')}</span>
                </div>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">About this abode</h2>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {abode.abodeDetails.description}
              </p>
            </motion.div>

            {/* Additional Experiences Section - Prominent Position */}
            {linkedExperiences && linkedExperiences.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full"
              >
                <div className="bg-gradient-to-br from-heritage-gold/5 via-amber-50/30 to-cream-500/10 rounded-2xl shadow-lg p-4 md:p-5 border border-heritage-gold/20">
                  {/* Compact Header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-gradient-to-br from-heritage-gold to-amber-600 rounded-lg shadow-md">
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-bold text-gray-900">Enhance Your Stay</h2>
                      <p className="text-xs md:text-sm text-gray-600">
                        Optional cultural experiences
                      </p>
                    </div>
                  </div>
                  
                  {/* Compact Cards List */}
                  <div className="space-y-2">
                    {linkedExperiences.map((experience) => (
                      <ExperienceAddOnCard
                        key={experience._id}
                        experience={experience}
                        isAdded={addedExperiences.has(experience._id)}
                        onAdd={handleAddExperience}
                        onRemove={() => handleRemoveExperience(experience._id)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cultural Practices */}
            {abode.culturalPractices.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">
                  Cultural Practices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {abode.culturalPractices.map((practice, index) => (
                    <div key={index} className="p-4 bg-cream-50 rounded-lg border border-cream-300">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-heritage-gold text-white text-xs font-semibold rounded">
                          {practice.category}
                        </span>
                        <h3 className="font-semibold text-charcoal-700">{practice.practice}</h3>
                      </div>
                      {practice.description && (
                        <p className="text-sm text-charcoal-600">{practice.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Nearby Places */}
            {abode.nearbyPlaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">
                  Nearby Cultural & Historical Places
                </h2>
                <div className="space-y-4">
                  {abode.nearbyPlaces.map((place, index) => (
                    <div key={index} className="p-4 bg-cream-50 rounded-lg border border-cream-300">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-charcoal-700">{place.name}</h3>
                        <span className="px-2 py-1 bg-heritage-gold-light text-charcoal-700 text-xs font-semibold rounded">
                          {place.significance}
                        </span>
                      </div>
                      {place.description && (
                        <p className="text-sm text-charcoal-600 mb-2">{place.description}</p>
                      )}
                      {place.distance > 0 && (
                        <p className="text-xs text-charcoal-500">
                          {place.distance} km away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Amenities */}
            {abode.abodeDetails.amenities.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {abode.abodeDetails.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-charcoal-600">
                      <svg className="w-5 h-5 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {amenity}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* House Rules */}
            {abode.abodeDetails.houseRules.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {abode.abodeDetails.houseRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-charcoal-600">
                      <svg className="w-5 h-5 text-heritage-gold mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {rule}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Family Info */}
            {abode.familyInfo?.background && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-2xl shadow-luxury p-6"
              >
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">About the Family</h2>
                <p className="text-charcoal-600 leading-relaxed whitespace-pre-line">
                  {abode.familyInfo.background}
                </p>
                {abode.familyInfo.generations && (
                  <p className="mt-4 text-sm text-charcoal-500">
                    {abode.familyInfo.generations} generation{abode.familyInfo.generations !== 1 ? 's' : ''} of tradition
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Booking Sidebar - Only show if user is not the owner */}
          {!isOwner && (
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
              >
              {/* Room Variant Selector */}
              {abode.roomVariants && abode.roomVariants.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Select Room Type</h3>
                  <RoomVariantSelector
                    variants={abode.roomVariants}
                    defaultVariantId={abode.defaultVariantId}
                    selectedVariantId={selectedVariantId}
                    onSelect={setSelectedVariantId}
                    currency={abode.pricing.currency || 'USD'}
                  />
                </div>
              )}

              {/* Price */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-baseline gap-2 mb-2">
                  {showFromPrefix && (
                    <span className="text-lg text-gray-600 font-medium">from</span>
                  )}
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(pricePerNight, abode.pricing.currency || 'INR')}
                  </span>
                  <span className="text-lg text-gray-600">/night</span>
                </div>
                {abode.pricing.weeklyDiscount && (
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Award className="w-4 h-4 text-heritage-gold" />
                    {abode.pricing.weeklyDiscount}% off for 7+ nights
                  </p>
                )}
              </div>

              {/* Date Selection */}
              <div className="mb-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-in
                  </label>
                  <button
                    onClick={() => setShowDatePicker(showDatePicker === 'checkin' ? null : 'checkin')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-heritage-gold transition-colors text-left flex items-center justify-between"
                  >
                    <span className={checkIn ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {checkIn ? checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>
                  <AnimatePresence>
                    {showDatePicker === 'checkin' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 bg-white border-2 border-gray-200 rounded-xl p-4 shadow-xl"
                      >
                  <DayPicker
                    mode="single"
                    selected={checkIn}
                          onSelect={(date) => {
                            setCheckIn(date);
                            setShowDatePicker(null);
                          }}
                    disabled={(date) => date < new Date()}
                  />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-out
                  </label>
                  <button
                    onClick={() => setShowDatePicker(showDatePicker === 'checkout' ? null : 'checkout')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-heritage-gold transition-colors text-left flex items-center justify-between"
                  >
                    <span className={checkOut ? 'text-gray-900 font-medium' : 'text-gray-400'}>
                      {checkOut ? checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date'}
                    </span>
                    <Calendar className="w-5 h-5 text-gray-400" />
                  </button>
                  <AnimatePresence>
                    {showDatePicker === 'checkout' && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 bg-white border-2 border-gray-200 rounded-xl p-4 shadow-xl"
                      >
                  <DayPicker
                    mode="single"
                    selected={checkOut}
                          onSelect={(date) => {
                            setCheckOut(date);
                            setShowDatePicker(null);
                          }}
                    disabled={(date) => !checkIn || date <= checkIn}
                  />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Guests
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-heritage-gold focus:border-heritage-gold transition-all font-medium"
                  >
                    {[...Array(abode.abodeDetails.capacity)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} guest{i !== 0 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="mb-8 p-6 bg-gradient-to-br from-heritage-gold/5 to-cream-500/10 rounded-2xl border border-heritage-gold/20 space-y-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>{formatPrice(pricePerNight, abode.pricing.currency || 'INR')} × {nights} nights</span>
                    <span className="font-semibold">{formatPrice(basePrice, abode.pricing.currency || 'INR')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-600 font-semibold">
                      <span>Discount</span>
                      <span>-{formatPrice(discount, abode.pricing.currency || 'INR')}</span>
                    </div>
                  )}
                  {addedExperiences.size > 0 && (
                    <div className="space-y-1 pt-2 border-t border-gray-300">
                      {Array.from(addedExperiences.entries()).map(([expId, expData]) => {
                        const experience = linkedExperiences.find(e => e._id === expId);
                        if (!experience) return null;
                        let expPrice = experience.price;
                        if (experience.isAddOn && experience.addOnPricing?.price) {
                          expPrice = experience.addOnPricing.price;
                          if (experience.addOnPricing.discount) {
                            expPrice *= (1 - experience.addOnPricing.discount / 100);
                          }
                        }
                        return (
                          <div key={expId} className="flex justify-between text-sm text-gray-700">
                            <span>{experience.title} ({expData.participants} ×)</span>
                            <span className="font-semibold">{formatPrice(expPrice * expData.participants, experience.currency || 'USD')}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3 flex justify-between font-bold text-lg text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(totalPrice, abode.pricing.currency || 'INR')}</span>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={!checkIn || !checkOut || addingToCart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-6 py-4 bg-gradient-to-r from-heritage-gold to-heritage-gold-dark text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Adding to Cart...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </>
                )}
              </motion.button>

              {!user && (
                <p className="mt-4 text-sm text-center text-gray-600">
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/adobes/${params.id}`)}`)}
                    className="text-heritage-gold hover:underline font-semibold"
                  >
                    Sign in
                  </button>
                  {' '}to book
                </p>
              )}
            </motion.div>
          </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />
    </div>
  );
}


