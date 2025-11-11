'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProviderWelcomeMessage, hostLogout } from '@/lib/providerUtils';

export default function DriverPartnerDashboard() {
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
      if (parsedHost.providerType !== 'DRIVER_PARTNER') {
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
                Welcome back, {host?.name || 'Driver Partner'}!
              </h1>
              <p className="text-gray-600">
                {getProviderWelcomeMessage('DRIVER_PARTNER')}
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
                <span className="text-2xl">🚗</span>
              </div>
              <h3 className="heading-tertiary mb-0">My Vehicles</h3>
            </div>
            <p className="text-gray-600 mb-4">View and manage your vehicle fleet</p>
            <button className="btn-primary w-full">
              View Vehicles
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-accent-100 rounded-xl">
                <span className="text-2xl">➕</span>
              </div>
              <h3 className="heading-tertiary mb-0">Add Vehicle</h3>
            </div>
            <p className="text-gray-600 mb-4">Register a new vehicle</p>
            <button className="btn-primary w-full">
              Register Vehicle
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="heading-tertiary mb-0">Availability</h3>
            </div>
            <p className="text-gray-600 mb-4">Set your driving schedule</p>
            <button className="btn-secondary w-full">
              Set Availability
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="heading-tertiary mb-0">My Schedule</h3>
            </div>
            <p className="text-gray-600 mb-4">View assigned trips and itinerary</p>
            <button 
              onClick={() => router.push('/driver/schedule')}
              className="btn-secondary w-full"
            >
              View Schedule
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-xl">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="heading-tertiary mb-0">Onboarding</h3>
            </div>
            <p className="text-gray-600 mb-4">Complete your driver profile setup</p>
            <button 
              onClick={() => router.push('/driver/onboarding')}
              className="btn-primary w-full"
            >
              Complete Setup
            </button>
          </div>

          <div className="card-professional card-hover p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="heading-tertiary mb-0">Earnings</h3>
            </div>
            <p className="text-gray-600 mb-4">Track your earnings</p>
            <button className="btn-secondary w-full">
              View Earnings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

