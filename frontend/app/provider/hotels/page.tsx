'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProviderWelcomeMessage, hostLogout } from '@/lib/providerUtils';

export default function HotelOwnerDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      // Verify provider type
      const parsedHost = JSON.parse(hostData);
      if (parsedHost.providerType !== 'ACCOMMODATION_PROVIDER') {
        router.push('/host/dashboard');
        return;
      }

      setHost(parsedHost);
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="section-container max-w-6xl">
          <div className="content-card">
            <div className="flex items-center justify-center py-12">
              <span className="spinner w-8 h-8"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="section-container max-w-6xl">
        <div className="content-card mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="heading-secondary text-gray-900 mb-2">
                Welcome back, {host?.name || 'Hotel Owner'}!
              </h1>
              <p className="text-gray-600">
                {getProviderWelcomeMessage('ACCOMMODATION_PROVIDER')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="badge-rating">
                <span>⭐</span>
                {host?.rating || '5.0'} Rating
              </div>
              <button
                onClick={hostLogout}
                className="btn-secondary text-sm px-4 py-2"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <span className="text-2xl">🏨</span>
              </div>
              <h3 className="heading-tertiary mb-0">My Hotels</h3>
            </div>
            <p className="text-gray-600 mb-4">View and manage your hotel listings</p>
            <button 
              onClick={() => router.push('/host/hotels')}
              className="btn-primary w-full"
            >
              View All Hotels
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="heading-tertiary mb-0">Add Hotel</h3>
            </div>
            <p className="text-gray-600 mb-4">List a new hotel property</p>
            <button 
              onClick={() => router.push('/host/hotels/add')}
              className="btn-primary w-full"
            >
              Add Hotel
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="heading-tertiary mb-0">Bookings</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage hotel reservations</p>
            <button className="btn-secondary w-full">
              View Bookings
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <span className="text-2xl">🛏️</span>
              </div>
              <h3 className="heading-tertiary mb-0">Room Management</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage room availability</p>
            <button className="btn-secondary w-full">
              Manage Rooms
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="heading-tertiary mb-0">Reviews</h3>
            </div>
            <p className="text-gray-600 mb-4">View guest reviews</p>
            <button className="btn-secondary w-full">
              View Reviews
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="heading-tertiary mb-0">Revenue</h3>
            </div>
            <p className="text-gray-600 mb-4">Track your earnings</p>
            <button className="btn-secondary w-full">
              View Revenue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

