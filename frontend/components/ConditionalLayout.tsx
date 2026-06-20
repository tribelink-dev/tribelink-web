'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MarketingNavbar from '@/components/marketing/layout/Navbar';
import MarketingFooter from '@/components/marketing/layout/Footer';
import PlatformFooter from '@/components/PlatformFooter';
import MobileBottomNav from '@/components/MobileBottomNav';
import { ExploreNavProvider } from '@/lib/ExploreNavContext';
import { shouldHideBottomNav } from '@/lib/mobileRoutes';
import { cn } from '@/lib/utils';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const isMarketingRoute = pathname === '/' || 
    pathname === '/landing' ||
    pathname.startsWith('/#') ||
    pathname === '/about' ||
    pathname === '/experiences' ||
    pathname === '/culture' ||
    pathname === '/stories' ||
    pathname === '/contact';

  const isHostRoute = pathname.startsWith('/host/') || 
    pathname.startsWith('/provider/') ||
    pathname.startsWith('/adobes/register') ||
    pathname.startsWith('/hosts/');

  if (isMarketingRoute) {
    return (
      <>
        <MarketingNavbar />
        {children}
        <MarketingFooter />
      </>
    );
  }

  if (isHostRoute) {
    return <>{children}</>;
  }

  const hideBottomNav = shouldHideBottomNav(pathname);

  return (
    <ExploreNavProvider>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className={cn('flex-1', !hideBottomNav && 'pb-mobile-nav')}>{children}</main>
        <PlatformFooter />
        {!hideBottomNav && <MobileBottomNav />}
      </div>
    </ExploreNavProvider>
  );
}
