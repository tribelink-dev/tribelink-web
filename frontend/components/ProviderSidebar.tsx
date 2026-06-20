'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BrandLogo from '@/components/BrandLogo';
import { hostLogout } from '@/lib/providerUtils';
import {
  LayoutDashboard,
  Sparkles,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Home,
  BarChart3,
  Map,
  BookOpen,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: JSX.Element;
}

const guideNav: NavItem[] = [
  { name: 'Dashboard', href: '/provider/guides', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Experiences', href: '/provider/guides/experiences', icon: <Sparkles className="w-5 h-5" /> },
  { name: 'Tours', href: '/provider/guides/tours', icon: <Map className="w-5 h-5" /> },
  { name: 'Schedule', href: '/provider/guides/schedule', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Availability', href: '/provider/guides/availability', icon: <Clock className="w-5 h-5" /> },
  { name: 'Earnings', href: '/provider/guides/earnings', icon: <DollarSign className="w-5 h-5" /> },
  { name: 'Reviews', href: '/provider/guides/reviews', icon: <Star className="w-5 h-5" /> },
];

const hotelNav: NavItem[] = [
  { name: 'Dashboard', href: '/provider/hotels', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Manage', href: '/provider/hotels/manage', icon: <Home className="w-5 h-5" /> },
  { name: 'Bookings', href: '/provider/hotels/bookings', icon: <Calendar className="w-5 h-5" /> },
  { name: 'Availability', href: '/provider/hotels/availability', icon: <Clock className="w-5 h-5" /> },
  { name: 'Revenue', href: '/provider/hotels/revenue', icon: <DollarSign className="w-5 h-5" /> },
  { name: 'Reviews', href: '/provider/hotels/reviews', icon: <Star className="w-5 h-5" /> },
];

const experienceNav: NavItem[] = [
  { name: 'Dashboard', href: '/provider/experiences', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Bookings', href: '/provider/experiences/bookings', icon: <BookOpen className="w-5 h-5" /> },
  { name: 'Analytics', href: '/provider/experiences/analytics', icon: <BarChart3 className="w-5 h-5" /> },
];

function getNavFromPath(pathname: string | null): NavItem[] {
  if (pathname?.startsWith('/provider/hotels')) return hotelNav;
  if (pathname?.startsWith('/provider/experiences')) return experienceNav;
  return guideNav;
}

function getPortalLabel(pathname: string | null): string {
  if (pathname?.startsWith('/provider/hotels')) return 'Hotel Portal';
  if (pathname?.startsWith('/provider/experiences')) return 'Experience Portal';
  return 'Guide Portal';
}

export default function ProviderSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigation = useMemo(() => getNavFromPath(pathname), [pathname]);
  const portalLabel = getPortalLabel(pathname);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/provider/guides' || href === '/provider/hotels' || href === '/provider/experiences') {
      return pathname === href;
    }
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 z-40 touch-target p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 shadow-sm
        `}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <BrandLogo size={40} />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Triberoutes</h2>
                <p className="text-gray-500 text-xs">{portalLabel}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  <div className={`flex-shrink-0 ${active ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left text-sm">{item.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              type="button"
              onClick={hostLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
