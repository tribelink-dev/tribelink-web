'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface Review {
  _id: string;
  user: {
    name: string;
    email: string;
  };
  rating: number;
  comment: string;
  date: string;
}

interface Hotel {
  _id: string;
  name: string;
  rating: number;
  ratingCount: number;
  reviews: Review[];
}

export default function ReviewsPage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'ACCOMMODATION_PROVIDER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      fetchHotels();
    }
  }, [router]);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new endpoint for owner's hotels
      const response = await api.get('/hotels/owner/my-hotels');
      const myHotels = response.data.hotels || [];

      // Fetch full details with reviews for each hotel
      const hotelsWithReviews = await Promise.all(
        myHotels.map(async (hotel: any) => {
          try {
            const hotelResponse = await api.get(`/hotels/${hotel._id}`);
            return hotelResponse.data.hotel;
          } catch (err) {
            return hotel;
          }
        })
      );
      
      setHotels(hotelsWithReviews);
    } catch (err: any) {
      console.error('Error fetching hotels:', err);
      setError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const getAllReviews = () => {
    let reviews: Array<Review & { hotelName: string; hotelId: string }> = [];

    hotels.forEach((hotel) => {
      if (selectedHotel === 'all' || selectedHotel === hotel._id) {
        hotel.reviews?.forEach((review) => {
          reviews.push({
            ...review,
            hotelName: hotel.name,
            hotelId: hotel._id
          });
        });
      }
    });

    // Apply rating filter
    if (filter !== 'all') {
      reviews = reviews.filter(r => r.rating === parseInt(filter));
    }

    // Sort by date (newest first)
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return reviews;
  };

  const getAverageRating = () => {
    const reviews = getAllReviews();
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  const getRatingDistribution = () => {
    const reviews = getAllReviews();
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      distribution[r.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const allReviews = getAllReviews();
  const averageRating = getAverageRating();
  const ratingDistribution = getRatingDistribution();

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading reviews...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Guest Reviews
              </h1>
              <p className="text-lg text-gray-600">View and manage guest reviews</p>
            </div>
            <Link
              href="/provider/hotels"
              className="btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {hotels.length > 0 && (
              <select
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"
              >
                <option value="all">All Hotels</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex gap-2">
              {['all', '5', '4', '3', '2', '1'].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setFilter(rating as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    filter === rating
                      ? 'bg-primary-600 text-white shadow-medium'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rating === 'all' ? 'All' : `${rating}⭐`}
                </button>
              ))}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert-error mb-6 animate-slide-down bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Error</p>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Average Rating</p>
                <p className="text-4xl font-bold">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
              </div>
              <span className="text-4xl">⭐</span>
            </div>
            {renderStars(Math.round(averageRating))}
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Reviews</p>
                <p className="text-4xl font-bold">{allReviews.length}</p>
              </div>
              <span className="text-4xl">📝</span>
            </div>
            <p className="text-blue-100 text-sm">Across {hotels.length} hotels</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm mb-1">5-Star Reviews</p>
                <p className="text-4xl font-bold">{ratingDistribution[5]}</p>
              </div>
              <span className="text-4xl">🌟</span>
            </div>
            <p className="text-green-100 text-sm">
              {allReviews.length > 0 
                ? `${Math.round((ratingDistribution[5] / allReviews.length) * 100)}% of total`
                : '0% of total'}
            </p>
          </div>
        </div>

        {/* Reviews List */}
        {allReviews.length === 0 ? (
          <div className="content-card">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <span className="text-4xl">⭐</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-8">
                Reviews will appear here once guests leave feedback
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {allReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">
                          {review.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{review.user.name}</h3>
                        <p className="text-sm text-gray-500">{review.user.email}</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {review.hotelName} • {new Date(review.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

