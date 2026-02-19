'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Booking {
  _id: string;
  ticketId: string;
  type?: 'experience' | 'abode';
  experienceDetails?: {
    title: string;
    price: number;
    date?: string;
  };
  abodeStay?: {
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  };
  status: string;
  createdAt: string;
  scheduledDate?: string;
  totalAmount?: number;
  numberOfParticipants?: number;
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
  const [abodes, setAbodes] = useState<any[]>([]);
  const [abodeBookings, setAbodeBookings] = useState<any[]>([]);

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

      // Fetch experience bookings
      const bookingsResponse = await api.get('/tickets/provider/verifications').catch(() => ({ data: { tickets: [] } }));
      const fetchedBookings = bookingsResponse.data.tickets || [];
      
      // Fetch abodes
      const abodesResponse = await api.get('/abodes/owner/my-abodes').catch(() => ({ data: { abodes: [] } }));
      const fetchedAbodes = abodesResponse.data.abodes || [];
      setAbodes(fetchedAbodes);
      
      // Fetch abode bookings
      let allAbodeBookings: any[] = [];
      for (const abode of fetchedAbodes) {
        try {
          const abodeBookingsRes = await api.get(`/abodes/${abode._id}/bookings`, {
            params: { limit: 100 }
          }).catch(() => ({ data: { bookings: [] } }));
          allAbodeBookings = [...allAbodeBookings, ...(abodeBookingsRes.data.bookings || [])];
        } catch (err) {
          console.error(`Error fetching bookings for abode ${abode._id}:`, err);
        }
      }
      setAbodeBookings(allAbodeBookings);
      
      // Combine all bookings
      const combinedBookings = [
        ...fetchedBookings.map((b: any) => ({ ...b, type: 'experience' })),
        ...allAbodeBookings.map((b: any) => ({ ...b, type: 'abode' }))
      ];
      setBookings(combinedBookings);

      // Fetch experiences
      const experiencesResponse = await api.get('/hosts/experiences').catch(() => ({ data: { experiences: [] } }));
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
    
    // Calculate revenue from both experience and abode bookings
    const totalRevenue = bookings.reduce((sum, b) => {
      if (b.status === 'cancelled' || b.status === 'CANCELLED') return sum;
      if (b.type === 'experience') {
        return sum + (b.experienceDetails?.price || b.totalAmount || 0);
      } else {
        return sum + (b.totalAmount || 0);
      }
    }, 0);
    
    const activeBookings = bookings.filter(b => 
      b.status === 'active' || b.status === 'ACTIVE' || b.status === 'verified' || b.status === 'CONFIRMED'
    ).length;
    const verifiedBookings = bookings.filter(b => 
      b.status === 'verified' || b.status === 'CONFIRMED' || b.status === 'completed' || b.status === 'COMPLETED'
    ).length;
    const pendingBookings = bookings.filter(b => 
      b.status === 'pending' || b.status === 'PENDING' || b.status === 'unverified'
    ).length;
    const cancelledBookings = bookings.filter(b => 
      b.status === 'cancelled' || b.status === 'CANCELLED'
    ).length;
    
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Bookings by month (last 6 months) - combined experience and abode bookings
    const now = new Date();
    const monthlyData: { [key: string]: { revenue: number; bookings: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[monthKey] = { revenue: 0, bookings: 0 };
    }
    
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthKey = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (monthlyData[monthKey]) {
        if (booking.status !== 'cancelled' && booking.status !== 'CANCELLED') {
          const amount = booking.type === 'experience' 
            ? (booking.experienceDetails?.price || booking.totalAmount || 0)
            : (booking.totalAmount || 0);
          monthlyData[monthKey].revenue += amount;
        }
        monthlyData[monthKey].bookings += 1;
      }
    });

    const bookingsByMonth = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      bookings: data.bookings
    }));

    // Booking status distribution
    const statusData = [
      { name: 'Verified/Completed', value: verifiedBookings, color: '#10b981' },
      { name: 'Pending', value: pendingBookings, color: '#f59e0b' },
      { name: 'Cancelled', value: cancelledBookings, color: '#ef4444' }
    ].filter(item => item.value > 0);

    // Bookings by experience (top 5)
    const bookingsByExperienceMap = new Map<string, { title: string; count: number; revenue: number }>();
    bookings.forEach(booking => {
      if (booking.type === 'experience') {
      const expTitle = booking.experienceDetails?.title || 'Unknown';
      if (!bookingsByExperienceMap.has(expTitle)) {
        bookingsByExperienceMap.set(expTitle, { title: expTitle, count: 0, revenue: 0 });
      }
      const expData = bookingsByExperienceMap.get(expTitle)!;
      expData.count++;
        if (booking.status !== 'cancelled' && booking.status !== 'CANCELLED') {
          expData.revenue += booking.experienceDetails?.price || booking.totalAmount || 0;
        }
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
      pendingBookings,
      cancelledBookings,
      averageBookingValue,
      bookingsByMonth,
      bookingsByExperience,
      statusData
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
        <HostSidebar />
        <div className="lg:ml-72 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
            <div className="text-xl font-medium text-gray-700">Loading analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  const analytics = calculateAnalytics();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
        {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600">
                View your performance metrics and insights
              </p>
            </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/host/dashboard')}
                  className="px-6 py-3 bg-white text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm border border-gray-200"
            >
              ← Back to Dashboard
                </motion.button>
          </div>

          {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
              <span className="text-lg">⚠️</span>
                  <span className="flex-1 text-red-700">{error}</span>
                  <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                ✕
              </button>
            </div>
          )}
            </motion.div>

        {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
            <div className="text-sm text-blue-600 font-semibold mb-1">Total Bookings</div>
            <div className="text-3xl font-bold text-blue-900">{analytics.totalBookings}</div>
          </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
            <div className="text-sm text-green-600 font-semibold mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-green-900">₹{analytics.totalRevenue.toLocaleString()}</div>
          </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200">
            <div className="text-sm text-purple-600 font-semibold mb-1">Active Bookings</div>
            <div className="text-3xl font-bold text-purple-900">{analytics.activeBookings}</div>
          </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
            <div className="text-sm text-orange-600 font-semibold mb-1">Avg Booking Value</div>
                <div className="text-3xl font-bold text-orange-900">₹{Math.round(analytics.averageBookingValue).toLocaleString()}</div>
          </div>
            </motion.div>

            {/* Charts Section */}
            {analytics.totalBookings > 0 ? (
              <div className="space-y-6 mb-8">
                {/* Revenue & Bookings Trend - Line Chart */}
        {analytics.bookingsByMonth.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue & Bookings Trend</h3>
                      <p className="text-xs text-gray-500">Last 6 months performance</p>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={analytics.bookingsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="month"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis
                          yAxisId="left"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tick={{ fill: '#6b7280' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          tick={{ fill: '#6b7280' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(value: any) => {
                            if (typeof value === 'number') {
                              return value < 1000 ? value : `₹${value.toLocaleString()}`;
                            }
                            return value;
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          dot={{ fill: '#6366f1', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Revenue (₹)"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="bookings"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                          name="Bookings"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Status Distribution - Pie Chart */}
                  {analytics.statusData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Booking Status</h3>
                        <p className="text-xs text-gray-500">Distribution overview</p>
                    </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie
                            data={analytics.statusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {analytics.statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 flex flex-wrap gap-4 justify-center">
                        {analytics.statusData.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-xs text-gray-600 font-medium">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
                    </motion.div>
        )}

                  {/* Monthly Bookings - Bar Chart */}
                  {analytics.bookingsByMonth.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly Bookings</h3>
                        <p className="text-xs text-gray-500">Booking volume trend</p>
                      </div>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={analytics.bookingsByMonth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis
                            dataKey="month"
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tick={{ fill: '#6b7280' }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            style={{ fontSize: '12px' }}
                            tick={{ fill: '#6b7280' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar
                            dataKey="bookings"
                            fill="#10b981"
                            radius={[8, 8, 0, 0]}
                            name="Bookings"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}
                </div>

        {/* Top Experiences */}
        {analytics.bookingsByExperience.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                  >
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Top Performing Experiences</h3>
            <div className="space-y-3">
              {analytics.bookingsByExperience.map((expData, index) => (
                <div key={expData.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
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
                              <div className="text-lg font-bold text-green-600">₹{expData.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
                  </motion.div>
                )}
          </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center"
              >
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No data yet</h3>
            <p className="text-gray-600 mb-6">
              Start receiving bookings to see your analytics here!
            </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/host/dashboard')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-xl transition-all shadow-lg"
            >
                  Go to Dashboard
                </motion.button>
              </motion.div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
