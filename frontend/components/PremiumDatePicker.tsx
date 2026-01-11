'use client';

import { useState, useEffect, useRef } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface PremiumDatePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onDatesChange: (range: { from: Date | null; to: Date | null }) => void;
}

export default function PremiumDatePicker({ startDate, endDate, onDatesChange }: PremiumDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (range: any) => {
    if (!range) {
      onDatesChange({ from: null, to: null });
      return;
    }
    
    if (range.from && !range.to) {
      onDatesChange({ from: range.from, to: null });
    } else if (range.from && range.to) {
      onDatesChange({ from: range.from, to: range.to });
      setIsOpen(false);
    }
  };

  const getDuration = () => {
    if (startDate && endDate) {
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    return null;
  };

  return (
    <div className="relative">
      {/* Date Input Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative
            bg-white rounded-xl border-2 p-5
            text-left transition-all duration-300
            hover:border-charcoal-300 hover:shadow-lg
            ${startDate ? 'border-charcoal-300 shadow-md' : 'border-charcoal-200'}
            ${isOpen ? 'border-heritage-gold shadow-luxury-lg' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-charcoal-500 mb-2 uppercase tracking-wider">
                Check-in
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-charcoal-50 rounded-lg flex items-center justify-center group-hover:bg-heritage-gold/10 transition-colors">
                  <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  {startDate ? (
                    <>
                      <div className="text-lg font-semibold text-charcoal-900">
                        {format(startDate, 'MMM d')}
                      </div>
                      <div className="text-sm text-charcoal-500">
                        {format(startDate, 'EEEE, yyyy')}
                      </div>
                    </>
                  ) : (
                    <div className="text-base text-charcoal-400">Select date</div>
                  )}
                </div>
              </div>
            </div>
            {startDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDatesChange({ from: null, to: endDate });
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-charcoal-100 rounded"
              >
                <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            group relative
            bg-white rounded-xl border-2 p-5
            text-left transition-all duration-300
            hover:border-charcoal-300 hover:shadow-lg
            ${endDate ? 'border-charcoal-300 shadow-md' : 'border-charcoal-200'}
            ${isOpen ? 'border-heritage-gold shadow-luxury-lg' : ''}
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-charcoal-500 mb-2 uppercase tracking-wider">
                Check-out
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-charcoal-50 rounded-lg flex items-center justify-center group-hover:bg-heritage-gold/10 transition-colors">
                  <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  {endDate ? (
                    <>
                      <div className="text-lg font-semibold text-charcoal-900">
                        {format(endDate, 'MMM d')}
                      </div>
                      <div className="text-sm text-charcoal-500">
                        {format(endDate, 'EEEE, yyyy')}
                      </div>
                    </>
                  ) : (
                    <div className="text-base text-charcoal-400">Select date</div>
                  )}
                </div>
              </div>
            </div>
            {endDate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDatesChange({ from: startDate, to: null });
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-charcoal-100 rounded"
              >
                <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </button>
      </div>

      {/* Duration Display */}
      {getDuration() && (
        <div className="mb-6 flex items-center gap-3 bg-cream-50 border border-cream-200 rounded-xl px-5 py-3">
          <div className="w-8 h-8 bg-heritage-gold/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-medium text-charcoal-600">Trip Duration:</span>
            <span className="ml-2 text-base font-semibold text-charcoal-900">
              {getDuration()} {getDuration() === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Calendar Dropdown */}
      {isOpen && (
        <div 
          ref={pickerRef}
          className="fixed md:absolute z-50 mt-2 left-1/2 md:left-0 transform -translate-x-1/2 md:translate-x-0 bg-white rounded-2xl shadow-luxury-lg border border-charcoal-100 p-6 animate-fade-in max-w-[95vw] md:max-w-none"
        >
          <DayPicker
            mode="range"
            selected={{ from: startDate || undefined, to: endDate || undefined }}
            onSelect={handleSelect}
            disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1}
            className="rdp-calendar"
            classNames={{
              months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center mb-6',
              caption_label: 'text-lg font-semibold text-charcoal-900',
              nav: 'space-x-1 flex items-center',
              nav_button: 'h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-charcoal-50 rounded-lg transition-all cursor-pointer',
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex mb-3',
              head_cell: 'text-charcoal-500 rounded-md w-11 font-medium text-xs uppercase tracking-wider',
              row: 'flex w-full mt-2',
              cell: 'text-center text-sm p-0 relative',
              day: 'h-11 w-11 p-0 font-normal rounded-lg transition-all cursor-pointer hover:bg-charcoal-50',
              day_selected: 'bg-charcoal-700 text-white hover:bg-charcoal-800 hover:text-white focus:bg-charcoal-700 focus:text-white font-semibold',
              day_today: 'bg-heritage-gold/20 text-charcoal-900 font-semibold border-2 border-heritage-gold',
              day_outside: 'text-charcoal-300 opacity-50',
              day_disabled: 'text-charcoal-200 opacity-30 cursor-not-allowed',
              day_range_middle: 'bg-cream-100 text-charcoal-900',
              day_hidden: 'invisible',
            }}
            modifiersClassNames={{
              selected: 'bg-charcoal-700 text-white',
              range_start: 'bg-charcoal-700 text-white rounded-l-lg',
              range_end: 'bg-charcoal-700 text-white rounded-r-lg',
            }}
          />
          <div className="mt-4 pt-4 border-t border-charcoal-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-6 py-2.5 bg-charcoal-700 hover:bg-charcoal-800 text-white rounded-xl font-medium text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

