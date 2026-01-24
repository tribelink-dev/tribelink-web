'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import { useEffect, useState } from 'react';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';
import AirbnbSearchBar from './AirbnbSearchBar';
import CurrencySelectorButton from './CurrencySelectorButton';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState('/host/dashboard');
  const [hostName, setHostName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
          setHostName('Host');
          setHostDashboard('/host/dashboard');
        }
      }

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
    setShowUserMenu(false);
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHost) {
      router.push(hostDashboard);
    } else {
      router.push('/');
    }
  };

  const isHomepage = pathname === '/';
  const isExplorePage = pathname === '/explore';

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHomepage
          ? 'bg-white shadow-md border-b border-gray-200' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a 
            href={isHost ? hostDashboard : "/"}
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8">
              <Image 
                src={LOGO_PATH} 
                alt={LOGO_ALT_TEXT} 
                width={32} 
                height={32}
                className="w-8 h-8"
              />
            </div>
            <span className="text-lg font-semibold text-gray-900">
                TRIBELINK
              </span>
          </a>

          {/* Search Bar (only on non-homepage and non-explore page) */}
          {!isHomepage && !isExplorePage && (
            <div className="flex-1 max-w-xl mx-8 hidden lg:block">
              <AirbnbSearchBar variant="navbar" />
                </div>
              )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <CurrencySelectorButton />
            
            {!user && !isHost && (
              <>
                {!isExplorePage && (
                  <button
                    onClick={() => router.push('/explore')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    Explore
                  </button>
                )}
                <button
                  onClick={() => router.push('/host/signup')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Become a Host
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-colors"
                >
                  Sign up
                </button>
              </>
            )}

            {(user || isHost) && (
              <>
                {!isExplorePage && (
                  <button
                    onClick={() => router.push('/explore')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
                  >
                    Explore
                  </button>
                )}
                <button
                  onClick={() => router.push('/host/signup')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-full transition-colors hidden md:block"
                >
                  Become a Host
                </button>
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-3 py-2 border border-gray-300 rounded-full hover:shadow-md transition-all"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(user?.name || hostName || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {user && !isHost && (
                        <>
                          <button
                            onClick={() => {
                              router.push('/dashboard');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Dashboard
                          </button>
                          <button
                            onClick={() => {
                              router.push('/abodes');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Experience Abodes
                          </button>
                          <button
                            onClick={() => {
                              router.push('/trips/experiences');
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Book Experiences
                          </button>
                          <hr className="my-2" />
                        </>
                      )}
                      {isHost && (
                        <button
                          onClick={() => {
                            router.push(hostDashboard);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Host Dashboard
                        </button>
                      )}
              <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                        Sign out
              </button>
            </div>
          )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop for menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  );
}

