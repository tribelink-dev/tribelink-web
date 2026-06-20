'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/CartContext';
import { useCurrency } from '@/lib/CurrencyContext';
import { ChevronLeft, MapPin, Bed, Bath, Users, Star } from 'lucide-react';
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
import { Sheet } from '@/components/ui/Sheet';
import type { AbodeData } from '@/lib/fetchAbode';

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

interface AbodeDetailClientProps {
  abodeId: string;
  initialAbode?: AbodeData | null;
  initialLinkedExperiences?: LocalHost['linkedExperiences'];
}

export default function AbodeDetailClient({
  abodeId,
  initialAbode = null,
  initialLinkedExperiences = [],
}: AbodeDetailClientProps) {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { addAbodeToCart, addExperienceToCartItem } = useCart();
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();
  const { isAbodeSaved, toggleAbode } = useSaved();
  const [abode, setAbode] = useState<LocalHost | null>(initialAbode as LocalHost | null);
  const [linkedExperiences, setLinkedExperiences] = useState<LocalHost['linkedExperiences']>(
    initialLinkedExperiences || []
  );
  const [loading, setLoading] = useState(!initialAbode);
  const [error, setError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [addedExperiences, setAddedExperiences] = useState<Map<string, { date: Date; startTime: string; participants: number }>>(new Map());
  const [addingToCart, setAddingToCart] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [showBookingSheet, setShowBookingSheet] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    if (!initialAbode) {
      fetchAbode();
    }
  }, [params.id, initialAbode]);

  useEffect(() => {
    if (!initialAbode) return;
    if (initialAbode.defaultVariantId) {
      setSelectedVariantId(initialAbode.defaultVariantId);
    } else if (
      Array.isArray(initialAbode.roomVariants) &&
      initialAbode.roomVariants.length > 0
    ) {
      const first = initialAbode.roomVariants[0] as { variantId?: string };
      if (first?.variantId) setSelectedVariantId(first.variantId);
    }
  }, [initialAbode]);

  useEffect(() => {
    // Check if current user is the owner of this abode
    if (abode && typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      if (hostData) {
        try {
          const host = JSON.parse(hostData);
          // Check if host ID matches the abode's providerId
          if (host._id === abode.providerId?._id) {
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

  useEffect(() => {
    if (!abode) return;
    const variant = abode.roomVariants?.find((v) => v.variantId === selectedVariantId);
    const cap = variant ? variant.capacity : abode.abodeDetails.capacity;
    setGuests((g) => (g > cap ? cap : g));
  }, [selectedVariantId, abode]);

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
        
        setShowBookingSheet(false);
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
      <div className="min-h-screen bg-background pt-below-nav pb-sos-clear px-page">
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-xl sm:text-2xl font-semibold text-text-primary mb-2">
            {error || 'Abode not found'}
          </h3>
          <Button className="mt-6" onClick={() => router.push('/explore?section=abodes')}>
            Browse homestays
          </Button>
        </div>
      </div>
    );
  }

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
  
  // Check if we should show "from" prefix (multiple variants with different prices, no selection yet)
  const showFromPrefix =
    !selectedVariant &&
    abode.roomVariants &&
    abode.roomVariants.length > 1 &&
    Math.min(...abode.roomVariants.map((v) => v.pricePerNight)) !==
      Math.max(...abode.roomVariants.map((v) => v.pricePerNight));

  const unavailableDates = (abode.availability || [])
    .filter((a) => !a.available)
    .map((a) => new Date(a.date));

  const maxGuests = selectedVariant ? selectedVariant.capacity : abode.abodeDetails.capacity;
  const displayCapacity = selectedVariant ? selectedVariant.capacity : abode.abodeDetails.capacity;
  const displayBedrooms = selectedVariant ? selectedVariant.bedrooms : abode.abodeDetails.bedrooms;
  const displayBathrooms = selectedVariant ? selectedVariant.bathrooms : abode.abodeDetails.bathrooms;
  const displayTitle = abode.abodeDetails.title || `${abode.providerId.name}'s ${abode.abodeDetails.propertyType}`;
  const hasRoomVariants = !!(abode.roomVariants && abode.roomVariants.length > 0);
  const galleryImages =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : abode.images;
  const roomName = selectedVariant?.name;

  const reserveWidgetProps = {
    pricePerNight,
    currency: abode.pricing.currency || 'INR',
    nights,
    totalPrice,
    guests,
    maxGuests,
    checkIn,
    checkOut,
    unavailableDates,
    onCheckInChange: setCheckIn,
    onCheckOutChange: setCheckOut,
    onGuestsChange: setGuests,
    onReserve: handleAddToCart,
    loading: addingToCart,
    error: bookingError,
    showFromPrefix: !!showFromPrefix,
    experienceTotal,
    roomName,
  };

  const saveButton =
    !isOwner && abode._id ? (
      <Button variant="secondary" size="sm" onClick={() => toggleAbode(abode._id)}>
        {isAbodeSaved(abode._id) ? 'Saved' : 'Save'}
      </Button>
    ) : null;

  const locationLabel = `${abode.location.district}, ${abode.location.state}`;

  const quickStats = (
    <>
      <span className="inline-flex items-center gap-1">
        <Users className="w-4 h-4 shrink-0" />
        {displayCapacity} guest{displayCapacity !== 1 ? 's' : ''}
      </span>
      <span className="inline-flex items-center gap-1">
        <Bed className="w-4 h-4 shrink-0" />
        {displayBedrooms} bed{displayBedrooms !== 1 ? 's' : ''}
      </span>
      <span className="inline-flex items-center gap-1">
        <Bath className="w-4 h-4 shrink-0" />
        {displayBathrooms} bath{displayBathrooms !== 1 ? 's' : ''}
      </span>
      {selectedVariant && hasRoomVariants && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-muted border border-border text-text-primary">
          {selectedVariant.name}
        </span>
      )}
    </>
  );

  return (
    <div className={`min-h-screen bg-background pt-below-nav ${!isOwner ? 'pb-bottom-bar md:pb-16' : 'pb-sos-clear md:pb-16'}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Desktop: back link + title above gallery */}
      <div className="hidden sm:block px-page lg:px-page-lg">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors touch-target -ml-2"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">{displayTitle}</h1>
            {saveButton}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            {abode.rating > 0 && (
              <span className="inline-flex items-center gap-1 text-text-primary font-medium">
                <Star className="w-4 h-4 fill-text-primary text-text-primary" />
                {abode.rating.toFixed(1)}
                {abode.ratingCount > 0 && (
                  <span className="text-text-secondary font-normal">
                    · {abode.ratingCount} review{abode.ratingCount !== 1 ? 's' : ''}
                  </span>
                )}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4 shrink-0" />
              {locationLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Gallery — full-bleed on mobile with floating back */}
      <div className="relative mb-4 sm:mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="sm:hidden absolute top-4 left-4 z-20 touch-target flex items-center justify-center w-10 h-10 rounded-full bg-white/95 shadow-md text-text-primary"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="px-page lg:px-page-lg">
          <AbodePhotoGallery
            key={selectedVariantId || 'property'}
            images={galleryImages}
            title={displayTitle}
          />
        </div>
      </div>

      {/* Mobile: title + meta below gallery */}
      <div className="sm:hidden px-page mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-xl font-semibold text-text-primary leading-snug">{displayTitle}</h1>
          {saveButton}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mb-3">
          {abode.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-text-primary font-medium">
              <Star className="w-4 h-4 fill-text-primary text-text-primary" />
              {abode.rating.toFixed(1)}
              {abode.ratingCount > 0 && (
                <span className="text-text-secondary font-normal">({abode.ratingCount})</span>
              )}
            </span>
          )}
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-secondary">
          {quickStats}
        </div>
      </div>

      <PageContainer width="constrained" belowNav={false} className="pb-8">
        <div className={`grid grid-cols-1 gap-8 ${!isOwner ? 'lg:grid-cols-3' : 'lg:grid-cols-1 max-w-5xl mx-auto'}`}>
          <div className={!isOwner ? 'lg:col-span-2 order-2 lg:order-1 space-y-6 sm:space-y-8' : 'space-y-6 sm:space-y-8'}>
            <AbodeHostProfile
              host={abode.providerId}
              familyInfo={abode.familyInfo}
              languages={abode.languages}
              isVerified={abode.isVerified}
            />

            <AbodeReviewsSection rating={abode.rating} ratingCount={abode.ratingCount} />

            <section className="py-4">
              <div className="hidden sm:flex flex-wrap items-center gap-4 text-sm text-text-secondary mb-6">
                {quickStats}
              </div>
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4">About this homestay</h2>
              <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                {abode.abodeDetails.description}
              </p>
            </section>

            {!isOwner && hasRoomVariants && (
              <section className="py-4 border-t border-border">
                <RoomVariantSelector
                  variants={abode.roomVariants!}
                  defaultVariantId={abode.defaultVariantId}
                  selectedVariantId={selectedVariantId}
                  onSelect={setSelectedVariantId}
                  currency={abode.pricing.currency || 'INR'}
                  nights={nights}
                />
              </section>
            )}

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
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary">{place.name}</h3>
                        <span className="self-start shrink-0 px-2 py-1 bg-brand-light text-text-primary text-xs font-semibold rounded">
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

            {/* Amenities — property-level when no room variants */}
            {abode.abodeDetails.amenities.length > 0 && !hasRoomVariants && (
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
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4">House Rules</h2>
                <ul className="space-y-2">
                  {abode.abodeDetails.houseRules.map((rule, index) => (
                    <li key={index} className="flex items-start gap-2 text-text-secondary">
                      <svg className="w-5 h-5 text-brand mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h2 className="text-lg sm:text-xl font-semibold text-text-primary mb-4">About the Family</h2>
                <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                  {abode.familyInfo.background}
                </p>
                {abode.familyInfo.generations && (
                  <p className="mt-4 text-sm text-text-secondary">
                    {abode.familyInfo.generations} generation{abode.familyInfo.generations !== 1 ? 's' : ''} of tradition
                  </p>
                )}
              </section>
            )}
          </div>

          {!isOwner && (
            <div className="lg:col-span-1 order-1 lg:order-2 hidden lg:block">
              <ReserveWidget {...reserveWidgetProps} />
            </div>
          )}
        </div>
      </PageContainer>

      {!isOwner && (
        <MobileStickyBar innerClassName="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowBookingSheet(true)}
            className="min-w-0 text-left"
          >
            <p className="text-lg font-semibold text-text-primary">
              {formatPrice(pricePerNight, abode.pricing.currency || 'INR')}
              <span className="text-sm font-normal text-text-secondary"> /night</span>
            </p>
            <p className="text-xs text-text-secondary truncate">
              {checkIn && checkOut
                ? `${checkIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${checkOut.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${guests} guest${guests !== 1 ? 's' : ''}`
                : roomName || 'Select dates'}
            </p>
            {bookingError && <p className="text-xs text-red-600 truncate">{bookingError}</p>}
          </button>
          <Button onClick={() => setShowBookingSheet(true)} disabled={addingToCart} className="shrink-0 min-w-[7rem]">
            {addingToCart ? '...' : checkIn && checkOut ? 'Reserve' : 'Check dates'}
          </Button>
        </MobileStickyBar>
      )}

      <Sheet
        open={showBookingSheet}
        onClose={() => setShowBookingSheet(false)}
        title="Book your stay"
        className="max-h-[92vh]"
      >
        <ReserveWidget {...reserveWidgetProps} compact className="shadow-none border-0 -mx-2" />
      </Sheet>

      {/* Cart Sidebar */}
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />
    </div>
  );
}


