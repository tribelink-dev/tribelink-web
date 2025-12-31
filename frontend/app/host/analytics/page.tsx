'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';

interface Booking {
  _id: string;
  ticketId: string;
  experienceDetails: {
    title: string;
    price: number;
  };
  status: string;
  createdAt: string;
  scheduledDate: string;
}

interface Experience {
  _id: string;
  title: string;
}

export default function HostAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = () => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch bookings
      const bookingsResponse = await api.get('/tickets/provider/verifications');
      const fetchedBookings = bookingsResponse.data.tickets || [];
      setBookings(fetchedBookings);

      // Fetch experiences
      const experiencesResponse = await api.get('/hosts/experiences');
      const fetchedExperiences = experiencesResponse.data.experiences || [];
      setExperiences(fetchedExperiences);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const totalBookings = bookings.length;
    const totalRevenue = bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.experienceDetails?.price || 0), 0);
    
    const activeBookings = bookings.filter(b => b.status === 'active').length;
    const verifiedBookings = bookings.filter(b => b.status === 'verified').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Bookings by month (last 6 months)
    const bookingsByMonthMap = new Map<string, { count: number; revenue: number }>();
    bookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!bookingsByMonthMap.has(monthKey)) {
        bookingsByMonthMap.set(monthKey, { count: 0, revenue: 0 });
      }
      const monthData = bookingsByMonthMap.get(monthKey)!;
      monthData.count++;
      if (booking.status !== 'cancelled') {
        monthData.revenue += booking.experienceDetails?.price || 0;
      }
    });

    const bookingsByMonth = Array.from(bookingsByMonthMap.entries())
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6);

    // Bookings by experience
    const bookingsByExperienceMap = new Map<string, { title: string; count: number; revenue: number }>();
    bookings.forEach(booking => {
      const expTitle = booking.experienceDetails?.title || 'Unknown';
      if (!bookingsByExperienceMap.has(expTitle)) {
        bookingsByExperienceMap.set(expTitle, { title: expTitle, count: 0, revenue: 0 });
      }
      const expData = bookingsByExperienceMap.get(expTitle)!;
      expData.count++;
      if (booking.status !== 'cancelled') {
        expData.revenue += booking.experienceDetails?.price || 0;
      }
    });

    const bookingsByExperience = Array.from(bookingsByExperienceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalBookings,
      totalRevenue,
      activeBookings,
      verifiedBookings,
      cancelledBookings,
      averageBookingValue,
      bookingsByMonth,
      bookingsByExperience
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-gray-700">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <div className="min-h-screen bg-gray-50">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                View your performance metrics and insights
              </p>
            </div>
            <button
              onClick={() => router.push('/host/dashboard')}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </button>
          </div>

          {error && (
            <div className="alert-error mb-6">
              <span className="text-lg">⚠️</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError('')} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-professional p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="text-sm text-blue-600 font-semibold mb-1">Total Bookings</div>
            <div className="text-3xl font-bold text-blue-900">{analytics.totalBookings}</div>
          </div>
          <div className="card-professional p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="text-sm text-green-600 font-semibold mb-1">Total Revenue</div>
            <div className="text-3xl font-bold text-green-900">${analytics.totalRevenue.toFixed(2)}</div>
          </div>
          <div className="card-professional p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="text-sm text-purple-600 font-semibold mb-1">Active Bookings</div>
            <div className="text-3xl font-bold text-purple-900">{analytics.activeBookings}</div>
          </div>
          <div className="card-professional p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="text-sm text-orange-600 font-semibold mb-1">Avg Booking Value</div>
            <div className="text-3xl font-bold text-orange-900">${analytics.averageBookingValue.toFixed(2)}</div>
          </div>
        </div>

        {/* Booking Status Breakdown */}
        <div className="content-card mb-8">
          <h2 className="heading-tertiary text-gray-900 mb-4">Booking Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="text-sm text-blue-600 font-semibold mb-1">Active</div>
              <div className="text-2xl font-bold text-blue-900">{analytics.activeBookings}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="text-sm text-green-600 font-semibold mb-1">Verified</div>
              <div className="text-2xl font-bold text-green-900">{analytics.verifiedBookings}</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="text-sm text-red-600 font-semibold mb-1">Cancelled</div>
              <div className="text-2xl font-bold text-red-900">{analytics.cancelledBookings}</div>
            </div>
          </div>
        </div>

        {/* Bookings by Month */}
        {analytics.bookingsByMonth.length > 0 && (
          <div className="content-card mb-8">
            <h2 className="heading-tertiary text-gray-900 mb-4">Bookings by Month (Last 6 Months)</h2>
            <div className="space-y-3">
              {analytics.bookingsByMonth.map((monthData) => (
                <div key={monthData.month} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-gray-900">{monthData.month}</div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Bookings</div>
                      <div className="text-lg font-bold text-gray-900">{monthData.count}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Revenue</div>
                      <div className="text-lg font-bold text-green-600">${monthData.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Experiences */}
        {analytics.bookingsByExperience.length > 0 && (
          <div className="content-card mb-8">
            <h2 className="heading-tertiary text-gray-900 mb-4">Top Performing Experiences</h2>
            <div className="space-y-3">
              {analytics.bookingsByExperience.map((expData, index) => (
                <div key={expData.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="font-semibold text-gray-900">{expData.title}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Bookings</div>
                      <div className="text-lg font-bold text-gray-900">{expData.count}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Revenue</div>
                      <div className="text-lg font-bold text-green-600">${expData.revenue.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {analytics.totalBookings === 0 && (
          <div className="content-card text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No data yet</h3>
            <p className="text-gray-600 mb-6">
              Start receiving bookings to see your analytics here!
            </p>
            <button
              onClick={() => router.push('/host/experiences/add')}
              className="btn-primary"
            >
              Create Your First Experience
            </button>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}

