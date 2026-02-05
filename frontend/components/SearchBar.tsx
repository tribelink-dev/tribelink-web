'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { MapPin, Calendar, Users, Search, ChevronDown, X } from 'lucide-react';

interface SearchBarProps {
  className?: string;
  variant?: 'homepage' | 'navbar';
}

export default function SearchBar({ className = '', variant = 'homepage' }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showGuestsMenu, setShowGuestsMenu] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const locationMenuRef = useRef<HTMLDivElement>(null);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const guestsMenuRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    // Navigate to abodes page with search params
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn.toISOString());
    if (checkOut) params.set('checkOut', checkOut.toISOString());
    if (guests > 1) params.set('guests', guests.toString());
    
    router.push(`/abodes?${params.toString()}`);
  };

  const isHomepage = variant === 'homepage';

  // Popular destinations
  const popularDestinations = [
    { name: 'Kerala, India', description: 'God\'s Own Country', icon: '🌴' },
    { name: 'Tamil Nadu, India', description: 'Land of Temples', icon: '🕌' },
    { name: 'Rajasthan, India', description: 'Land of Kings', icon: '🏰' },
    { name: 'Goa, India', description: 'Beach Paradise', icon: '🏖️' },
    { name: 'Himachal Pradesh, India', description: 'Mountain Retreat', icon: '⛰️' },
  ];

  // Filter destinations based on search
  const filteredDestinations = popularDestinations.filter(dest =>
    dest.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
    dest.description.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node) &&
        dateMenuRef.current && !dateMenuRef.current.contains(event.target as Node) &&
        guestsMenuRef.current && !guestsMenuRef.current.contains(event.target as Node)
      ) {
        setShowLocationMenu(false);
        setShowDateMenu(false);
        setShowGuestsMenu(false);
        setActiveField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={isHomepage ? { scale: 0.95, opacity: 0, y: 10 } : {}}
        animate={isHomepage ? { scale: 1, opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`
          ${isHomepage 
            ? 'bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100/50 p-2' 
            : 'bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100/50 p-1.5'
          }
          flex items-center gap-1
          ${isHomepage ? 'h-20' : 'h-16'}
        `}
      >
        {/* Location */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveField('location');
            setShowLocationMenu(true);
            setShowDateMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative group
            ${activeField === 'location' 
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-lg' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
            ${isHomepage ? 'min-w-[220px]' : 'min-w-[180px]'}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin className={`w-4 h-4 ${activeField === 'location' ? 'text-indigo-600' : 'text-gray-400'} transition-colors`} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Where</div>
          </div>
          <div className={`text-sm font-semibold truncate transition-colors ${
            location ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {location || 'Search destinations'}
          </div>
          {activeField === 'location' && (
            <motion.div
              layoutId="activeFieldIndicator"
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Check-in */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveField('checkIn');
            setShowDateMenu(true);
            setShowLocationMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative group
            ${activeField === 'checkIn' || activeField === 'checkOut'
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-lg' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
            ${isHomepage ? 'min-w-[160px]' : 'min-w-[140px]'}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar className={`w-4 h-4 ${activeField === 'checkIn' || activeField === 'checkOut' ? 'text-indigo-600' : 'text-gray-400'} transition-colors`} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Check in</div>
          </div>
          <div className={`text-sm font-semibold transition-colors ${
            checkIn ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {checkIn ? format(checkIn, 'MMM dd') : 'Add date'}
          </div>
          {(activeField === 'checkIn' || activeField === 'checkOut') && (
            <motion.div
              layoutId="activeFieldIndicator"
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Check-out */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveField('checkOut');
            setShowDateMenu(true);
            setShowLocationMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative group
            ${activeField === 'checkIn' || activeField === 'checkOut'
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-lg' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
            ${isHomepage ? 'min-w-[160px]' : 'min-w-[140px]'}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <Calendar className={`w-4 h-4 ${activeField === 'checkIn' || activeField === 'checkOut' ? 'text-indigo-600' : 'text-gray-400'} transition-colors`} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Check out</div>
          </div>
          <div className={`text-sm font-semibold transition-colors ${
            checkOut ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {checkOut ? format(checkOut, 'MMM dd') : 'Add date'}
          </div>
          {(activeField === 'checkIn' || activeField === 'checkOut') && (
            <motion.div
              layoutId="activeFieldIndicator"
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Guests */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setActiveField('guests');
            setShowGuestsMenu(true);
            setShowLocationMenu(false);
            setShowDateMenu(false);
          }}
          className={`
            flex-1 px-6 py-4 text-left rounded-2xl transition-all duration-300 relative group
            ${activeField === 'guests' 
              ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-lg' 
              : 'hover:bg-gray-50 border-2 border-transparent'
            }
            ${isHomepage ? 'min-w-[160px]' : 'min-w-[140px]'}
          `}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className={`w-4 h-4 ${activeField === 'guests' ? 'text-indigo-600' : 'text-gray-400'} transition-colors`} />
            <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">Who</div>
          </div>
          <div className={`text-sm font-semibold transition-colors ${
            guests > 0 ? 'text-gray-900' : 'text-gray-400'
          }`}>
            {guests} {guests === 1 ? 'guest' : 'guests'}
          </div>
          {activeField === 'guests' && (
            <motion.div
              layoutId="activeFieldIndicator"
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.button>

        {/* Search Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSearch}
          className={`
            ml-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
            hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700
            text-white transition-all duration-300
            ${isHomepage ? 'w-16 h-16' : 'w-14 h-14'}
            flex items-center justify-center
            shadow-lg hover:shadow-xl
            relative overflow-hidden group
          `}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
          />
          <Search className="w-5 h-5 relative z-10" />
        </motion.button>
      </motion.div>

      {/* Location Menu */}
      <AnimatePresence>
        {showLocationMenu && (
          <>
          <motion.div
              ref={locationMenuRef}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-full left-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50"
            >
              {/* Search Input */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-600" />
            <input
              type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
              placeholder="Search destinations..."
                    className="w-full pl-12 pr-10 py-3.5 bg-white border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium transition-all"
              autoFocus
            />
                  {locationSearch && (
              <button
                      onClick={() => setLocationSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
                  )}
                </div>
              </div>

              {/* Results */}
              <div className="max-h-96 overflow-y-auto p-2">
                {filteredDestinations.length > 0 ? (
                  <div className="space-y-1">
                    {filteredDestinations.map((dest, idx) => (
                      <motion.button
                        key={dest.name}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => {
                          setLocation(dest.name);
                          setLocationSearch('');
                  setShowLocationMenu(false);
                  setActiveField(null);
                }}
                        className="w-full text-left px-4 py-3.5 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 rounded-xl transition-all group"
              >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{dest.icon}</span>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {dest.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">{dest.description}</div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 rotate-[-90deg] transition-all" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No destinations found</p>
                    <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                  </div>
                )}
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Date Menu */}
      <AnimatePresence>
        {showDateMenu && (
          <motion.div
            ref={dateMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full left-0 mt-3 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Select dates</h3>
              <p className="text-sm text-gray-500">Choose your check-in and check-out dates</p>
            </div>
            <div className="[&_.rdp]:m-0 [&_.rdp-month]:m-0 [&_.rdp-table]:w-full [&_.rdp-day_selected]:!bg-gradient-to-r [&_.rdp-day_selected]:!from-indigo-600 [&_.rdp-day_selected]:!to-purple-600 [&_.rdp-day_selected]:!text-white [&_.rdp-day_selected]:!font-bold [&_.rdp-day_range_start]:!bg-gradient-to-r [&_.rdp-day_range_start]:!from-indigo-600 [&_.rdp-day_range_start]:!to-purple-600 [&_.rdp-day_range_end]:!bg-gradient-to-r [&_.rdp-day_range_end]:!from-indigo-600 [&_.rdp-day_range_end]:!to-purple-600 [&_.rdp-day]:rounded-xl [&_.rdp-day]:mx-0.5 [&_.rdp-day]:h-10 [&_.rdp-day]:w-10 [&_.rdp-day]:hover:!bg-indigo-100 [&_.rdp-day]:transition-all">
            <DayPicker
              mode="range"
              selected={{ from: checkIn, to: checkOut }}
              onSelect={(range) => {
                if (range?.from) setCheckIn(range.from);
                if (range?.to) setCheckOut(range.to);
                if (range?.from && range?.to) {
                  setShowDateMenu(false);
                  setActiveField(null);
                }
              }}
              disabled={(date) => date < new Date()}
              numberOfMonths={2}
                className="custom-day-picker"
            />
            </div>
            {(checkIn || checkOut) && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {checkIn && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Check-in</div>
                      <div className="text-sm font-bold text-gray-900">{format(checkIn, 'MMM dd, yyyy')}</div>
                    </div>
                  )}
                  {checkOut && (
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Check-out</div>
                      <div className="text-sm font-bold text-gray-900">{format(checkOut, 'MMM dd, yyyy')}</div>
                    </div>
                  )}
                </div>
                {(checkIn || checkOut) && (
                  <button
                    onClick={() => {
                      setCheckIn(undefined);
                      setCheckOut(undefined);
                    }}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guests Menu */}
      <AnimatePresence>
        {showGuestsMenu && (
          <motion.div
            ref={guestsMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute top-full right-0 mt-3 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 z-50"
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Guests</h3>
              <p className="text-sm text-gray-500">How many guests are staying?</p>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-2xl border-2 border-indigo-100">
                <div>
                  <div className="font-bold text-gray-900 mb-1">Adults</div>
                  <div className="text-sm text-gray-500">Ages 13 or above</div>
                </div>
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="w-10 h-10 rounded-xl border-2 border-gray-300 disabled:border-gray-200 disabled:opacity-50 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-all disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </motion.button>
                  <span className="w-12 text-center font-black text-xl text-gray-900">{guests}</span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setGuests(guests + 1)}
                    className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowGuestsMenu(false);
                  setActiveField(null);
                }}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Done
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
      {(showLocationMenu || showDateMenu || showGuestsMenu) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setShowLocationMenu(false);
            setShowDateMenu(false);
            setShowGuestsMenu(false);
            setActiveField(null);
          }}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

