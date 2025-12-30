'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProviderWelcomeMessage, hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface Hotel {
  _id: string;
  name: string;
  location: {
    district: string;
    state: string;
    country: string;
  };
  totalRooms: number;
  roomsAvailable: number;
  pricePerNight: number;
  rating: number;
  ratingCount: number;
  images: Array<{ url: string; isMain: boolean }>;
}

interface Booking {
  _id: string;
  tripId: string;
  hotel: Hotel;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  status: string;
  totalPrice: number;
  rooms: number;
}

interface DashboardStats {
  totalHotels: number;
  totalBookings: number;
  activeBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export default function HotelOwnerDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalHotels: 0,
    totalBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'hotels' | 'bookings'>('overview');

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
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch hotels owned by this provider using the new endpoint
      const hotelsResponse = await api.get('/hotels/owner/my-hotels');
      const myHotels = hotelsResponse.data.hotels || [];
      setHotels(myHotels);

      // Fetch bookings for these hotels
      await fetchBookings(myHotels.map((h: Hotel) => h._id));

      // Calculate stats
      calculateStats(myHotels);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      // Clean up error message to prevent concatenation issues
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (hotelIds: string[]) => {
    try {
      // Use the new bookings endpoint
      const bookingsResponse = await api.get('/hotels/owner/bookings');
      const hotelBookings = bookingsResponse.data.bookings || [];
      setBookings(hotelBookings);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      // Fallback to old method if new endpoint fails
      try {
        const tripsResponse = await api.get('/trips');
        const allTrips = tripsResponse.data.trips || [];
        
        const hotelBookings: Booking[] = [];
        allTrips.forEach((trip: any) => {
          if (trip.schedule) {
            trip.schedule.forEach((day: any) => {
              if (day.hotel && hotelIds.includes(day.hotel.toString())) {
                const hotel = hotels.find(h => h._id === day.hotel.toString());
                if (hotel) {
                  hotelBookings.push({
                    _id: `${trip._id}-${day.date}`,
                    tripId: trip._id,
                    hotel: hotel,
                    checkIn: day.date,
                    checkOut: trip.toDate,
                    guestName: trip.user?.name || 'Guest',
                    guestEmail: trip.user?.email || '',
                    guestPhone: trip.user?.phoneNumber || '',
                    status: trip.paymentStatus === 'Completed' ? 'confirmed' : 'pending',
                    totalPrice: hotel.pricePerNight,
                    rooms: 1
                  });
                }
              }
            });
          }
        });
        
        setBookings(hotelBookings);
      } catch (fallbackErr: any) {
        console.error('Error with fallback booking fetch:', fallbackErr);
      }
    }
  };

