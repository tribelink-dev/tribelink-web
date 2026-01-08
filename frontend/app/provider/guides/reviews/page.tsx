'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { hostLogout } from '@/lib/providerUtils';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  trip: {
    _id: string;
    fromDate: string;
    toDate: string;
    district: string;
    state: string;
  };
}

export default function GuideReviewsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

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
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchReviews(parsedHost._id);
    }
  }, [router]);

  const fetchReviews = async (guideId: string) => {
    try {
      setLoading(true);
      // For now, we'll use mock data since reviews API might not exist yet
      // In production, this would be: const response = await api.get(`/hosts/guides/${guideId}/reviews`);
      
      // Mock reviews data - replace with actual API call
      const mockReviews: Review[] = [];
      
      // Calculate stats from host data
      const averageRating = host?.rating || 0;
      const totalReviews = host?.ratingCount || 0;
      
      setStats({
        averageRating,
        totalReviews,
        ratingDistribution: {
          5: Math.floor(totalReviews * 0.6),
          4: Math.floor(totalReviews * 0.25),
          3: Math.floor(totalReviews * 0.1),
          2: Math.floor(totalReviews * 0.03),
          1: Math.floor(totalReviews * 0.02)
        }
      });
      
      setReviews(mockReviews);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReviews = () => {
    if (filter === 'all') return reviews;
    return reviews.filter(r => r.rating === parseInt(filter));
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <motion.span
        key={i}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: i * 0.1 }}
        className={`text-2xl ${i < rating ? 'text-yellow-400' : 'text-slate-600'}`}
      >
        ⭐
      </motion.span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-white text-lg font-semibold">Loading reviews...</p>
        </motion.div>
      </div>
    );
  }

  const filteredReviews = getFilteredReviews();
  const totalRatings = Object.values(stats.ratingDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-900 border-b-4 border-emerald-500/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/provider/guides')}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/20 hover:bg-white/20 transition-all"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              <div>
                <h1 className="text-4xl font-black text-white mb-2">Reviews</h1>
                <p className="text-emerald-200">Traveler feedback and ratings</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={hostLogout}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2 border-white/30 rounded-xl text-white font-semibold transition-all"
            >
              Sign Out
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rating Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 border-b border-emerald-400/30">
            <h2 className="text-xl font-black text-white">Rating Overview</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Average Rating */}
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-7xl font-black text-white mb-2"
                >
                  {stats.averageRating.toFixed(1)}
                </motion.div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
                <p className="text-slate-400 text-sm">Based on {stats.totalReviews} reviews</p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                  const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        <span className="text-sm font-semibold text-white">{rating}</span>
                        <span className="text-yellow-400">⭐</span>
                      </div>
                      <div className="flex-1 bg-slate-700/50 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: rating * 0.1 }}
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-6 mb-6"
        >
          <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1 w-fit">
            {(['all', '5', '4', '3', '2', '1'] as const).map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  filter === f
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {f === 'all' ? 'All' : `${f} Stars`}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-emerald-500/30 p-12 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              ⭐
            </motion.div>
            <h3 className="text-2xl font-black text-white mb-2">No reviews yet</h3>
            <p className="text-slate-400">Reviews from travelers will appear here once they rate your services.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-emerald-500/20 hover:border-emerald-400/50 p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-3xl">👤</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-black text-white mb-1">{review.user.name}</h3>
                        <p className="text-sm text-slate-400">
                          {format(new Date(review.trip.fromDate), 'MMM dd')} - {format(new Date(review.trip.toDate), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {review.trip.district}, {review.trip.state}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-slate-300 mt-3 leading-relaxed">{review.comment}</p>
                    <p className="text-xs text-slate-500 mt-3">
                      {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                    </p>
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

