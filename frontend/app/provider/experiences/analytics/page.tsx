'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Booking {
  _id: string;
  ticketId: string;
  experience: {
    _id: string;
    title: string;
  };
  experienceDetails: {
    title: string;
    price: number;
    duration: number;
    location: {
      district: string;
      state: string;
    };
  };
  scheduledDate: string;
  startTime: string;
  status: 'active' | 'verified' | 'cancelled' | 'expired';
  createdAt: string;
}

interface Experience {
  _id: string;
  title: string;
  price: number;
  averageRating: number;
  reviewCount: number;
}

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  activeBookings: number;
  verifiedBookings: number;
  cancelledBookings: number;
  averageBookingValue: number;
  bookingsByMonth: { month: string; count: number; revenue: number }[];
  bookingsByExperience: { experienceId: string; title: string; count: number; revenue: number }[];
  bookingsByStatus: { status: string; count: number }[];
  upcomingBookings: number;
  completedBookings: number;
  conversionRate: number;
}

export default function ExperienceAnalyticsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    // Check if user is logged in as host
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'EXPERIENCE_HOST') {
        router.push('/host/dashboard');
        return;
      }
    }
    fetchData();
  }, [router, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const bookingsResponse = await api.get('/tickets/provider/verifications');
      let allBookings = bookingsResponse.data.tickets || [];

      // Filter by date range
      if (dateRange !== 'all') {
        const now = new Date();
        const daysAgo = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        allBookings = allBookings.filter((b: Booking) => new Date(b.createdAt) >= cutoffDate);
      }

      setBookings(allBookings);

      // Fetch experiences
      const experiencesResponse = await api.get('/hosts/experiences');
      setExperiences(experiencesResponse.data.experiences || []);

      // Calculate analytics
      calculateAnalytics(allBookings, experiencesResponse.data.experiences || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (bookingsData: Booking[], experiencesData: Experience[]) => {
    const now = new Date();
    const totalBookings = bookingsData.length;
    const totalRevenue = bookingsData
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + (b.experienceDetails.price || 0), 0);
    
    const activeBookings = bookingsData.filter(b => b.status === 'active').length;
    const verifiedBookings = bookingsData.filter(b => b.status === 'verified').length;
    const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled').length;
    
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Bookings by month
    const bookingsByMonthMap = new Map<string, { count: number; revenue: number }>();
    bookingsData.forEach(booking => {
      const date = new Date(booking.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!bookingsByMonthMap.has(monthKey)) {
        bookingsByMonthMap.set(monthKey, { count: 0, revenue: 0 });
      }
      const monthData = bookingsByMonthMap.get(monthKey)!;
      monthData.count++;
      if (booking.status !== 'cancelled') {
        monthData.revenue += booking.experienceDetails.price || 0;
      }
    });

    const bookingsByMonth = Array.from(bookingsByMonthMap.entries())
      .map(([key, data]) => ({
        month: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count: data.count,
        revenue: data.revenue
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-6); // Last 6 months

    // Bookings by experience
    const bookingsByExperienceMap = new Map<string, { title: string; count: number; revenue: number }>();
    bookingsData.forEach(booking => {
      const expId = booking.experience?._id || booking.experienceDetails.title;
      if (!bookingsByExperienceMap.has(expId)) {
        bookingsByExperienceMap.set(expId, {
          title: booking.experienceDetails.title,
          count: 0,
          revenue: 0
        });
      }
      const expData = bookingsByExperienceMap.get(expId)!;
      expData.count++;
      if (booking.status !== 'cancelled') {
        expData.revenue += booking.experienceDetails.price || 0;
      }
    });

    const bookingsByExperience = Array.from(bookingsByExperienceMap.entries())
      .map(([experienceId, data]) => ({ experienceId, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10

    // Bookings by status
    const bookingsByStatus = [
      { status: 'Active', count: activeBookings },
      { status: 'Verified', count: verifiedBookings },
      { status: 'Cancelled', count: cancelledBookings },
      { status: 'Expired', count: bookingsData.filter(b => b.status === 'expired').length }
    ];

    // Upcoming vs completed
    const upcomingBookings = bookingsData.filter(b => {
      const scheduledDate = new Date(b.scheduledDate);
      return scheduledDate >= now && b.status === 'active';
    }).length;

    const completedBookings = verifiedBookings;

    // Conversion rate (verified / total)
    const conversionRate = totalBookings > 0 
      ? (verifiedBookings / totalBookings) * 100 
      : 0;

    setAnalytics({
      totalBookings,
      totalRevenue,
      activeBookings,
      verifiedBookings,
      cancelledBookings,
      averageBookingValue,
      bookingsByMonth,
      bookingsByExperience,
      bookingsByStatus,
      upcomingBookings,
      completedBookings,
      conversionRate
    });
  };

  const getMaxValue = (data: { count: number }[] | { revenue: number }[]) => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => ('count' in d ? d.count : d.revenue)), 1);
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                Track your performance and booking metrics
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
              <button
                onClick={() => router.push('/provider/experiences')}
                className="btn-secondary"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
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

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-professional p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <div className="text-sm text-blue-100 mb-2">Total Revenue</div>
                <div className="text-3xl font-bold mb-1">${analytics.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-blue-100">
                  {analytics.totalBookings} {analytics.totalBookings === 1 ? 'booking' : 'bookings'}
                </div>
              </div>
              <div className="card-professional p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                <div className="text-sm text-green-100 mb-2">Active Bookings</div>
                <div className="text-3xl font-bold mb-1">{analytics.activeBookings}</div>
                <div className="text-sm text-green-100">
                  {analytics.upcomingBookings} upcoming
                </div>
              </div>
              <div className="card-professional p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <div className="text-sm text-purple-100 mb-2">Completed</div>
                <div className="text-3xl font-bold mb-1">{analytics.completedBookings}</div>
                <div className="text-sm text-purple-100">
                  {analytics.conversionRate.toFixed(1)}% conversion rate
                </div>
              </div>
              <div className="card-professional p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <div className="text-sm text-orange-100 mb-2">Avg Booking Value</div>
                <div className="text-3xl font-bold mb-1">${analytics.averageBookingValue.toFixed(2)}</div>
                <div className="text-sm text-orange-100">
                  Per booking
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Bookings by Month */}
              <div className="content-card">
                <h3 className="heading-tertiary text-gray-900 mb-4">Bookings Over Time</h3>
                {analytics.bookingsByMonth.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.bookingsByMonth.map((item, index) => {
                      const maxCount = getMaxValue(analytics.bookingsByMonth);
                      const percentage = (item.count / maxCount) * 100;
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">{item.month}</span>
                            <span className="text-sm text-gray-600">
                              {item.count} bookings • ${item.revenue.toFixed(2)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No bookings data available
                  </div>
                )}
              </div>

              {/* Bookings by Status */}
              <div className="content-card">
                <h3 className="heading-tertiary text-gray-900 mb-4">Bookings by Status</h3>
                {analytics.bookingsByStatus.some(s => s.count > 0) ? (
                  <div className="space-y-4">
                    {analytics.bookingsByStatus.map((item, index) => {
                      const total = analytics.bookingsByStatus.reduce((sum, s) => sum + s.count, 0);
                      const percentage = total > 0 ? (item.count / total) * 100 : 0;
                      const colors = {
                        'Active': 'bg-blue-500',
                        'Verified': 'bg-green-500',
                        'Cancelled': 'bg-red-500',
                        'Expired': 'bg-gray-500'
                      };
                      return (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-gray-700">{item.status}</span>
                            <span className="text-sm text-gray-600">
                              {item.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className={`${colors[item.status as keyof typeof colors] || 'bg-gray-500'} h-3 rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No status data available
                  </div>
                )}
              </div>
            </div>

            {/* Top Experiences */}
            <div className="content-card mb-8">
              <h3 className="heading-tertiary text-gray-900 mb-4">Top Performing Experiences</h3>
              {analytics.bookingsByExperience.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Experience</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Bookings</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Revenue</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bookingsByExperience.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{item.title}</div>
                          </td>
                          <td className="py-3 px-4 text-right text-gray-700">{item.count}</td>
                          <td className="py-3 px-4 text-right font-semibold text-primary-600">
                            ${item.revenue.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600">
                            ${(item.revenue / item.count).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No experience data available
                </div>
              )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="content-card">
                <div className="text-sm text-gray-600 mb-2">Total Experiences</div>
                <div className="text-3xl font-bold text-gray-900">{experiences.length}</div>
              </div>
              <div className="content-card">
                <div className="text-sm text-gray-600 mb-2">Cancellation Rate</div>
                <div className="text-3xl font-bold text-gray-900">
                  {analytics.totalBookings > 0 
                    ? ((analytics.cancelledBookings / analytics.totalBookings) * 100).toFixed(1)
                    : '0.0'}%
                </div>
              </div>
              <div className="content-card">
                <div className="text-sm text-gray-600 mb-2">Average Rating</div>
                <div className="text-3xl font-bold text-gray-900">
                  {experiences.length > 0
                    ? (experiences.reduce((sum, e) => sum + (e.averageRating || 0), 0) / experiences.length).toFixed(1)
                    : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {experiences.reduce((sum, e) => sum + (e.reviewCount || 0), 0)} total reviews
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