  const calculateStats = (hotelsList: Hotel[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalHotels = hotelsList.length;
    const totalBookings = bookings.length;
    
    const activeBookings = bookings.filter(b => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return checkIn <= now && checkOut >= now && b.status === 'confirmed';
    }).length;

    const upcomingBookings = bookings.filter(b => {
      const checkIn = new Date(b.checkIn);
      return checkIn > now && b.status === 'confirmed';
    }).length;

    const totalRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const monthlyRevenue = bookings
      .filter(b => {
        const checkIn = new Date(b.checkIn);
        return checkIn.getMonth() === currentMonth && 
               checkIn.getFullYear() === currentYear &&
               b.status === 'confirmed';
      })
      .reduce((sum, b) => sum + b.totalPrice, 0);

    const allRatings = hotelsList.flatMap(h => 
      Array(h.ratingCount).fill(h.rating)
    );
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    const totalReviews = hotelsList.reduce((sum, h) => sum + h.ratingCount, 0);

    setStats({
      totalHotels,
      totalBookings,
      activeBookings,
      upcomingBookings,
      totalRevenue,
      monthlyRevenue,
      averageRating,
      totalReviews
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading your dashboard...</div>
                <p className="text-sm text-gray-500 mt-2">Please wait</p>
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
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2 tracking-tight">
                Welcome back, <span className="text-primary-600">{host?.name || 'Hotel Owner'}</span>! 🏨
              </h1>
              <p className="text-lg text-gray-600">
                {getProviderWelcomeMessage('ACCOMMODATION_PROVIDER')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="badge-rating">
                <span>⭐</span>
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '5.0'} Rating
              </div>
              <button
                onClick={hostLogout}
                className="btn-secondary text-sm px-4 py-2"
              >
                Sign Out
              </button>
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
                aria-label="Close error"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Hotels Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl">🏨</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Hotels</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-blue-100 mb-1 font-medium">Total Properties</p>
                <p className="text-3xl font-bold">{stats.totalHotels}</p>
              </div>
              <Link 
                href="/provider/hotels/manage" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                Manage
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </div>

          {/* Bookings Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Bookings</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-green-100 mb-1 font-medium">Total Reservations</p>
                <p className="text-3xl font-bold">{stats.totalBookings}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-green-100">{stats.activeBookings} active</span>
                  <span className="text-green-100">{stats.upcomingBookings} upcoming</span>
                </div>
              </div>
              <Link 
                href="/provider/hotels/bookings" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          </div>

          {/* Revenue Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl">💰</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Revenue</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-purple-100 mb-1 font-medium">This Month</p>
                <p className="text-3xl font-bold">${stats.monthlyRevenue.toFixed(2)}</p>
                <p className="text-sm text-purple-100 mt-2">Total: ${stats.totalRevenue.toFixed(2)}</p>
              </div>
              <Link 
                href="/provider/hotels/revenue" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                View Details
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          </div>

          {/* Reviews Card */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-large p-6 text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl-soft">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-3xl">⭐</span>
                </div>
                <div className="text-white/80 text-sm font-medium">Reviews</div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-yellow-100 mb-1 font-medium">Average Rating</p>
                <p className="text-3xl font-bold">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '5.0'}</p>
                <p className="text-sm text-yellow-100 mt-2">{stats.totalReviews} total reviews</p>
              </div>
              <Link 
                href="/provider/hotels/reviews" 
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              >
                View Reviews
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link
            href="/provider/hotels/manage"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <span className="text-2xl">🏨</span>
              </div>
              <h3 className="heading-tertiary mb-0">Manage Hotels</h3>
            </div>
            <p className="text-gray-600 mb-4">View, edit, and manage all your hotel properties</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Manage Hotels
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/provider/hotels/add"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="heading-tertiary mb-0">Add New Hotel</h3>
            </div>
            <p className="text-gray-600 mb-4">List a new hotel property on the platform</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Add Hotel
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/provider/hotels/bookings"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="heading-tertiary mb-0">View Bookings</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage reservations and check-ins</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              View Bookings
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/provider/hotels/availability"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <span className="text-2xl">🛏️</span>
              </div>
              <h3 className="heading-tertiary mb-0">Room Availability</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage room availability calendar</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Manage Rooms
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/provider/hotels/reviews"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="heading-tertiary mb-0">Guest Reviews</h3>
            </div>
            <p className="text-gray-600 mb-4">View and respond to guest reviews</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              View Reviews
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/provider/hotels/revenue"
            className="group card-professional card-hover p-6 transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="heading-tertiary mb-0">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">View revenue analytics and insights</p>
            <div className="flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
              View Analytics
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Recent Bookings Section */}
        <div className="content-card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="heading-tertiary text-gray-900 mb-1">Recent Bookings</h2>
              <p className="text-sm text-gray-600">Latest hotel reservations</p>
            </div>
            <Link 
              href="/provider/hotels/bookings"
              className="text-primary-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
            >
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Bookings will appear here once guests make reservations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking._id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🏨</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {booking.hotel.name}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {booking.guestName}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ${booking.totalPrice.toFixed(2)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {booking.hotel.location.district}, {booking.hotel.location.state}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                        booking.status === 'confirmed' 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>
                        {booking.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Hotels Section */}
        <div className="content-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="heading-tertiary text-gray-900 mb-1">My Hotels</h2>
              <p className="text-sm text-gray-600">Manage your hotel properties</p>
            </div>
            <Link 
              href="/provider/hotels/manage"
              className="text-primary-600 font-semibold flex items-center gap-2 hover:gap-3 transition-all"
            >
              View All
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>

          {hotels.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                <span className="text-4xl">🏨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No hotels listed yet</h3>
              <p className="text-gray-600 mb-6">Start by adding your first hotel property</p>
              <Link 
                href="/provider/hotels/add" 
                className="btn-primary inline-flex items-center gap-2 shadow-medium hover:shadow-large transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Hotel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotels.slice(0, 6).map((hotel) => (
                <Link
                  key={hotel._id}
                  href={`/provider/hotels/${hotel._id}`}
                  className="group bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-medium transition-all duration-300 overflow-hidden"
                >
                  {hotel.images && hotel.images.length > 0 && (
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                      <img
                        src={hotel.images.find(img => img.isMain)?.url || hotel.images[0].url}
                        alt={hotel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {hotel.rating > 0 ? hotel.rating.toFixed(1) : '5.0'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {hotel.location.district}, {hotel.location.state}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Rooms Available</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {hotel.roomsAvailable} / {hotel.totalRooms}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Price per night</p>
                        <p className="text-lg font-bold text-primary-600">
                          ${hotel.pricePerNight.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
