'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface GuidedTour {
  _id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: {
    state: string;
    district: string;
    country: string;
  };
  price: number;
  duration: number;
  maxParticipants: number;
  imageUrl?: string;
  rating?: number;
  ratingCount?: number;
  availableDates: Array<{
    date: string;
    startTime?: string;
    endTime?: string;
    available: boolean;
  }>;
  createdAt: string;
}

export default function GuidedToursPage() {
  const router = useRouter();
  const [tours, setTours] = useState<GuidedTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'GUIDE') {
        router.push('/provider/guides');
        return;
      }

      fetchTours();
    }
  }, [router]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      const response = await api.get('/hosts/guides/tours');
      setTours(response.data.tours || []);
    } catch (err: any) {
      console.error('Error fetching tours:', err);
      setError(err.response?.data?.message || 'Failed to load guided tours');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this guided tour?')) {
      return;
    }

    try {
      await api.delete(`/hosts/guides/tours/${tourId}`);
      setTours(prev => prev.filter(tour => tour._id !== tourId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete tour');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl font-black text-white">Loading Tours...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/provider/guides')}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">My Guided Tours</h1>
                <p className="text-emerald-200">Manage your custom guided tours</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/provider/guides/tours/new')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border-2 border-emerald-400 transition-all shadow-lg shadow-emerald-500/30"
            >
              + Create New Tour
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        {tours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl border border-emerald-500/30"
          >
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🗺️</span>
            </div>
            <h3 className="text-2xl font-black text-white mb-2">No Guided Tours Yet</h3>
            <p className="text-slate-400 mb-8">Create your first guided tour to get started</p>
            <button
              onClick={() => router.push('/provider/guides/tours/new')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl border-2 border-emerald-400 transition-all"
            >
              Create Your First Tour
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map((tour, index) => (
              <motion.div
                key={tour._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl overflow-hidden border-2 border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-emerald-600 to-teal-600 overflow-hidden">
                  {tour.imageUrl ? (
                    <img
                      src={tour.imageUrl}
                      alt={tour.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl">🗺️</span>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-blue-500/90 backdrop-blur-sm rounded-lg border border-blue-400">
                      <span className="text-xs font-bold text-white">GUIDED TOUR</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-black text-white mb-2 line-clamp-2">
                    {tour.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{tour.location.district}, {tour.location.state}</span>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                    {tour.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-white font-semibold">{(tour.rating || 0).toFixed(1)}</span>
                        <span className="text-slate-400 text-sm">({tour.ratingCount || 0})</span>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {tour.duration}h
                      </div>
                    </div>
                    <div className="text-emerald-400 font-bold">
                      ${tour.price}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/provider/guides/tours/${tour._id}/edit`)}
                      className="flex-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-semibold rounded-xl transition-all"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tour._id)}
                      className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-xl transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

