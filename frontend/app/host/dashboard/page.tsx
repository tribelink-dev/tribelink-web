'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import HostSidebar from '@/components/HostSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { SkeletonStats } from '@/components/SkeletonLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  DollarSign, 
  Clock, 
  Calendar,
  Star, 
  MapPin,
  Users,
  ArrowRight,
  Award,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Activity,
  Ticket
} from 'lucide-react';
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

export default function HostDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [stats, setStats] = useState({
    experiences: 0,
    bookings: 0,
    revenue: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    upcomingBookings: 0,
    averageBookingValue: 0,
    monthlyRevenue: 0,
    totalParticipants: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      setHost(JSON.parse(hostData));
      setLoading(false);
      fetchStats();
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch experiences
      const experiencesRes = await api.get('/hosts/experiences').catch(() => ({ data: { experiences: [] } }));
      const fetchedExperiences = experiencesRes.data.experiences || [];
      setExperiences(fetchedExperiences);
      
      // Fetch bookings/tickets
      let bookings: any[] = [];
      let totalRevenue = 0;
      let pendingCount = 0;
      let completedCount = 0;
      let cancelledCount = 0;
      let upcomingCount = 0;
      let monthlyRevenue = 0;
      let totalParticipants = 0;
      let averageBookingValue = 0;
      
      try {
        const bookingsRes = await api.get('/tickets/provider/verifications').catch(() => ({ data: { tickets: [] } }));
        bookings = bookingsRes.data.tickets || [];
        
        // Calculate comprehensive statistics
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        bookings.forEach((booking: any) => {
          const bookingDate = new Date(booking.createdAt);
          const experienceDate = booking.experienceDetails?.date ? new Date(booking.experienceDetails.date) : null;
          const bookingAmount = booking.experienceDetails?.price || booking.totalAmount || 0;
          const participants = booking.numberOfParticipants || booking.participants || 1;
          
          // Revenue calculations
          if (booking.status === 'verified' || booking.status === 'completed') {
            totalRevenue += bookingAmount;
            
            // Monthly revenue (current month)
            if (bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear) {
              monthlyRevenue += bookingAmount;
            }
          }
          
          // Status counts
          if (booking.status === 'pending' || booking.status === 'unverified') {
            pendingCount++;
          } else if (booking.status === 'verified' || booking.status === 'completed') {
            completedCount++;
            totalParticipants += participants;
          } else if (booking.status === 'cancelled') {
            cancelledCount++;
          }
          
          // Upcoming bookings
          if ((booking.status === 'verified' || booking.status === 'pending') && experienceDate && experienceDate > now) {
            upcomingCount++;
          }
        });
        
        // Calculate averages
        const confirmedOrCompleted = bookings.filter((b: any) => 
          b.status === 'verified' || b.status === 'completed'
        );
        averageBookingValue = confirmedOrCompleted.length > 0
          ? totalRevenue / confirmedOrCompleted.length
          : 0;
        
        // Prepare chart data - Revenue over last 6 months
        const monthlyData: { [key: string]: { revenue: number; bookings: number } } = {};
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          monthlyData[monthKey] = { revenue: 0, bookings: 0 };
        }
        
        bookings.forEach((booking: any) => {
          const bookingDate = new Date(booking.createdAt);
          const monthKey = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (monthlyData[monthKey]) {
            if (booking.status === 'verified' || booking.status === 'completed') {
              monthlyData[monthKey].revenue += booking.experienceDetails?.price || booking.totalAmount || 0;
            }
            monthlyData[monthKey].bookings += 1;
          }
        });
        
        const monthlyChartData = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          revenue: data.revenue,
          bookings: data.bookings
        }));
        
        setMonthlyRevenueData(monthlyChartData);
        
        // Prepare booking status distribution data
        const statusData = [
          { name: 'Verified', value: completedCount, color: '#10b981' },
          { name: 'Pending', value: pendingCount, color: '#f59e0b' },
          { name: 'Cancelled', value: cancelledCount, color: '#ef4444' }
        ].filter(item => item.value > 0);
        
        setChartData(statusData);
        setRecentBookings(bookings.slice(0, 5));
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
      
      // Calculate average rating from experiences
      const totalRating = fetchedExperiences.reduce((sum: number, exp: any) => sum + (exp.averageRating || 0), 0);
      const totalReviewCount = fetchedExperiences.reduce((sum: number, exp: any) => sum + (exp.reviewCount || 0), 0);
      const averageRating = fetchedExperiences.length > 0 ? totalRating / fetchedExperiences.length : 0;
      
      setStats({
        experiences: fetchedExperiences.length,
        bookings: bookings.length,
        revenue: monthlyRevenue,
        pendingBookings: pendingCount,
        totalRevenue: totalRevenue,
        averageRating: averageRating,
        totalReviews: totalReviewCount,
        completedBookings: completedCount,
        cancelledBookings: cancelledCount,
        upcomingBookings: upcomingCount,
        averageBookingValue: averageBookingValue,
        monthlyRevenue: monthlyRevenue,
        totalParticipants: totalParticipants
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setStatsLoading(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'pending':
      case 'unverified':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'pending':
      case 'unverified':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-slate-900">Loading your experience dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <HostSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-8 md:p-12 shadow-2xl">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                          <Activity className="w-8 h-8 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-medium mb-1">Welcome back,</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text">
                          {host?.name || 'Experience Host'}
                        </h1>
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">
                            {experiences.length > 0 
                              ? `${experiences.length} Active Experience${experiences.length !== 1 ? 's' : ''}`
                              : 'Ready to create experiences'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20 shadow-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-xl flex items-center justify-center border border-yellow-400/30">
                          <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                        </div>
                        <div>
                          <p className="text-white/60 text-xs font-medium">Average Rating</p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1) || '5.0'}</p>
                            {stats.totalReviews > 0 && (
                              <span className="text-white/50 text-sm">({stats.totalReviews})</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Create Experience CTA - Prominent & Beautiful */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12 shadow-2xl cursor-pointer"
              onClick={() => router.push('/host/experiences/add')}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
                  {/* Icon Section */}
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border-2 border-white/30 shadow-2xl"
                  >
                    <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-white" />
                  </motion.div>

                  {/* Content Section */}
                  <div className="flex-1 text-center md:text-left">
                    <motion.h2
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-3xl md:text-4xl font-bold text-white mb-3"
                    >
                      Create Your Next Experience
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-lg md:text-xl text-white/90 mb-6 max-w-2xl"
                    >
                      Share your unique cultural experiences with travelers from around the world. Start creating unforgettable moments today.
                    </motion.p>
                    
                    {/* CTA Button */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white text-indigo-600 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 group"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </div>

                  {/* Decorative Arrow */}
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="hidden lg:flex items-center text-white/50"
                  >
                    <ArrowRight className="w-12 h-12" />
                  </motion.div>
                </div>
              </div>

              {/* Shine Effect on Hover */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12" />
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Statistics Charts - Real Graphs */}
          {statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="space-y-6 mb-8">
              {/* Revenue & Bookings Trend - Line Chart */}
              {monthlyRevenueData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Revenue & Bookings Trend</h3>
                  <p className="text-xs text-gray-500">Last 6 months performance</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyRevenueData}>
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
                {chartData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Booking Status</h3>
                    <p className="text-xs text-gray-500">Distribution overview</p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
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
                    {chartData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-xs text-gray-600 font-medium">{item.name}: {item.value}</span>
                  </div>
                    ))}
                </div>
              </motion.div>
                )}

                {/* Monthly Bookings - Bar Chart */}
                {monthlyRevenueData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              >
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Monthly Bookings</h3>
                    <p className="text-xs text-gray-500">Booking volume trend</p>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyRevenueData}>
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

              {/* Key Metrics - Modern Card Grid */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Total Revenue</p>
                  <p className="text-xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Avg Booking</p>
                  <p className="text-xl font-bold text-gray-900">₹{Math.round(stats.averageBookingValue).toLocaleString()}</p>
                  </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Total Participants</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalParticipants}</p>
                  </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Active Experiences</p>
                  <p className="text-xl font-bold text-gray-900">{stats.experiences}</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* Recent Bookings Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/50 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Recent Bookings</h2>
                </div>
                <p className="text-slate-600 text-sm ml-13">Latest ticket verifications and bookings</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/provider/experiences/bookings')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
            
            <AnimatePresence>
            {recentBookings.length > 0 ? (
                <div className="space-y-3">
                {recentBookings.map((booking, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 4 }}
                      className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-white rounded-xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        
                        {/* Booking Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="font-semibold text-slate-900 mb-1">
                                {booking.user?.name || booking.travelerName || 'Guest'}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1">
                                  <Activity className="w-4 h-4" />
                                  <span>{booking.experienceDetails?.title || 'Experience'}</span>
                                </div>
                                {booking.experienceDetails?.date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {new Date(booking.experienceDetails.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              {booking.status === 'verified' ? 'Verified' : booking.status === 'pending' ? 'Pending' : booking.status}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-slate-600">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-slate-900">₹{booking.experienceDetails?.price?.toLocaleString() || booking.totalAmount?.toLocaleString() || 0}</span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                      </div>
                      </div>
                    </div>
                        
                        {/* Hover Effect Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-300 pointer-events-none"></div>
                      </motion.div>
                  ))}
                </div>
              ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-10 h-10 text-slate-400" />
                </div>
                    <p className="text-slate-600 font-medium mb-1">No bookings yet</p>
                    <p className="text-slate-500 text-sm">Your bookings will appear here once travelers make reservations</p>
                  </motion.div>
              )}
              </AnimatePresence>
          </motion.div>

          {/* Enhanced Empty State */}
          {experiences.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 rounded-3xl p-10 shadow-xl border border-amber-200/50"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-yellow-200/30 to-amber-200/30 rounded-full blur-2xl -ml-24 -mb-24"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-amber-900 mb-2">Start Your Experience Journey</h3>
                  <p className="text-amber-700 mb-6 max-w-md">
                    Create your first experience and begin sharing authentic cultural moments with travelers from around the world
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => router.push('/host/experiences/add')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Award className="w-5 h-5" />
                    Create Your First Experience
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}
