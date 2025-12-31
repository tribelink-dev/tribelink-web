'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Legacy provider experiences dashboard
 * Redirects to the unified modern host dashboard
 */
export default function ExperienceHostDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the modern unified dashboard
    router.replace('/host/dashboard');
  }, [router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
        <div className="text-xl font-medium text-gray-700">Redirecting to dashboard...</div>
      </div>
    </div>
  );
}
