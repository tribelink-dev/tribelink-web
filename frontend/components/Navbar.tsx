'use client';

import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { getProviderDashboard } from '@/lib/providerUtils';
import { useEffect, useState } from 'react';
import ExploreSectionTabs from './ExploreSectionTabs';
import { useExploreNavOptional } from '@/lib/ExploreNavContext';
import CurrencySelectorButton from './CurrencySelectorButton';
import MobileNavDrawer from './MobileNavDrawer';
import { useCart } from '@/lib/CartContext';
import api from '@/lib/api';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { cart } = useCart();
  const [isHost, setIsHost] = useState(false);
  const [hostDashboard, setHostDashboard] = useState('/host/dashboard');
  const [hostName, setHostName] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isViewingOwnAbode, setIsViewingOwnAbode] = useState(false);

  const exploreNav = useExploreNavOptional();
  const cartItemCount = cart?.items?.length ?? 0;
  const showCart = (user || isHost) && !isHost; // Travelers only

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
            // Any host can own abodes, regardless of provider type
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
    setShowUserMenu(false);
    logout(); // logout() already handles redirect with full page reload
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHost) {
      router.push(hostDashboard);
    } else {
      router.push('/explore');
    }
  };

  const isHomepage = pathname === '/';
  const isExplorePage = pathname === '/explore';
  const isHostDashboard = pathname?.startsWith('/host/') || 
    pathname?.startsWith('/adobes/register') || 
    pathname?.startsWith('/adobes/my-bookings') || 
    pathname?.startsWith('/provider/');
  
  const isTripPage = pathname?.startsWith('/trips');

  const isExploreBrowse = isExplorePage && !!exploreNav;

  const showHostCta = !isHost && !isHostDashboard;

  const closeMobileMenu = () => setShowMobileMenu(false);

  const mobileNavLinkClass =
    'w-full text-left px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors';

  const outlinePillClass = 'hidden md:inline-flex rounded-full border-gray-200 text-charcoal-800 hover:border-heritage-gold/60 hover:bg-cream-100/80';

  const renderRightActions = () => (
    <>
      <CurrencySelectorButton />

      {showCart && (
        <button
          onClick={() => router.push('/dashboard/bucketlist')}
          className="relative touch-target p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors hidden sm:flex"
          title="Bucketlist"
          aria-label="Bucketlist"
        >
          <Heart className="w-5 h-5" />
        </button>
      )}

      {showCart && (
        <button
          onClick={() => router.push('/cart')}
          className="relative touch-target p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          title="Your bucket"
          aria-label={`Bucket${cartItemCount > 0 ? ` (${cartItemCount} items)` : ''}`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-heritage-gold text-white text-xs font-bold rounded-full">
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </button>
      )}

      {!(user || isHost) ? (
        <div className="flex items-center gap-3">
          {!isTripPage && (
            <Button
              variant="secondary"
              size="sm"
              className={outlinePillClass}
              onClick={() => router.push('/trips/select')}
              title="Plan a trip with local abodes and experiences"
            >
              Plan trip
            </Button>
          )}
          {showHostCta && (
            <Button
              variant="secondary"
              size="sm"
              className={outlinePillClass}
              onClick={() => router.push('/host/signup')}
              title="Share your home and culture with travelers"
            >
              Start hosting
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex rounded-full"
            onClick={() => router.push('/login?returnTo=/explore')}
          >
            Sign in
          </Button>
        </div>
      ) : (
        <>
          {!isExplorePage && (
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex rounded-full"
              onClick={() => router.push('/explore')}
            >
              Explore
            </Button>
          )}
          {!isTripPage && (
            <Button
              variant="secondary"
              size="sm"
              className={outlinePillClass}
              onClick={() => router.push('/trips/select')}
              title="Plan a trip with local abodes and experiences"
            >
              Plan trip
            </Button>
          )}
          {showHostCta && (
            <Button
              variant="secondary"
              size="sm"
              className={outlinePillClass}
              onClick={() => router.push('/host/signup')}
              title="Share your home and culture with travelers"
            >
              Start hosting
            </Button>
          )}

          <div className="relative hidden md:block">
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
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/dashboard/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                  </>
                )}
                {isHost && (
                  <>
                    <button
                      onClick={() => {
                        router.push(hostDashboard);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Host Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        router.push('/host/profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <MobileNavDrawer
        isOpen={showMobileMenu}
        onToggle={() => setShowMobileMenu(!showMobileMenu)}
        onClose={closeMobileMenu}
        title="Menu"
      >
        <div className="flex flex-col gap-1">
          {!isExplorePage && (
            <button
              type="button"
              className={mobileNavLinkClass}
              onClick={() => {
                router.push('/explore');
                closeMobileMenu();
              }}
            >
              Explore
            </button>
          )}
          {!isTripPage && (
            <button
              type="button"
              className={mobileNavLinkClass}
              onClick={() => {
                router.push('/trips/select');
                closeMobileMenu();
              }}
            >
              Plan trip
            </button>
          )}
          {showHostCta && (
            <button
              type="button"
              className={mobileNavLinkClass}
              onClick={() => {
                router.push('/host/signup');
                closeMobileMenu();
              }}
            >
              Start hosting
            </button>
          )}
          {showCart && (
            <button
              type="button"
              className={mobileNavLinkClass}
              onClick={() => {
                router.push('/cart');
                closeMobileMenu();
              }}
            >
              Your bucket{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
            </button>
          )}
          {!(user || isHost) ? (
            <button
              type="button"
              className={mobileNavLinkClass}
              onClick={() => {
                router.push('/login?returnTo=/explore');
                closeMobileMenu();
              }}
            >
              Sign in
            </button>
          ) : (
            <>
              {user && !isHost && (
                <>
                  <button
                    type="button"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      router.push('/dashboard');
                      closeMobileMenu();
                    }}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      router.push('/dashboard/profile');
                      closeMobileMenu();
                    }}
                  >
                    Profile
                  </button>
                </>
              )}
              {isHost && (
                <>
                  <button
                    type="button"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      router.push(hostDashboard);
                      closeMobileMenu();
                    }}
                  >
                    Host Dashboard
                  </button>
                  <button
                    type="button"
                    className={mobileNavLinkClass}
                    onClick={() => {
                      router.push('/host/profile');
                      closeMobileMenu();
                    }}
                  >
                    Profile
                  </button>
                </>
              )}
              <button
                type="button"
                className="w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium mt-2"
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </MobileNavDrawer>
    </>
  );

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${
        scrolled || !isHomepage
          ? 'bg-white shadow-md border-b border-gray-200' 
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-page lg:px-page-lg">
        {isExploreBrowse ? (
          <>
            <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:h-16">
              <a
                href="/explore"
                onClick={handleLogoClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 justify-self-start"
              >
                <div className="flex items-center justify-center w-8 h-8">
                  <BrandLogo size={32} />
                </div>
                <span className="text-lg font-semibold text-gray-900">TRIBEROUTES</span>
              </a>

              <ExploreSectionTabs
                activeSection={exploreNav.activeSection}
                onSectionChange={exploreNav.onSectionChange}
                className="justify-self-center"
              />

              <div className="flex items-center gap-1 sm:gap-2 md:gap-3 justify-self-end">
                {renderRightActions()}
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex justify-between items-center h-16 gap-2">
                <a
                  href="/explore"
                  onClick={handleLogoClick}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
                >
                  <div className="flex items-center justify-center w-8 h-8">
                    <BrandLogo size={32} />
                  </div>
                  <span className="hidden sm:inline text-lg font-semibold text-gray-900">TRIBEROUTES</span>
                </a>
                <div className="flex items-center gap-1 sm:gap-2">
                  {renderRightActions()}
                </div>
              </div>
              <div className="flex justify-center px-page pb-2 border-b border-gray-100">
                <ExploreSectionTabs
                  activeSection={exploreNav.activeSection}
                  onSectionChange={exploreNav.onSectionChange}
                  size="sm"
                />
              </div>
            </div>
          </>
        ) : (
        <div className="flex justify-between items-center h-16 gap-2">
          {/* Logo */}
          <a
            href={isHost ? hostDashboard : "/explore"}
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
          >
            <BrandLogo size={32} />
            <span className="hidden sm:inline text-lg font-semibold text-gray-900">
                TRIBEROUTES
              </span>
          </a>

          {/* Right Side */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto">
            {renderRightActions()}
          </div>
        </div>
        )}
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
