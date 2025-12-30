'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState('/host/dashboard');
  const [hostName, setHostName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is a host
    if (typeof window !== 'undefined') {
      const userType = localStorage.getItem('userType');
      const hostData = localStorage.getItem('host');
      if (userType === 'host' && hostData) {
        setIsHost(true);
        try {
          const host = JSON.parse(hostData);
          setHostName(host.name || 'Host');
          const providerType = host.providerType || 'EXPERIENCE_HOST';
          setHostDashboard(getProviderDashboard(providerType));
        } catch (e) {
          // Fallback to default dashboard
          setHostName('Host');
          setHostDashboard('/host/dashboard');
        }
      }
    }
  }, []);

  // Don't show navbar on auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/host/login' || pathname === '/host/signup') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHost) {
      router.push(hostDashboard);
    } else {
      router.push('/');
    }
  };

  return (
    <nav className="bg-white shadow-soft border-b border-gray-200 sticky top-0 z-50">
      <div className="section-container">
        <div className="flex justify-between items-center h-16 lg:h-20">
          <a 
            href={isHost ? hostDashboard : "/"}
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group cursor-pointer"
          >
            <div className="flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl group-hover:bg-gray-50 transition-colors">
              <Image 
                src="/tribelink-logo.svg" 
                alt="Tribelink Logo" 
                width={48} 
                height={48}
                className="w-10 h-10 lg:w-12 lg:h-12"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg lg:text-xl font-bold text-gray-900">
                TRIBELINK
              </span>
              <span className="text-xs text-gray-500 hidden sm:block">
                Authentic Global Journeys
              </span>
            </div>
          </a>
          
          {(user || isHost) && (
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Token Display - Small and Compact (only for regular users) */}
              {user && typeof user.tokens !== 'undefined' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-turmeric-50 border border-turmeric-200 rounded-lg">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-semibold text-turmeric-700">{user.tokens}</span>
                </div>
              )}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm text-gray-500">Welcome back</span>
                <span className="text-base font-semibold text-gray-900">
                  {user?.name || hostName || 'Host'}
                </span>
              </div>
              <div className="md:hidden">
                <span className="text-sm font-medium text-gray-700">
                  {(user?.name || hostName || 'Host').split(' ')[0]}
                </span>
              </div>
              <button
                onClick={isHost ? () => {
                  if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('host');
                    localStorage.removeItem('userType');
                    window.location.href = '/host/login';
                  }
                } : handleLogout}
                className="btn-secondary text-sm px-4 py-2 lg:px-6 lg:py-2.5"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

