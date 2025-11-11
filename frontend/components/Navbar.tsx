'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Don't show navbar on auth pages
  if (pathname === '/login' || pathname === '/signup' || pathname === '/host/login' || pathname === '/host/signup') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-soft border-b border-gray-200 sticky top-0 z-50">
      <div className="section-container">
        <div className="flex justify-between items-center h-16 lg:h-20">
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
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
          </Link>
          
          {user && (
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Token Display - Small and Compact */}
              {typeof user.tokens !== 'undefined' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-lg">🪙</span>
                  <span className="text-sm font-semibold text-yellow-700">{user.tokens}</span>
                </div>
              )}
              <div className="hidden md:flex flex-col items-end">
                <span className="text-sm text-gray-500">Welcome back</span>
                <span className="text-base font-semibold text-gray-900">
                  {user.name}
                </span>
              </div>
              <div className="md:hidden">
                <span className="text-sm font-medium text-gray-700">
                  {user.name.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
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

