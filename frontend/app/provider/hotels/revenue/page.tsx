'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import api from '@/lib/api';
import Link from 'next/link';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  bookingsCount: number;
  averageBookingValue: number;
  revenueByHotel: Array<{
    hotelId: string;
    hotelName: string;
    revenue: number;
    bookings: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export default function RevenuePage() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    bookingsCount: 0,
    averageBookingValue: 0,
    revenueByHotel: [],
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'month' | 'year' | 'all'>('month');

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
      fetchRevenueData();
    }
  }, [router, timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use the new revenue endpoint
      const revenueResponse = await api.get('/hotels/owner/revenue');
      setRevenueData(revenueResponse.data);
    } catch (err: any) {
      console.error('Error fetching revenue data:', err);
      setError(err.response?.data?.message || 'Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayRevenue = () => {
    switch (timeRange) {
      case 'month':
        return revenueData.monthlyRevenue;
      case 'year':
        return revenueData.yearlyRevenue;
      default:
        return revenueData.totalRevenue;
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-7xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-primary-500 border-t-transparent mb-6"></div>
                <div className="text-xl font-medium text-gray-700">Loading revenue data...</div>
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
                Revenue & Analytics
              </h1>
              <p className="text-lg text-gray-600">Track your earnings and performance</p>
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

          {/* Time Range Selector */}
          <div className="flex gap-2 mb-6">
            {['month', 'year', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  timeRange === range
                    ? 'bg-primary-600 text-white shadow-medium'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
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

        {/* Revenue Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">${getDisplayRevenue().toFixed(2)}</p>
              </div>
              <span className="text-4xl">💰</span>
            </div>
            <p className="text-green-100 text-sm">
              {timeRange === 'month' && `This month`}
              {timeRange === 'year' && `This year`}
              {timeRange === 'all' && `All time`}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-bold">{revenueData.bookingsCount}</p>
              </div>
              <span className="text-4xl">📅</span>
            </div>
            <p className="text-blue-100 text-sm">Confirmed reservations</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-purple-100 text-sm mb-1">Avg Booking Value</p>
                <p className="text-3xl font-bold">${revenueData.averageBookingValue.toFixed(2)}</p>
              </div>
              <span className="text-4xl">📊</span>
            </div>
            <p className="text-purple-100 text-sm">Per booking</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl shadow-large p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Hotels</p>
                <p className="text-3xl font-bold">{revenueData.revenueByHotel.length}</p>
              </div>
              <span className="text-4xl">🏨</span>
            </div>
            <p className="text-yellow-100 text-sm">Active properties</p>
          </div>
        </div>

        {/* Revenue by Hotel */}
        {revenueData.revenueByHotel.length > 0 && (
          <div className="content-card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Revenue by Hotel</h2>
            <div className="space-y-4">
              {revenueData.revenueByHotel.map((hotel) => (
                <div
                  key={hotel.hotelId}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border-2 border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.hotelName}</h3>
                      <div className="flex gap-6 text-sm text-gray-600">
                        <span>{hotel.bookings} bookings</span>
                        <span>${hotel.revenue.toFixed(2)} total</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-600">
                        ${hotel.revenue.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {hotel.bookings > 0 
                          ? `$${(hotel.revenue / hotel.bookings).toFixed(2)} avg`
                          : 'No bookings'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(hotel.revenue / (revenueData.revenueByHotel[0]?.revenue || 1)) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Revenue Chart */}
        {revenueData.revenueByMonth.length > 0 && (
          <div className="content-card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Monthly Revenue Trend</h2>
            <div className="space-y-4">
              {revenueData.revenueByMonth.map((month) => {
                const maxRevenue = Math.max(...revenueData.revenueByMonth.map(m => m.revenue));
                return (
                  <div key={month.month} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-semibold text-gray-700">
                      {month.month}
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-6 relative">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                          style={{
                            width: `${(month.revenue / maxRevenue) * 100}%`
                          }}
                        >
                          <span className="text-xs font-semibold text-white">
                            ${month.revenue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm text-gray-600">
                      {month.bookings} bookings
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {revenueData.bookingsCount === 0 && (
          <div className="content-card">
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <span className="text-4xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No revenue data yet</h3>
              <p className="text-gray-600 mb-8">
                Revenue analytics will appear here once you have confirmed bookings
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

