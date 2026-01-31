'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AbodeSidebar from '@/components/AbodeSidebar';
import ToastContainer, { useToast } from '@/components/Toast';
import { SkeletonStats } from '@/components/SkeletonLoader';
import { motion } from 'framer-motion';

export default function AbodeDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abode, setAbode] = useState<any>(null);
  const [stats, setStats] = useState({
    abodes: 0,
    bookings: 0,
    revenue: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'LOCAL_HOST') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      setLoading(false);
      fetchDashboardData();
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setStatsLoading(true);
      
      // Fetch abodes owned by this provider
      const abodesRes = await api.get('/abodes/owner/my-abodes').catch(() => ({ data: { abodes: [] } }));
      const myAbodes = abodesRes.data.abodes || [];
      setAbode(myAbodes[0] || null);
      
      // Fetch bookings if abode exists
      let bookings = [];
      let totalRevenue = 0;
      let pendingCount = 0;
      
      if (myAbodes.length > 0 && myAbodes[0]._id) {
        try {
          const bookingsRes = await api.get(`/abodes/${myAbodes[0]._id}/bookings`, {
            params: { limit: 10 }
          });
          bookings = bookingsRes.data.bookings || [];
          
          // Calculate revenue and pending bookings
          bookings.forEach((booking: any) => {
            if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
              totalRevenue += booking.totalAmount || 0;
            }
            if (booking.status === 'PENDING') {
              pendingCount++;
            }
          });
          
          setRecentBookings(bookings.slice(0, 5));
        } catch (err) {
          console.error('Error fetching bookings:', err);
        }
      }

      // Calculate stats
      const rating = myAbodes[0]?.rating || 0;
      const ratingCount = myAbodes[0]?.ratingCount || 0;

      setStats({
        abodes: myAbodes.length,
        bookings: bookings.length,
        revenue: totalRevenue,
        pendingBookings: pendingCount,
        totalRevenue: totalRevenue,
        averageRating: rating,
        totalReviews: ratingCount
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-amber-900">Loading your abode dashboard...</div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Register Abode',
      description: 'Create your first abode listing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/adobes/register',
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      show: !abode
    },
    {
      title: 'My Abode',
      description: 'Manage your abode listing',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      href: '/host/abodes/manage',
      color: 'from-orange-600 to-orange-700',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      show: !!abode
    },
    {
      title: 'View Bookings',
      description: 'Manage all your abode bookings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: abode ? `/adobes/my-bookings` : '#',
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      show: !!abode
    },
    {
      title: 'Edit Abode',
      description: 'Update your abode details',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      href: abode ? `/host/abodes/edit/${abode._id}` : '#',
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      show: !!abode
    },
    {
      title: 'View Public Listing',
      description: 'See how travelers see your abode',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      href: abode ? `/adobes/${abode._id}` : '#',
      color: 'from-amber-600 to-amber-700',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      show: !!abode
    }
  ].filter(action => action.show !== false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <AbodeSidebar />
      <div className="lg:ml-72">
        <div className="p-6 md:p-8 lg:p-10">
          {/* Modern Header with Gradient - Abode Theme */}
          <div className="mb-10 animate-fade-in">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-800 via-orange-700 to-amber-800 p-8 md:p-12 shadow-2xl">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full blur-2xl -ml-36 -mb-36"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white/80 text-sm font-medium">Welcome back, Local Host</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">
                          {host?.name || 'Host'}
                        </h1>
                      </div>
                    </div>
                    <p className="text-white/90 text-lg mt-2">
                      {abode 
                        ? `Manage your abode in ${abode.location?.state || 'your location'}`
                        : 'Share your home and culture with travelers'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-400/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-amber-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-medium">Rating</p>
                          <p className="text-white text-xl font-bold">{stats.averageRating.toFixed(1) || '5.0'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid - Abode Theme */}
          {statsLoading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 animate-fade-in">
              {/* Abodes Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="text-white/60 text-sm font-medium">Total</div>
                  </div>
                  <div className="text-4xl font-bold mb-2">{stats.abodes}</div>
                  <div className="text-amber-100 text-sm font-medium">Active Abodes</div>
                </div>
              </motion.div>

              {/* Bookings Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="text-white/60 text-sm font-medium">Total</div>
                  </div>
                  <div className="text-4xl font-bold mb-2">{stats.bookings}</div>
                  <div className="text-orange-100 text-sm font-medium">Total Bookings</div>
                </div>
              </motion.div>

              {/* Revenue Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-white/60 text-sm font-medium">Total</div>
                  </div>
                  <div className="text-4xl font-bold mb-2">₹{stats.totalRevenue.toLocaleString()}</div>
                  <div className="text-amber-100 text-sm font-medium">Total Revenue</div>
                </div>
              </motion.div>

              {/* Pending Bookings Card */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-700 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-white/60 text-sm font-medium">Pending</div>
                  </div>
                  <div className="text-4xl font-bold mb-2">{stats.pendingBookings}</div>
                  <div className="text-orange-100 text-sm font-medium">Pending Bookings</div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Quick Actions - Abode Theme */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-amber-900 mb-1">Quick Actions</h2>
                <p className="text-amber-700">Manage your abode and bookings</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => action.href !== '#' && router.push(action.href)}
                  disabled={action.href === '#'}
                  className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-amber-100 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-14 h-14 ${action.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:backdrop-blur-sm transition-all duration-300 ${action.textColor} group-hover:text-white`}>
                      {action.icon}
                    </div>
                    <h3 className="text-lg font-bold text-amber-900 mb-2 group-hover:text-white transition-colors duration-300">
                      {action.title}
                    </h3>
                    <p className="text-sm text-amber-700 group-hover:text-white/90 transition-colors duration-300">
                      {action.description}
                    </p>
                    <div className="mt-4 flex items-center text-amber-600 group-hover:text-white transition-colors duration-300">
                      <span className="text-sm font-semibold">Go to {action.title}</span>
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Decorative corner */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-100/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recent Bookings Section */}
          {abode && (
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-amber-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-amber-900 mb-1">Recent Bookings</h2>
                  <p className="text-amber-700">Your latest abode bookings</p>
                </div>
                <button 
                  onClick={() => router.push('/adobes/my-bookings')}
                  className="text-amber-700 hover:text-amber-900 font-semibold text-sm flex items-center gap-2"
                >
                  View All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              
              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-amber-50 transition-colors border border-amber-100">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-amber-900 font-medium">
                          {booking.user?.name || 'Guest'} - {booking.status}
                        </p>
                        <p className="text-amber-600 text-sm">
                          {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                        </p>
                        <p className="text-amber-700 text-sm mt-1">₹{booking.totalAmount || 0}</p>
                      </div>
                      <span className="text-amber-400 text-xs">{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-amber-600">No bookings yet</p>
                  <p className="text-amber-500 text-sm mt-2">Your bookings will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Abode Status Card */}
          {!abode && (
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-3xl p-8 shadow-xl border border-amber-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">Get Started</h3>
                  <p className="text-amber-700 mb-4">
                    Register your abode to start sharing your home and culture with travelers
                  </p>
                  <button
                    onClick={() => router.push('/adobes/register')}
                    className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all shadow-lg"
                  >
                    Register Your Abode
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </div>
  );
}

