'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LuxurySearchProps {
  className?: string;
  placeholder?: string;
}

export default function LuxurySearch({ 
  className = '', 
  placeholder = 'Search destinations, experiences, or cultural journeys...' 
}: LuxurySearchProps) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/trips/select?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className={`relative ${className}`}
    >
      <div 
        className={`
          relative flex items-center gap-4
          bg-white/95 backdrop-blur-xl
          border border-charcoal-200/50
          rounded-2xl
          px-6 py-4
          shadow-luxury
          transition-all duration-500
          ${focused 
            ? 'shadow-luxury-lg border-heritage-gold/30 scale-[1.02]' 
            : 'hover:shadow-luxury-lg hover:border-charcoal-300/50'
          }
        `}
      >
        <svg 
          className="w-5 h-5 text-charcoal-400 flex-shrink-0 transition-colors duration-300"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
          />
        </svg>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="
            flex-1 
            bg-transparent 
            border-none 
            outline-none 
            text-charcoal-700 
            placeholder:text-charcoal-400
            text-base
            font-light
            tracking-wide
          "
        />

        <button
          type="submit"
          className="
            px-6 py-2.5
            bg-charcoal-700
            hover:bg-charcoal-800
            text-white
            rounded-xl
            font-medium
            text-sm
            tracking-wide
            transition-all duration-300
            hover:shadow-lg
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          disabled={!query.trim()}
        >
          Search
        </button>
      </div>

      {/* Subtle glow effect when focused */}
      {focused && (
        <div className="absolute inset-0 bg-heritage-gold/5 rounded-2xl blur-xl -z-10 animate-pulse" />
      )}
    </form>
  );
}

