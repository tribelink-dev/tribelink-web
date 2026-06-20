'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AbodeCard from '@/components/AbodeCard';
import MobileStickyBar from '@/components/ui/MobileStickyBar';

interface PlannerAbodeResult {
  abode: any;
  coreExperiences: any[];
  addOnExperiences: any[];
  matchScore: number;
  availabilityCoverage: number;
  culturalScore: number;
}

export default function AbodePlannerChoosePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [results, setResults] = useState<PlannerAbodeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const guests = searchParams.get('guests') || '2';
  const country = searchParams.get('country') || 'India';
  const state0 = searchParams.get('state0') || '';
  const district0 = searchParams.get('district0') || '';

  useEffect(() => {
    const fetchAbodes = async () => {
      try {
        if (!from || !to || !state0) {
          setError('Missing dates or location for planner.');
          setLoading(false);
          return;
        }

        setLoading(true);
        setError('');

        const response = await api.get('/planner/abodes/search', {
          params: {
            country,
            state: state0,
            district: district0,
            fromDate: from,
            toDate: to,
            guests,
          },
        });

        setResults(response.data.abodes || []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Failed to load abodes for planner.');
      } finally {
        setLoading(false);
      }
    };

    fetchAbodes();
  }, [country, state0, district0, from, to, guests]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = () => {
    if (!from || !to) return;
    const segments = Array.from(selectedIds).map((abodeId, idx) => ({
      segmentId: `segment-${idx + 1}`,
      abodeId,
      fromDate: from,
      toDate: to,
    }));

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('abodePlannerSegments', JSON.stringify(segments));
    }

    router.push(
      `/trips/abodes/bundles?country=${encodeURIComponent(
        country
      )}&from=${from}&to=${to}&guests=${guests}`
    );
  };

  const isSelected = (id: string) => selectedIds.has(id);

  return (
    <div className={`min-h-screen bg-cream-50 page-offset-nav ${selectedIds.size > 0 ? 'pb-bottom-bar md:pb-0' : 'pb-8'}`}>
      <div className="relative bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 overflow-hidden">
        <div className="section-container-luxury relative z-10 pt-4 sm:pt-8 pb-12 sm:pb-16">
          <div className="w-full">
            <p className="text-sm font-medium text-white/70 mb-4">
              Step 2 of 3 · Choose your home bases
            </p>
            <h1 className="heading-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              Pick Local Abodes for Your Trip
            </h1>
            {from && to && (
              <p className="text-base md:text-lg text-white/80 max-w-2xl">
                We&apos;ve found local homes in {state0 || 'your chosen region'} between{' '}
                <span className="font-semibold">{from}</span> and{' '}
                <span className="font-semibold">{to}</span> for{' '}
                <span className="font-semibold">{guests}</span> guest
                {Number(guests) > 1 ? 's' : ''}.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="section-container-luxury -mt-10 relative z-20 pb-16">
        <div className="w-full">
          <div className="content-card shadow-luxury-lg border-charcoal-100/50">
            {error && (
              <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-charcoal-200 border-t-charcoal-700 rounded-full animate-spin mb-4" />
                <p className="text-sm text-charcoal-600">Finding the best local abodes for you…</p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base text-charcoal-700 mb-2">
                  No abodes found for this region and date range.
                </p>
                <p className="text-sm text-charcoal-500">
                  Try adjusting your dates or choosing another state.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm font-medium text-charcoal-600">
                      {results.length} abode{results.length > 1 ? 's' : ''} found
                    </p>
                    <p className="text-xs text-charcoal-500">
                      Sorted by cultural fit, availability, and rating.
                    </p>
                  </div>
                  <div className="text-sm text-charcoal-600">
                    Selected:{' '}
                    <span className="font-semibold">{selectedIds.size}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {results.map((item, index) => {
                    const abode = item.abode;
                    const mainImage =
                      (abode.images || []).find((img: any) => img.isMain) ||
                      (abode.images || [])[0];
                    const imageUrl = mainImage ? mainImage.url : null;

                    return (
                      <div
                        key={abode._id}
                        className={`relative rounded-3xl border-2 transition-all duration-300 ${
                          isSelected(abode._id)
                            ? 'border-heritage-gold/80 shadow-xl'
                            : 'border-transparent hover:border-charcoal-100 hover:shadow-md'
                        }`}
                      >
                        <AbodeCard
                          abode={abode}
                          imageUrl={imageUrl}
                          index={index}
                          onClick={() => toggleSelect(abode._id)}
                        />
                        <div className="absolute top-4 left-4 z-20">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/60 text-white backdrop-blur-sm">
                            Match {item.matchScore} / 100
                          </span>
                        </div>
                        {isSelected(abode._id) && (
                          <div className="absolute inset-0 rounded-3xl ring-2 ring-heritage-gold pointer-events-none" />
                        )}
                        {item.coreExperiences && item.coreExperiences.length > 0 && (
                          <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap gap-2">
                            {item.coreExperiences.slice(0, 3).map((exp: any) => (
                              <span
                                key={exp._id}
                                className="px-2 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-charcoal-800 shadow-sm"
                              >
                                {exp.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="hidden md:flex flex-col md:flex-row items-center justify-between gap-3 border-t border-charcoal-100 pt-4">
                  <p className="text-xs text-charcoal-500">
                    Tip: Select one or more abodes. We&apos;ll treat each as a home base and fill
                    your days with experiences around them.
                  </p>
                  <button
                    type="button"
                    disabled={selectedIds.size === 0}
                    onClick={handleContinue}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 touch-target ${
                      selectedIds.size === 0
                        ? 'bg-charcoal-100 text-charcoal-400 cursor-not-allowed'
                        : 'bg-charcoal-700 text-white hover:bg-charcoal-800'
                    }`}
                  >
                    Continue with {selectedIds.size || 'no'} abodes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <MobileStickyBar innerClassName="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-secondary">Selected abodes</p>
            <p className="font-bold text-text-primary">{selectedIds.size}</p>
          </div>
          <button
            type="button"
            onClick={handleContinue}
            className="shrink-0 px-5 py-3 bg-charcoal-700 text-white font-semibold rounded-xl touch-target"
          >
            Continue
          </button>
        </MobileStickyBar>
      )}
    </div>
  );
}

