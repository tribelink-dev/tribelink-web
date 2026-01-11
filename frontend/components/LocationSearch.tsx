'use client';

import { useState, useRef, useEffect } from 'react';
import { INDIAN_STATES, DISTRICTS_BY_STATE, searchCity, POPULAR_DESTINATIONS, PopularDestination, CITY_TO_LOCATION } from '@/lib/indianStates';

interface LocationSearchProps {
  value: { state: string; district: string };
  onChange: (location: { state: string; district: string }) => void;
  onRemove?: () => void;
  index?: number;
  showRemove?: boolean;
  label?: string;
  autoFocus?: boolean;
}

export default function LocationSearch({
  value,
  onChange,
  onRemove,
  index = 0,
  showRemove = false,
  label,
  autoFocus = false
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPopular, setShowPopular] = useState(!value.state && !value.district);
  const [searchResults, setSearchResults] = useState<Array<{ city: string; state: string; district: string; displayName: string }>>([]);
  const [useManualSelect, setUseManualSelect] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchCity(searchQuery);
      setSearchResults(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleCitySelect = (city: string, state: string, district: string) => {
    onChange({ state, district });
    setSearchQuery(`${city}, ${state}`);
    setShowSuggestions(false);
    setShowPopular(false);
    setUseManualSelect(false);
  };

  const handlePopularSelect = (dest: PopularDestination) => {
    onChange({ state: dest.state, district: dest.district });
    setSearchQuery(`${dest.city}, ${dest.state}`);
    setShowPopular(false);
    setShowSuggestions(false);
  };

  const getDisplayValue = () => {
    if (value.state && value.district) {
      // Find city name if available
      const cityEntry = Object.entries(CITY_TO_LOCATION).find(
        ([_, loc]) => loc.state === value.state && loc.district === value.district
      );
      if (cityEntry) {
        return `${cityEntry[0]}, ${value.state}`;
      }
      return `${value.district}, ${value.state}`;
    }
    return searchQuery || '';
  };

  const availableDistricts = value.state ? (DISTRICTS_BY_STATE[value.state] || []) : [];

  return (
    <div className="space-y-4" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <label className="block text-sm font-semibold text-charcoal-700 mb-3 uppercase tracking-wide">
          {label || `Location ${index + 1}`} <span className="text-red-500">*</span>
        </label>
        
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            <svg className="w-5 h-5 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            ref={inputRef}
            type="text"
            value={getDisplayValue()}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) {
                onChange({ state: '', district: '' });
                setShowPopular(true);
              }
            }}
            onFocus={() => {
              if (!value.state && !value.district) {
                setShowPopular(true);
              }
              if (searchQuery.trim()) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Search by city name (e.g., Mumbai, Goa, Kerala)..."
            autoFocus={autoFocus}
            className="
              w-full pl-12 pr-4 py-3.5
              bg-white border-2 border-charcoal-200
              rounded-xl
              text-charcoal-900
              placeholder:text-charcoal-400
              font-medium
              focus:outline-none focus:ring-2 focus:ring-charcoal-500/20 focus:border-charcoal-500
              transition-all duration-300
              shadow-sm hover:shadow-md
            "
          />
          
          {value.state && value.district && (
            <button
              type="button"
              onClick={() => {
                onChange({ state: '', district: '' });
                setSearchQuery('');
                setShowPopular(true);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-charcoal-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4 text-charcoal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Autocomplete Suggestions */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-luxury-lg border border-charcoal-100 max-h-64 overflow-y-auto animate-fade-in">
            {searchResults.map((result, idx) => (
              <button
                key={`${result.state}-${result.district}-${idx}`}
                type="button"
                onClick={() => handleCitySelect(result.city, result.state, result.district)}
                className="
                  w-full px-4 py-3 text-left
                  hover:bg-charcoal-50
                  transition-colors duration-200
                  border-b border-charcoal-100 last:border-b-0
                  flex items-center gap-3
                "
              >
                <div className="w-8 h-8 bg-charcoal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-charcoal-900">{result.displayName}</div>
                  <div className="text-xs text-charcoal-500 truncate">{result.district}</div>
                </div>
                <svg className="w-4 h-4 text-charcoal-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showSuggestions && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-luxury-lg border border-charcoal-100 p-6 animate-fade-in">
            <div className="text-center">
              <p className="text-sm text-charcoal-600 mb-3">No results found for "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => setUseManualSelect(true)}
                className="text-sm font-medium text-charcoal-700 hover:text-charcoal-900 underline"
              >
                Select manually by state and district
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popular Destinations Quick Select */}
      {showPopular && !useManualSelect && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-charcoal-200"></div>
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">Or choose from popular destinations</span>
            <div className="h-px flex-1 bg-charcoal-200"></div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {POPULAR_DESTINATIONS.slice(0, 8).map((dest) => (
              <button
                key={`${dest.state}-${dest.district}`}
                type="button"
                onClick={() => handlePopularSelect(dest)}
                className="
                  group
                  bg-white border-2 border-charcoal-200
                  rounded-xl p-4
                  text-center
                  transition-all duration-300
                  hover:border-charcoal-300 hover:shadow-md
                  hover:scale-105
                "
              >
                <div className="text-2xl mb-2">{dest.icon}</div>
                <div className="font-semibold text-charcoal-900 text-sm mb-1">{dest.city}</div>
                <div className="text-xs text-charcoal-500">{dest.state}</div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setUseManualSelect(true)}
            className="mt-4 text-sm text-charcoal-600 hover:text-charcoal-900 font-medium underline"
          >
            Or select manually by state and district
          </button>
        </div>
      )}

      {/* Manual State/District Selection (Fallback) */}
      {(useManualSelect || (value.state && !value.district)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
          <div>
            <label className="block text-sm font-semibold text-charcoal-700 mb-3 uppercase tracking-wide">
              State/Province <span className="text-red-500">*</span>
            </label>
            <select
              value={value.state}
              onChange={(e) => {
                onChange({ state: e.target.value, district: '' });
                setShowPopular(false);
              }}
              required
              className="
                w-full px-4 py-3.5
                bg-white border-2 border-charcoal-200
                rounded-xl
                text-charcoal-900
                font-medium
                focus:outline-none focus:ring-2 focus:ring-charcoal-500/20 focus:border-charcoal-500
                transition-all duration-300
                shadow-sm hover:shadow-md
              "
            >
              <option value="">Select a state</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal-700 mb-3 uppercase tracking-wide">
              District/City <span className="text-red-500">*</span>
            </label>
            <select
              value={value.district}
              onChange={(e) => {
                onChange({ ...value, district: e.target.value });
                setShowPopular(false);
              }}
              required
              disabled={!value.state || availableDistricts.length === 0}
              className="
                w-full px-4 py-3.5
                bg-white border-2 border-charcoal-200
                rounded-xl
                text-charcoal-900
                font-medium
                focus:outline-none focus:ring-2 focus:ring-charcoal-500/20 focus:border-charcoal-500
                transition-all duration-300
                shadow-sm hover:shadow-md
                disabled:bg-charcoal-50 disabled:cursor-not-allowed disabled:border-charcoal-100 disabled:text-charcoal-400
              "
            >
              <option value="">
                {!value.state 
                  ? 'Select a state first' 
                  : availableDistricts.length === 0 
                  ? 'No districts available'
                  : 'Select a district/city'}
              </option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Selected Location Display */}
      {value.state && value.district && !useManualSelect && (
        <div className="flex items-center gap-3 bg-cream-50 border border-cream-200 rounded-xl px-5 py-3 animate-fade-in">
          <div className="w-10 h-10 bg-heritage-gold/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-heritage-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="font-semibold text-charcoal-900">{value.district}</div>
            <div className="text-sm text-charcoal-600">{value.state}</div>
          </div>
          {showRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

