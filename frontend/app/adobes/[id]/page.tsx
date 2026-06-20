'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/CartContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { ChevronLeft, MapPin, Bed, Bath, Users, Sparkles } from 'lucide-react';
import RoomVariantSelector from '@/components/booking/RoomVariantSelector';
import ExperienceAddOnCard from '@/components/booking/ExperienceAddOnCard';
import CartSidebar from '@/components/cart/CartSidebar';
import AbodePhotoGallery from '@/components/abode/AbodePhotoGallery';
import AbodeHostProfile from '@/components/abode/AbodeHostProfile';
import AbodeReviewsSection from '@/components/abode/AbodeReviewsSection';
import ReserveWidget from '@/components/abode/ReserveWidget';
import { DetailPageSkeleton } from '@/components/ui/Skeleton';
import ToastContainer, { useToast } from '@/components/Toast';
import { useSaved } from '@/lib/SavedContext';
import { Button } from '@/components/ui/Button';
import { PageContainer } from '@/components/ui/PageContainer';
import MobileStickyBar from '@/components/ui/MobileStickyBar';

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
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();
  const { isAbodeSaved, toggleAbode } = useSaved();
  const [abode, setAbode] = useState<LocalHost | null>(null);
  const [linkedExperiences, setLinkedExperiences] = useState<LocalHost['linkedExperiences']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
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
    setBookingError('');
    if (!user) {
      const currentPath = `/abodes/${params.id}`;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    if (!checkIn || !checkOut) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }

    if (checkOut <= checkIn) {
      setBookingError('Check-out date must be after check-in date');
      return;
    }

    if (!abode) return;

    // Check capacity based on variant
    const selectedVariant = abode.roomVariants?.find(v => v.variantId === selectedVariantId);
    const maxCapacity = selectedVariant ? selectedVariant.capacity : abode.abodeDetails.capacity;
    
    if (guests > maxCapacity) {
      setBookingError(`Maximum capacity is ${maxCapacity} guests`);
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
          
          for (const [experienceId, expData] of Array.from(addedExperiences.entries())) {
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
        showSuccess('Added to your trip');
      }, 500);
    } catch (err: any) {
      const msg = err.message || 'Failed to reserve';
      setBookingError(msg);
      showError(msg);
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
      <div className="min-h-screen bg-background pt-below-nav pb-16">
        <PageContainer belowNav={false}>
          <DetailPageSkeleton />
        </PageContainer>
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
  for (const [expId, expData] of Array.from(addedExperiences.entries())) {
    const experience = (linkedExperiences ?? []).find(e => e._id === expId);
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

  const unavailableDates = (abode.availability || [])
    .filter((a) => !a.available)
    .map((a) => new Date(a.date));

  const maxGuests = selectedVariant ? selectedVariant.capacity : abode.abodeDetails.capacity;
  const displayTitle = abode.abodeDetails.title || `${abode.providerId.name}'s ${abode.abodeDetails.propertyType}`;

  return (
    <div className={`min-h-screen bg-background pt-below-nav ${!isOwner ? 'pb-bottom-bar lg:pb-16' : 'pb-sos-clear lg:pb-16'}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="px-page lg:px-page-lg">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">{displayTitle}</h1>
            {!isOwner && abode._id && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleAbode(abode._id)}
              >
                {isAbodeSaved(abode._id) ? 'Saved' : 'Save'}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <MapPin className="w-4 h-4" />
            {abode.location.district}, {abode.location.state}
          </div>
        </div>
      </div>

      <div className="px-page lg:px-page-lg mb-8">
        <AbodePhotoGallery images={abode.images} title={displayTitle} />
      </div>

      <PageContainer width="constrained" belowNav={false} className="pb-8">
        <div className={`grid grid-cols-1 gap-8 ${!isOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-5xl mx-auto'}`}>
          <div className={!isOwner ? 'lg:col-span-2 order-2 lg:order-1 space-y-8' : 'space-y-8'}>
            <AbodeHostProfile
              host={abode.providerId}
              familyInfo={abode.familyInfo}
              languages={abode.languages}
              isVerified={abode.isVerified}
            />

            <AbodeReviewsSection rating={abode.rating} ratingCount={abode.ratingCount} />

            <section className="py-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{abode.abodeDetails.capacity} guests</span>
                <span className="flex items-center gap-1"><Bed className="w-4 h-4" />{abode.abodeDetails.bedrooms} bedrooms</span>
                <span className="flex items-center gap-1"><Bath className="w-4 h-4" />{abode.abodeDetails.bathrooms} bathrooms</span>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">About this homestay</h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                {abode.abodeDetails.description}
              </p>
            </section>

            {/* Included & optional experiences */}
            {linkedExperiences && linkedExperiences.length > 0 && (
              <section className="py-4 border-t border-border">
                <h2 className="text-xl font-semibold text-text-primary mb-2">Included & optional experiences</h2>
                <p className="text-sm text-text-secondary mb-4">Cultural activities you can add to your stay</p>
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
              </section>
            )}

            {/* Cultural Practices */}
            {abode.culturalPractices.length > 0 && (
              <section className="py-4 border-t border-border">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  Cultural Practices
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {abode.culturalPractices.map((practice, index) => (
                    <div key={index} className="p-4 bg-surface-muted rounded-card border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-brand text-white text-xs font-semibold rounded">
                          {practice.category}
                        </span>
                        <h3 className="font-semibold text-text-primary">{practice.practice}</h3>
                      </div>
                      {practice.description && (
                        <p className="text-sm text-text-secondary">{practice.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Nearby Places */}
            {abode.nearbyPlaces.length > 0 && (
              <section className="py-4 border-t border-border">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  Nearby Cultural & Historical Places
                </h2>
                <div className="space-y-4">
                  {abode.nearbyPlaces.map((place, index) => (
                    <div key={index} className="p-4 bg-surface-muted rounded-card border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-text-primary">{place.name}</h3>
                        <span className="px-2 py-1 bg-brand-light text-text-primary text-xs font-semibold rounded">
                          {place.significance}
                        </span>
                      </div>
                      {place.description && (
                        <p className="text-sm text-text-secondary mb-2">{place.description}</p>
                      )}
                      {place.distance > 0 && (
                        <p className="text-xs text-text-secondary">
                          {place.distance} km away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Amenities */}
            {abode.abodeDetails.amenities.length > 0 && (
              <section className="py-4 border-t border-border">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {abode.abodeDetails.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 text-text-secondary">
                      <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {amenity}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* House Rules */}
            {abode.abodeDetails.houseRules.length > 0 && (
              <section className="py-4 border-t border-border">
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
              </section>
            )}

            {/* Family Info */}
            {abode.familyInfo?.background && (
              <section className="py-4 border-t border-border">
                <h2 className="text-2xl font-semibold text-charcoal-700 mb-4">About the Family</h2>
                <p className="text-charcoal-600 leading-relaxed whitespace-pre-line">
                  {abode.familyInfo.background}
                </p>
                {abode.familyInfo.generations && (
                  <p className="mt-4 text-sm text-charcoal-500">
                    {abode.familyInfo.generations} generation{abode.familyInfo.generations !== 1 ? 's' : ''} of tradition
                  </p>
                )}
              </section>
            )}
          </div>

          {!isOwner && (
            <div className="lg:col-span-1 order-1 lg:order-2 space-y-4">
              {abode.roomVariants && abode.roomVariants.length > 0 && (
                <RoomVariantSelector
                  variants={abode.roomVariants}
                  defaultVariantId={abode.defaultVariantId}
                  selectedVariantId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                  currency={abode.pricing.currency || 'INR'}
                />
              )}
              <ReserveWidget
                pricePerNight={pricePerNight}
                currency={abode.pricing.currency || 'INR'}
                nights={nights}
                totalPrice={totalPrice}
                guests={guests}
                maxGuests={maxGuests}
                checkIn={checkIn}
                checkOut={checkOut}
                unavailableDates={unavailableDates}
                onCheckInChange={setCheckIn}
                onCheckOutChange={setCheckOut}
                onGuestsChange={setGuests}
                onReserve={handleAddToCart}
                loading={addingToCart}
                error={bookingError}
                showFromPrefix={!!showFromPrefix}
                experienceTotal={experienceTotal}
              />
            </div>
          )}
        </div>
      </PageContainer>

      {!isOwner && (
        <MobileStickyBar innerClassName="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold text-text-primary">
              {formatPrice(pricePerNight, abode.pricing.currency || 'INR')}
              <span className="text-sm font-normal text-text-secondary"> /night</span>
            </p>
            {bookingError && <p className="text-xs text-red-600 truncate">{bookingError}</p>}
          </div>
          <Button onClick={handleAddToCart} disabled={addingToCart}>
            {addingToCart ? '...' : 'Reserve'}
          </Button>
        </MobileStickyBar>
      )}

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />
    </div>
  );
}


