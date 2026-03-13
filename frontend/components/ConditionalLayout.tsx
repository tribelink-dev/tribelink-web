'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import MarketingNavbar from '@/components/marketing/layout/Navbar';
import MarketingFooter from '@/components/marketing/layout/Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Marketing routes (homepage-style and marketing sections)
  const isMarketingRoute = pathname === '/' || 
    pathname === '/landing' ||
    pathname.startsWith('/#') ||
    pathname === '/about' ||
    pathname === '/experiences' ||
    pathname === '/culture' ||
    pathname === '/stories' ||
    pathname === '/contact';

  // Host routes (don't show Navbar, they have their own sidebar)
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

  // Host routes - no Navbar (they have sidebar)
  if (isHostRoute) {
    return <>{children}</>;
  }

  // Platform routes
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

