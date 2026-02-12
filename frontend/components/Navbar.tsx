'use client';

import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import { useEffect, useState } from 'react';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';
import SearchBar from './SearchBar';
import CurrencySelectorButton from './CurrencySelectorButton';
import api from '@/lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState('/host/dashboard');
  const [hostName, setHostName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isViewingOwnAbode, setIsViewingOwnAbode] = useState(false);

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

  // Check if host is viewing their own abode
  useEffect(() => {
    const checkOwnAbode = async () => {
      // Check if we're on an abode detail page
      const abodeDetailMatch = pathname?.match(/^\/adobes\/([^\/]+)$/);
      if (abodeDetailMatch && typeof window !== 'undefined') {
        const abodeId = abodeDetailMatch[1];
        const hostData = localStorage.getItem('host');
        
        if (hostData) {
          try {
            const host = JSON.parse(hostData);
            // Only check for LOCAL_HOST type
            if (host.providerType === 'LOCAL_HOST') {
              // Fetch host's abodes to check if they own this abode
              try {
                const response = await api.get('/abodes/owner/my-abodes');
                const myAbodes = response.data.abodes || [];
                const ownsAbode = myAbodes.some((abode: any) => abode._id === abodeId);
                setIsViewingOwnAbode(ownsAbode);
              } catch (err) {
                // If API call fails, assume not viewing own abode
                setIsViewingOwnAbode(false);
              }
            } else {
              setIsViewingOwnAbode(false);
            }
          } catch (e) {
            setIsViewingOwnAbode(false);
          }
        } else {
          setIsViewingOwnAbode(false);
        }
      } else {
        setIsViewingOwnAbode(false);
      }
    };

    checkOwnAbode();
  }, [pathname]);

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
  const isHostDashboard = pathname?.startsWith('/host/') || 
    pathname?.startsWith('/adobes/register') || 
    pathname?.startsWith('/adobes/my-bookings') || 
    pathname?.startsWith('/provider/');
  
  // Pages where search bar should NOT appear
  const isDashboardPage = pathname?.startsWith('/dashboard');
  const isBookingPage = pathname?.startsWith('/bookings');
  const isTripPage = pathname?.startsWith('/trips');
  const isEditPage = pathname?.includes('/edit/') || pathname?.includes('/add');
  const isKYTPage = pathname === '/kyt';
  const isCurrencyPage = pathname?.startsWith('/currency-converter');
  
  // Only show search bar on listing/browsing pages where search is relevant
  const isAbodesListingPage = pathname === '/abodes' || pathname === '/adobes';
  const isAbodeDetailPage = pathname?.match(/^\/adobes\/[^\/]+$/);
  
  const shouldShowSearchBar = isAbodesListingPage && 
    !isAbodeDetailPage &&
    !isViewingOwnAbode;

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

          {/* Search Bar (only on pages where it makes sense) */}
          {shouldShowSearchBar && (
            <div className="flex-1 max-w-xl mx-8 hidden lg:block">
              <SearchBar variant="navbar" />
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Currency Selector */}
            <CurrencySelectorButton />
            

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

