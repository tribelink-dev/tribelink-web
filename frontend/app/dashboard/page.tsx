'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /dashboard route removed. Redirect to the appropriate place.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isHost = localStorage.getItem('userType') === 'host' || !!localStorage.getItem('host');
    router.replace(isHost ? '/host/dashboard' : '/explore');
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-charcoal-500">Redirecting...</p>
    </div>
  );
}
