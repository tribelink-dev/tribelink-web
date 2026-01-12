'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import { useEffect, useState } from 'react';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState('/host/dashboard');
  const [hostName, setHostName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

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

      // Handle scroll for glassmorphism effect
      const handleScroll = () => {
        setScrolled(window.scrollY > 20);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
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
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'glass shadow-luxury border-b border-charcoal-100/20' 
          : 'bg-transparent'
      }`}
    >
      <div className="section-container-luxury">
        <div className="flex justify-between items-center h-20 lg:h-24">
          <a 
            href={isHost ? hostDashboard : "/"}
            onClick={handleLogoClick}
            className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group cursor-pointer"
          >
            <div className="flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 bg-cream-500/90 backdrop-blur-sm rounded-lg group-hover:bg-cream-400 transition-all duration-300 shadow-sm">
              <Image 
                src={LOGO_PATH} 
                alt={LOGO_ALT_TEXT} 
                width={56} 
                height={56}
                className="w-10 h-10 lg:w-12 lg:h-12"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg lg:text-xl font-semibold text-charcoal-700 tracking-wide">
                TRIBELINK
              </span>
              <span className="text-xs text-charcoal-500 hidden sm:block font-light tracking-wider">
                Authentic Global Journeys
              </span>
            </div>
          </a>
          
          {(user || isHost) && (
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Token Display - Luxury Styling */}
              {user && typeof user.tokens !== 'undefined' && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-heritage-gold/10 border border-heritage-gold/20 rounded-lg backdrop-blur-sm">
                  <svg className="w-4 h-4 text-heritage-gold" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-semibold text-heritage-gold-dark">{user.tokens}</span>
                </div>
              )}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-charcoal-500 font-light">Welcome back</span>
                <span className="text-sm font-medium text-charcoal-700">
                  {user?.name || hostName || 'Host'}
                </span>
              </div>
              <div className="md:hidden">
                <span className="text-sm font-medium text-charcoal-700">
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
                className="px-5 py-2.5 text-sm font-medium text-charcoal-700 bg-white/80 hover:bg-white border border-charcoal-200/50 rounded-lg transition-all duration-300 hover:shadow-sm hover:border-charcoal-300/50 backdrop-blur-sm"
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

