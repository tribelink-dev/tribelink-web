'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, User, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/bookings', label: 'Trips', icon: Map },
  { href: '/dashboard/saved', label: 'Saved', icon: Heart },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-border safe-area-bottom"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors touch-target',
                active ? 'text-brand-hover' : 'text-text-secondary'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'text-brand')} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
