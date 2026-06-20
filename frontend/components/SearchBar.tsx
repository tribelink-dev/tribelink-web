'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, Search, X, Minus, Plus } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  variant?: 'homepage' | 'navbar';
  onSearch?: (searchParams: {
    location: string;
    checkIn: Date | undefined;
    checkOut: Date | undefined;
    guests: number;
  }) => void;
}

const popularDestinations = [
  { name: 'Kerala, India', description: "God's Own Country", icon: '🌴' },
  { name: 'Tamil Nadu, India', description: 'Land of Temples', icon: '🕌' },
  { name: 'Rajasthan, India', description: 'Land of Kings', icon: '🏰' },
  { name: 'Goa, India', description: 'Beach Paradise', icon: '🏖️' },
  { name: 'Himachal Pradesh, India', description: 'Mountain Retreat', icon: '⛰️' },
];

function buildDateSummary(checkIn?: Date, checkOut?: Date) {
  if (checkIn && checkOut) {
    return `${format(checkIn, 'MMM d')} – ${format(checkOut, 'MMM d')}`;
  }
  if (checkIn) return `${format(checkIn, 'MMM d')} – Add checkout`;
  return 'Add dates';
}

export default function SearchBar({ className = '', variant = 'homepage', onSearch }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showGuestsMenu, setShowGuestsMenu] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const locationMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const guestsMenuRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ location, checkIn, checkOut, guests });
    } else {
      const params = new URLSearchParams();
      if (location) params.set('location', location);
      if (checkIn) params.set('checkIn', checkIn.toISOString());
      if (checkOut) params.set('checkOut', checkOut.toISOString());
      if (guests > 1) params.set('guests', guests.toString());
      router.push(`/abodes?${params.toString()}`);
    }
    setShowMobileSheet(false);
    closeMenus();
  };

  const closeMenus = () => {
    setShowLocationMenu(false);
    setShowDateMenu(false);
    setShowGuestsMenu(false);
    setActiveField(null);
  };

  const isHomepage = variant === 'homepage';
  const dateSummary = buildDateSummary(checkIn, checkOut);
  const guestSummary = `${guests} guest${guests !== 1 ? 's' : ''}`;

  const filteredDestinations = popularDestinations.filter(
    (dest) =>
      dest.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      dest.description.toLowerCase().includes(locationSearch.toLowerCase())
  );

  useEffect(() => {
    if (isMobile) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationMenuRef.current &&
        !locationMenuRef.current.contains(event.target as Node) &&
        dateMenuRef.current &&
        !dateMenuRef.current.contains(event.target as Node) &&
        guestsMenuRef.current &&
        !guestsMenuRef.current.contains(event.target as Node)
      ) {
        closeMenus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const dayPickerClass =
    '[&_.rdp]:m-0 [&_.rdp-month]:m-0 [&_.rdp-table]:w-full [&_.rdp-day_selected]:!bg-brand [&_.rdp-day_selected]:!text-white [&_.rdp-day_range_start]:!bg-brand [&_.rdp-day_range_end]:!bg-brand [&_.rdp-day_range_middle]:!bg-brand/15 [&_.rdp-day]:rounded-lg';

  const locationPicker = (
    <div className="space-y-3">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          type="text"
          value={locationSearch}
          onChange={(e) => setLocationSearch(e.target.value)}
          placeholder="Search destinations..."
          className="w-full pl-10 pr-9 py-2.5 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand text-sm"
        />
        {locationSearch && (
          <button
            type="button"
            onClick={() => setLocationSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 touch-target flex items-center justify-center w-7 h-7 rounded-full bg-surface-muted"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-text-secondary" />
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1">
        {filteredDestinations.length > 0 ? (
          filteredDestinations.map((dest) => (
            <button
              key={dest.name}
              type="button"
              onClick={() => {
                setLocation(dest.name);
                setLocationSearch('');
                if (!isMobile) {
                  setShowLocationMenu(false);
                  setActiveField(null);
                }
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-surface-muted rounded-xl transition-colors flex items-center gap-3"
            >
              <span className="text-xl">{dest.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-text-primary text-sm truncate">{dest.name}</div>
                <div className="text-xs text-text-secondary truncate">{dest.description}</div>
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-text-secondary text-center py-6">No destinations found</p>
        )}
      </div>
    </div>
  );

  const datePicker = (
    <div className="space-y-3">
      <div className={dayPickerClass}>
        <DayPicker
          mode="range"
          selected={{ from: checkIn, to: checkOut }}
          onSelect={(range) => {
            setCheckIn(range?.from);
            setCheckOut(range?.to);
          }}
          disabled={(date) => date < new Date()}
          numberOfMonths={isMobile ? 1 : 2}
        />
      </div>
      {(checkIn || checkOut) && (
        <button
          type="button"
          onClick={() => {
            setCheckIn(undefined);
            setCheckOut(undefined);
          }}
          className="text-sm font-medium text-text-secondary hover:text-text-primary underline"
        >
          Clear dates
        </button>
      )}
    </div>
  );

  const guestsPicker = (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="font-medium text-text-primary text-sm">Guests</p>
        <p className="text-xs text-text-secondary">Ages 13 or above</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setGuests(Math.max(1, guests - 1))}
          disabled={guests <= 1}
          className="touch-target w-9 h-9 rounded-full border border-border flex items-center justify-center disabled:opacity-40"
          aria-label="Decrease guests"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold">{guests}</span>
        <button
          type="button"
          onClick={() => setGuests(guests + 1)}
          className="touch-target w-9 h-9 rounded-full border border-border flex items-center justify-center"
          aria-label="Increase guests"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn('relative', className)}>
      {/* Mobile: single compact search pill */}
      {isMobile ? (
        <>
          <button
            type="button"
            onClick={() => setShowMobileSheet(true)}
            className={cn(
              'w-full flex items-center gap-3 rounded-full border border-border bg-surface text-left',
              'h-11 px-3 shadow-card active:scale-[0.99] transition-transform',
              isHomepage && 'shadow-medium'
            )}
            aria-label="Open search"
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand text-white shrink-0">
              <Search className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0 text-sm text-text-secondary truncate">
              <span className="font-semibold text-text-primary">
                {location || 'Where to?'}
              </span>
              {' · '}
              {dateSummary}
              {' · '}
              {guestSummary}
            </span>
          </button>

          <Sheet
            open={showMobileSheet}
            onClose={() => setShowMobileSheet(false)}
            title="Search"
            className="max-h-[92vh]"
          >
            <div className="-mx-4 -mb-4 flex flex-col max-h-[calc(92vh-5.5rem)]">
              <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-4">
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-2 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Where
                  </h3>
                  {location && (
                    <p className="text-sm font-medium text-text-primary mb-2">{location}</p>
                  )}
                  {locationPicker}
                </section>

                <section className="border-t border-border pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    When
                  </h3>
                  {datePicker}
                </section>

                <section className="border-t border-border pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Who
                  </h3>
                  {guestsPicker}
                </section>
              </div>

              <div className="shrink-0 px-4 py-4 border-t border-border bg-surface safe-area-bottom">
                <Button className="w-full" size="lg" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                  Search
                </Button>
              </div>
            </div>
          </Sheet>
        </>
      ) : (
        <>
          <motion.div
            initial={isHomepage ? { scale: 0.95, opacity: 0, y: 10 } : {}}
            animate={isHomepage ? { scale: 1, opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/50 p-1.5',
              'flex flex-row items-center gap-1',
              isHomepage ? 'h-20 rounded-3xl shadow-2xl p-2' : 'h-16'
            )}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveField('location');
                setShowLocationMenu(true);
                setShowDateMenu(false);
                setShowGuestsMenu(false);
              }}
              className={cn(
                'flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative min-w-[180px]',
                isHomepage && 'min-w-[220px]',
                activeField === 'location'
                  ? 'bg-brand/5 border-2 border-brand shadow-medium'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin
                  className={cn(
                    'w-4 h-4',
                    activeField === 'location' ? 'text-brand-hover' : 'text-gray-400'
                  )}
                />
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Where</div>
              </div>
              <div
                className={cn(
                  'text-sm font-semibold truncate',
                  location ? 'text-gray-900' : 'text-gray-400'
                )}
              >
                {location || 'Search destinations'}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveField('checkIn');
                setShowDateMenu(true);
                setShowLocationMenu(false);
                setShowGuestsMenu(false);
              }}
              className={cn(
                'flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative min-w-[140px]',
                isHomepage && 'min-w-[160px]',
                activeField === 'checkIn' || activeField === 'checkOut'
                  ? 'bg-brand/5 border-2 border-brand shadow-medium'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar
                  className={cn(
                    'w-4 h-4',
                    activeField === 'checkIn' || activeField === 'checkOut'
                      ? 'text-brand-hover'
                      : 'text-gray-400'
                  )}
                />
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Check in</div>
              </div>
              <div
                className={cn('text-sm font-semibold', checkIn ? 'text-gray-900' : 'text-gray-400')}
              >
                {checkIn ? format(checkIn, 'MMM dd') : 'Add date'}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveField('checkOut');
                setShowDateMenu(true);
                setShowLocationMenu(false);
                setShowGuestsMenu(false);
              }}
              className={cn(
                'flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative min-w-[140px]',
                isHomepage && 'min-w-[160px]',
                activeField === 'checkIn' || activeField === 'checkOut'
                  ? 'bg-brand/5 border-2 border-brand shadow-medium'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Calendar
                  className={cn(
                    'w-4 h-4',
                    activeField === 'checkIn' || activeField === 'checkOut'
                      ? 'text-brand-hover'
                      : 'text-gray-400'
                  )}
                />
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  Check out
                </div>
              </div>
              <div
                className={cn('text-sm font-semibold', checkOut ? 'text-gray-900' : 'text-gray-400')}
              >
                {checkOut ? format(checkOut, 'MMM dd') : 'Add date'}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveField('guests');
                setShowGuestsMenu(true);
                setShowLocationMenu(false);
                setShowDateMenu(false);
              }}
              className={cn(
                'flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative min-w-[140px]',
                isHomepage && 'min-w-[160px]',
                activeField === 'guests'
                  ? 'bg-brand/5 border-2 border-brand shadow-medium'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Users
                  className={cn(
                    'w-4 h-4',
                    activeField === 'guests' ? 'text-brand-hover' : 'text-gray-400'
                  )}
                />
                <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Who</div>
              </div>
              <div
                className={cn('text-sm font-semibold', guests > 0 ? 'text-gray-900' : 'text-gray-400')}
              >
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className={cn(
                'ml-2 rounded-2xl bg-brand hover:bg-brand-hover text-white transition-all duration-300',
                'flex items-center justify-center shadow-lg hover:shadow-xl relative overflow-hidden',
                isHomepage ? 'w-16 h-16' : 'w-14 h-14'
              )}
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          </motion.div>

          <AnimatePresence>
            {showLocationMenu && (
              <motion.div
                ref={locationMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full left-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[80] p-4"
              >
                {locationPicker}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDateMenu && (
              <motion.div
                ref={dateMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full left-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-[80]"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Select dates</h3>
                  <p className="text-sm text-gray-500">Choose your check-in and check-out dates</p>
                </div>
                {datePicker}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showGuestsMenu && (
              <motion.div
                ref={guestsMenuRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-[80]"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Guests</h3>
                  <p className="text-sm text-gray-500">How many guests are staying?</p>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-brand/5 rounded-2xl border-2 border-brand/20">
                    {guestsPicker}
                  </div>
                  <Button className="w-full" onClick={closeMenus}>
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(showLocationMenu || showDateMenu || showGuestsMenu) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                onClick={closeMenus}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
