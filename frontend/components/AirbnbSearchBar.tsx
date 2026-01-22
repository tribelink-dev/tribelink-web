'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

interface AirbnbSearchBarProps {
  className?: string;
  variant?: 'homepage' | 'navbar';
}

export default function AirbnbSearchBar({ className = '', variant = 'homepage' }: AirbnbSearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [checkIn, setCheckIn] = useState<Date | undefined>();
  const [checkOut, setCheckOut] = useState<Date | undefined>();
  const [guests, setGuests] = useState(1);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showGuestsMenu, setShowGuestsMenu] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  const handleSearch = () => {
    // Navigate to adobes page with search params
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn.toISOString());
    if (checkOut) params.set('checkOut', checkOut.toISOString());
    if (guests > 1) params.set('guests', guests.toString());
    
    router.push(`/adobes?${params.toString()}`);
  };

  const isHomepage = variant === 'homepage';

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={isHomepage ? { scale: 0.95, opacity: 0 } : {}}
        animate={isHomepage ? { scale: 1, opacity: 1 } : {}}
        transition={{ duration: 0.3 }}
        className={`
          ${isHomepage 
            ? 'bg-white rounded-full shadow-2xl border border-gray-200 p-2' 
            : 'bg-white rounded-full shadow-lg border border-gray-200 p-1.5'
          }
          flex items-center
          ${isHomepage ? 'h-16' : 'h-14'}
        `}
      >
        {/* Location */}
        <button
          onClick={() => {
            setActiveField('location');
            setShowLocationMenu(true);
            setShowDateMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-3 text-left border-r border-gray-200
            ${activeField === 'location' ? 'bg-gray-50' : ''}
            hover:bg-gray-50 transition-colors rounded-l-full
            ${isHomepage ? 'min-w-[200px]' : 'min-w-[150px]'}
          `}
        >
          <div className="text-xs font-semibold text-gray-800 mb-0.5">Where</div>
          <div className="text-sm text-gray-500 truncate">
            {location || 'Search destinations'}
          </div>
        </button>

        {/* Check-in */}
        <button
          onClick={() => {
            setActiveField('checkIn');
            setShowDateMenu(true);
            setShowLocationMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-3 text-left border-r border-gray-200
            ${activeField === 'checkIn' ? 'bg-gray-50' : ''}
            hover:bg-gray-50 transition-colors
            ${isHomepage ? 'min-w-[150px]' : 'min-w-[120px]'}
          `}
        >
          <div className="text-xs font-semibold text-gray-800 mb-0.5">Check in</div>
          <div className="text-sm text-gray-500">
            {checkIn ? format(checkIn, 'MMM dd') : 'Add dates'}
          </div>
        </button>

        {/* Check-out */}
        <button
          onClick={() => {
            setActiveField('checkOut');
            setShowDateMenu(true);
            setShowLocationMenu(false);
            setShowGuestsMenu(false);
          }}
          className={`
            flex-1 px-6 py-3 text-left border-r border-gray-200
            ${activeField === 'checkOut' ? 'bg-gray-50' : ''}
            hover:bg-gray-50 transition-colors
            ${isHomepage ? 'min-w-[150px]' : 'min-w-[120px]'}
          `}
        >
          <div className="text-xs font-semibold text-gray-800 mb-0.5">Check out</div>
          <div className="text-sm text-gray-500">
            {checkOut ? format(checkOut, 'MMM dd') : 'Add dates'}
          </div>
        </button>

        {/* Guests */}
        <button
          onClick={() => {
            setActiveField('guests');
            setShowGuestsMenu(true);
            setShowLocationMenu(false);
            setShowDateMenu(false);
          }}
          className={`
            flex-1 px-6 py-3 text-left
            ${activeField === 'guests' ? 'bg-gray-50' : ''}
            hover:bg-gray-50 transition-colors rounded-r-full
            ${isHomepage ? 'min-w-[150px]' : 'min-w-[120px]'}
          `}
        >
          <div className="text-xs font-semibold text-gray-800 mb-0.5">Who</div>
          <div className="text-sm text-gray-500">
            {guests} {guests === 1 ? 'guest' : 'guests'}
          </div>
        </button>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          className={`
            ml-2 rounded-full bg-heritage-gold hover:bg-heritage-gold-dark
            text-white transition-all
            ${isHomepage ? 'w-12 h-12' : 'w-10 h-10'}
            flex items-center justify-center
            shadow-sm hover:shadow-md
          `}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </motion.div>

      {/* Location Menu */}
      <AnimatePresence>
        {showLocationMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50"
          >
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Search destinations..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-heritage-gold"
              autoFocus
            />
            <div className="mt-4 space-y-2">
              <button
                onClick={() => {
                  setLocation('Kerala, India');
                  setShowLocationMenu(false);
                  setActiveField(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="font-medium text-gray-900">Kerala, India</div>
                <div className="text-sm text-gray-500">Popular destination</div>
              </button>
              <button
                onClick={() => {
                  setLocation('Tamil Nadu, India');
                  setShowLocationMenu(false);
                  setActiveField(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="font-medium text-gray-900">Tamil Nadu, India</div>
                <div className="text-sm text-gray-500">Popular destination</div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date Menu */}
      <AnimatePresence>
        {showDateMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50"
          >
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guests Menu */}
      <AnimatePresence>
        {showGuestsMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Adults</div>
                  <div className="text-sm text-gray-500">Ages 13 or above</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-medium">{guests}</span>
                  <button
                    onClick={() => setGuests(guests + 1)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-gray-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowGuestsMenu(false);
                  setActiveField(null);
                }}
                className="w-full py-2 text-sm font-semibold text-heritage-gold hover:bg-heritage-gold/10 rounded-lg"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {(showLocationMenu || showDateMenu || showGuestsMenu) && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => {
            setShowLocationMenu(false);
            setShowDateMenu(false);
            setShowGuestsMenu(false);
            setActiveField(null);
          }}
        />
      )}
    </div>
  );
}

