'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function SafetyDashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="page-container">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-primary text-gray-900 mb-2">Safety & Emergency</h1>
          <p className="text-gray-600">Manage your safety settings and emergency information</p>
        </div>

        {/* Safety Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/dashboard/safety/contacts"
            className="group bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-6 hover:border-red-300 hover:shadow-medium transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📞</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Emergency Contacts</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Manage your emergency contact list</p>
            <div className="flex items-center gap-2 text-red-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Manage
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/safety/info"
            className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-medium transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏥</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Medical Info</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Store your medical information</p>
            <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
              Update
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/safety/settings"
            className="group bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-6 hover:border-yellow-300 hover:shadow-medium transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🚨</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Emergency Numbers</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Local emergency service numbers</p>
            <div className="flex items-center gap-2 text-yellow-600 font-semibold text-sm group-hover:gap-3 transition-all">
              View
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/safety/history"
            className="group bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-medium transition-all transform hover:scale-105"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">SOS History</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">View your emergency SOS events</p>
            <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm group-hover:gap-3 transition-all">
              View History
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}








