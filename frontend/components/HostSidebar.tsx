'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { hostLogout } from '@/lib/providerUtils';
import {
  LayoutDashboard,
  Home,
  Sparkles,
  Calendar,
  CheckCircle2,
  BarChart3,
  User,
  Clock
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: JSX.Element;
  badge?: number;
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/host/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />
  },
  {
    name: 'Abodes',
    href: '/host/abodes',
    icon: <Home className="w-5 h-5" />
  },
  {
    name: 'Experiences',
    href: '/host/experiences',
    icon: <Sparkles className="w-5 h-5" />
  },
  {
    name: 'Bookings',
    href: '/host/bookings',
    icon: <Calendar className="w-5 h-5" />
  },
  {
    name: 'Availability',
    href: '/host/availability',
    icon: <Clock className="w-5 h-5" />
  },
  {
    name: 'Analytics',
    href: '/host/analytics',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    name: 'Profile',
    href: '/host/profile',
    icon: <User className="w-5 h-5" />
  }
];

export default function HostSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 z-40 touch-target p-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all"
      >
        <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          shadow-sm
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">T</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Triberoutes</h2>
                <p className="text-gray-500 text-xs">Host Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/host/abodes' && (pathname?.startsWith('/host/abodes') || pathname?.startsWith('/adobes/register'))) ||
                (item.href === '/host/experiences' && pathname?.startsWith('/host/experiences'));
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className="flex-1 text-left text-sm">{item.name}</span>
                  {item.badge && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
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

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
