'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import PremiumDatePicker from '@/components/PremiumDatePicker';
import LocationSearch from '@/components/LocationSearch';
import AuthPromptModal from '@/components/AuthPromptModal';

interface Location {
  state: string;
  district: string;
}

export default function AbodeTripSelectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuth();

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [locations, setLocations] = useState<Location[]>([{ state: '', district: '' }]);
  const [guests, setGuests] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const country = searchParams.get('country');

    if (from) setStartDate(new Date(from));
    if (to) setEndDate(new Date(to));

    // Restore locations from query params (state0, district0, state1, ...)
    const restored: Location[] = [];
    let idx = 0;
    while (true) {
      const state = searchParams.get(`state${idx}`);
      const district = searchParams.get(`district${idx}`) || '';
      if (!state) break;
      restored.push({ state, district });
      idx += 1;
    }
    if (restored.length) {
      setLocations(restored);
    }
  }, [searchParams]);

  const handleLocationChange = (index: number, location: Location) => {
    const updated = [...locations];
    updated[index] = location;
    setLocations(updated);
  };

  const addLocation = () => {
    const allFilled = locations.every((loc) => loc.state);
    if (allFilled && locations.length < 10) {
      setLocations([...locations, { state: '', district: '' }]);
    }
  };

  const removeLocation = (index: number) => {
    if (locations.length > 1) {
      setLocations(locations.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate) {
      setError('Please select travel dates');
      return;
    }
    if (endDate <= startDate) {
      setError('End date must be after start date');
      return;
    }

    const validLocations = locations.filter((loc) => loc.state);
    if (!validLocations.length) {
      setError('Please add at least one location with state');
      return;
    }

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    const fromDate = startDate.toISOString().split('T')[0];
    const toDate = endDate.toISOString().split('T')[0];

    const locationParams = validLocations
      .map(
        (loc, idx) =>
          `state${idx}=${encodeURIComponent(loc.state)}&district${idx}=${encodeURIComponent(
            loc.district || ''
          )}`
      )
      .join('&');

    router.push(
      `/trips/abodes/choose?country=India&from=${fromDate}&to=${toDate}&guests=${guests}&${locationParams}`
    );
  };

  const allLocationsFilled = locations.every((loc) => loc.state);
  const canAddLocation = allLocationsFilled && locations.length < 10;
  const hasEmptyLocations = locations.some((loc) => !loc.state);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="relative bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 overflow-hidden">
        <div className="section-container-luxury relative z-10 pt-32 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-8 px-5 py-2.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="text-sm font-medium text-white/90 tracking-wide">
                Trip Planner
              </span>
            </div>
            <h1 className="heading-display text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Plan with Abodes & Experiences
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-light mb-12 max-w-2xl mx-auto leading-relaxed">
              Choose your dates and regions, and we&apos;ll suggest a warm, locally grounded mix of stays and experiences as a starting point you can make your own.
            </p>
          </div>
        </div>
      </div>

      <div className="section-container-luxury -mt-16 relative z-20">
        <div className="max-w-4xl mx-auto">
          <div className="content-card shadow-luxury-lg border-charcoal-100/50 mb-8">
            {error && (
              <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-sm">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white rounded-2xl p-8 border border-charcoal-100/50 shadow-luxury">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-charcoal-100">
                  <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <label className="block text-xl font-semibold text-charcoal-900 mb-1">
                      Travel Dates
                    </label>
                    <p className="text-sm text-charcoal-600 font-light">
                      Select when you&apos;d like to stay with local hosts
                    </p>
                  </div>
                </div>
                <PremiumDatePicker
                  startDate={startDate}
                  endDate={endDate}
                  onDatesChange={({ from, to }) => {
                    setStartDate(from);
                    setEndDate(to);
                  }}
                />
              </div>

              <div className="bg-white rounded-2xl p-8 border border-charcoal-100/50 shadow-luxury space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-charcoal-100">
                  <div className="w-12 h-12 bg-charcoal-50 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-charcoal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M7 20h5v-2a3 3 0 00-5.356-1.857M7 10h.01M17 10h.01M12 6a4 4 0 11-8 0 4 4 0 018 0zm10 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xl font-semibold text-charcoal-900 mb-1">
                      Guests
                    </label>
                    <p className="text-sm text-charcoal-600 font-light">
                      We&apos;ll find abodes that can comfortably host your group
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.max(1, g - 1))}
                      className="w-9 h-9 rounded-full border border-charcoal-200 flex items-center justify-center text-charcoal-700 bg-white hover:bg-charcoal-50"
                    >
                      -
                    </button>
                    <span className="min-w-[2.5rem] text-center font-semibold text-charcoal-900">
                      {guests}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGuests((g) => Math.min(20, g + 1))}
                      className="w-9 h-9 rounded-full border border-charcoal-200 flex items-center justify-center text-charcoal-700 bg-white hover:bg-charcoal-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-charcoal-900">
                        Regions you&apos;d like to explore
                      </h2>
                      <p className="text-sm text-charcoal-600">
                        Add one or more states/districts to find abodes
                      </p>
                    </div>
                  </div>

                  {locations.map((location, index) => (
                    <div
                      key={index}
                      className="bg-cream-50/50 rounded-xl p-6 border-2 border-charcoal-100 hover:border-charcoal-200 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-charcoal-700 rounded-lg flex items-center justify-center text-white text-sm font-semibold">
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-charcoal-800">
                            Location {index + 1}
                          </span>
                        </div>
                        {locations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLocation(index)}
                            className="text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <LocationSearch
                        value={location}
                        onChange={(loc) => handleLocationChange(index, loc)}
                        index={index}
                        showRemove={false}
                      />
                    </div>
                  ))}

                  <div className="pt-2">
                    {hasEmptyLocations && (
                      <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        Complete current location details before adding another.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={addLocation}
                      disabled={!canAddLocation}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium flex items-center justify-center gap-2 ${
                        canAddLocation
                          ? 'bg-white border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50'
                          : 'bg-charcoal-50 border-charcoal-100 text-charcoal-400 cursor-not-allowed'
                      }`}
                    >
                      <span>+ Add Another Region</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-charcoal-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-charcoal-700 hover:bg-charcoal-800 text-white text-lg font-semibold py-4 rounded-xl shadow-luxury-lg flex items-center justify-center gap-3"
                >
                  {loading ? 'Finding abodes...' : 'Find Local Abodes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <AuthPromptModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={() => setAuthModalOpen(false)}
        onSignUp={() => setAuthModalOpen(false)}
        message="Sign in to plan your trip"
        returnTo={pathname || '/trips/abodes/select'}
      />
    </div>
  );
}

