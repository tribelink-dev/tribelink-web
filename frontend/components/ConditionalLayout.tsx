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
  
  // Marketing routes (homepage and marketing sections)
  const isMarketingRoute = pathname === '/' || 
    pathname.startsWith('/#') ||
    pathname === '/about' ||
    pathname === '/experiences' ||
    pathname === '/culture' ||
    pathname === '/stories' ||
    pathname === '/contact';

  if (isMarketingRoute) {
    return (
      <>
        <MarketingNavbar />
        {children}
        <MarketingFooter />
      </>
    );
  }

  // Platform routes
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

