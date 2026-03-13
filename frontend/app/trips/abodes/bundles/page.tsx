'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import AbodeCard from '@/components/AbodeCard';

interface PlannerSegmentDay {
  date: string | Date;
  abodeId: string;
  segmentId: string | null;
  coreExperiences: any[];
  pureExperiences: any[];
}

interface PlannerSegment {
  segmentId: string | null;
  abode: any;
  fromDate: string;
  toDate: string;
  days: PlannerSegmentDay[];
}

export default function AbodeBundlesPage() {
  const searchParams = useSearchParams();

  const [segments, setSegments] = useState<PlannerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const guests = searchParams.get('guests') || '2';

  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? sessionStorage.getItem('abodePlannerSegments')
      : null;

    if (!stored) {
      setError('No abodes selected. Please go back and choose at least one abode.');
      setLoading(false);
      return;
    }

    let parsed: Array<{ segmentId: string; abodeId: string; fromDate: string; toDate: string }> =
      [];
    try {
      parsed = JSON.parse(stored);
    } catch (e) {
      setError('Your selection could not be read. Please restart the planner.');
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await api.post('/planner/abodes/preview', {
          segments: parsed,
        });
        setSegments(response.data.segments || []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message || 'Failed to build a day-wise plan around your abodes.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, []);

  return (
    <div className="min-h-screen bg-cream-50">
      <div className="relative bg-gradient-to-br from-charcoal-700 via-charcoal-800 to-charcoal-900 overflow-hidden">
        <div className="section-container-luxury relative z-10 pt-24 pb-16">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm font-medium text-white/70 mb-4">
              Step 3 of 3 · Your curated plan
            </p>
            <h1 className="heading-display text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              Home Base Plan by Day
            </h1>
            {from && to && (
              <p className="text-base md:text-lg text-white/80 max-w-2xl">
                Here&apos;s a first-draft suggestion for how your days could look between{' '}
                <span className="font-semibold">{from}</span> and{' '}
                <span className="font-semibold">{to}</span> for{' '}
                <span className="font-semibold">{guests}</span> guest
                {Number(guests) > 1 ? 's' : ''}, using your selected abodes as home bases and weaving in nearby experiences.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="section-container-luxury -mt-10 relative z-20 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="content-card shadow-luxury-lg border-charcoal-100/50">
            {error && (
              <div className="bg-red-50/80 border-2 border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
                {error}
              </div>
            )}

            {loading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-charcoal-200 border-t-charcoal-700 rounded-full animate-spin mb-4" />
                <p className="text-sm text-charcoal-600">
                  We&apos;re building a mindful day-by-day plan around your chosen abodes…
                </p>
              </div>
            ) : segments.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base text-charcoal-700 mb-2">
                  No plan could be built with the current selection.
                </p>
                <p className="text-sm text-charcoal-500">
                  Try going back to select abodes again, or adjust your dates.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {segments.map((segment, segIndex) => {
                  const abode = segment.abode;
                  const mainImage =
                    (abode.images || []).find((img: any) => img.isMain) ||
                    (abode.images || [])[0];
                  const imageUrl = mainImage ? mainImage.url : null;

                  return (
                    <div
                      key={segment.segmentId || segIndex}
                      className="border border-charcoal-100 rounded-3xl p-5 md:p-7 bg-white/90"
                    >
                      <div className="flex flex-col md:flex-row gap-6 mb-6">
                        <div className="md:w-1/3">
                          <AbodeCard abode={abode} imageUrl={imageUrl} index={0} />
                        </div>
                        <div className="md:flex-1 flex flex-col justify-center">
                          <p className="text-sm font-semibold text-charcoal-500 mb-1">
                            Home Base {segIndex + 1}
                          </p>
                          <h2 className="text-xl md:text-2xl font-bold text-charcoal-900 mb-2">
                            {abode.abodeDetails?.title || 'Abode'}
                          </h2>
                          <p className="text-sm text-charcoal-600 mb-1">
                            Stay from{' '}
                            <span className="font-semibold">
                              {segment.fromDate}
                            </span>{' '}
                            to{' '}
                            <span className="font-semibold">
                              {segment.toDate}
                            </span>
                          </p>
                          <p className="text-xs text-charcoal-500">
                            Each day below is anchored on this abode, with included experiences and
                            nearby standalone activities we&apos;ve picked to give the trip a human, unhurried rhythm.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {segment.days.map((day, dayIndex) => {
                          const dateLabel =
                            typeof day.date === 'string'
                              ? day.date
                              : (day.date as Date).toISOString().split('T')[0];

                          return (
                            <div
                              key={`${segment.segmentId || segIndex}-${dayIndex}`}
                              className="rounded-2xl border border-charcoal-100 bg-cream-50/80 p-4"
                            >
                              <p className="text-xs font-semibold text-charcoal-500 mb-1">
                                Day {dayIndex + 1}
                              </p>
                              <p className="text-sm font-semibold text-charcoal-800 mb-3">
                                {dateLabel}
                              </p>

                              <div className="mb-3">
                                <p className="text-xs font-semibold text-emerald-700 mb-1">
                                  Abode experiences
                                </p>
                                {day.coreExperiences && day.coreExperiences.length > 0 ? (
                                  <ul className="space-y-1">
                                    {day.coreExperiences.map((exp: any) => (
                                      <li
                                        key={exp._id}
                                        className="text-xs text-charcoal-800 bg-white/80 rounded-lg px-2 py-1"
                                      >
                                        {exp.title}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-charcoal-400">
                                    This day has no specific abode experiences yet.
                                  </p>
                                )}
                              </div>

                              <div>
                                <p className="text-xs font-semibold text-indigo-700 mb-1">
                                  Nearby standalone experiences
                                </p>
                                {day.pureExperiences && day.pureExperiences.length > 0 ? (
                                  <ul className="space-y-1">
                                    {day.pureExperiences.map((exp: any) => (
                                      <li
                                        key={exp._id}
                                        className="text-xs text-charcoal-800 bg-white/80 rounded-lg px-2 py-1"
                                      >
                                        {exp.title}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-charcoal-400">
                                    No additional experiences suggested yet.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className="pt-4 border-t border-charcoal-100 text-xs text-charcoal-500">
                  This is a high-level, non-timed plan—more like a local&apos;s suggestion than a rigid schedule—meant to gently maximize your exposure to abodes and experiences in each region.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

