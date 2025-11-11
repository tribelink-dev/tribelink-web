'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';

export default function HostDashboard() {
  const router = useRouter();
  const [host, setHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in as host
    if (typeof window !== 'undefined') {
      const hostData = localStorage.getItem('host');
      const token = localStorage.getItem('token');
      
      if (!hostData || !token) {
        router.push('/host/login');
        return;
      }

      // Set host data after component mounts (client-side only)
      setHost(JSON.parse(hostData));
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
          <div className="text-xl font-medium text-gray-700">Loading...</div>
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
                Welcome back, {host?.name || 'Host'}!
              </h1>
              <p className="text-gray-600">
                {host?.role === 'Guide' ? 'Manage your guided tours' : 'Manage your experiences and services'}
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
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="heading-tertiary mb-0">My Experiences</h3>
            </div>
            <p className="text-gray-600 mb-4">View and manage your experiences</p>
            <button 
              onClick={() => router.push('/host/experiences')}
              className="btn-primary w-full"
            >
              View All Experiences
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl">
                <span className="text-2xl">🏨</span>
              </div>
              <h3 className="heading-tertiary mb-0">My Hotels</h3>
            </div>
            <p className="text-gray-600 mb-4">Manage your hotel listings</p>
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
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="heading-tertiary mb-0">Availability</h3>
            </div>
            <p className="text-gray-600 mb-4">Set your availability calendar</p>
            <button className="btn-secondary w-full">
              Set Availability
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="heading-tertiary mb-0">Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">View your performance metrics</p>
            <button className="btn-secondary w-full">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

