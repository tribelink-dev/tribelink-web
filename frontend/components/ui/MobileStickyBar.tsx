'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { stickyBarBottomClass } from '@/lib/mobileRoutes';

interface MobileStickyBarProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}

export default function MobileStickyBar({
  children,
  className,
  innerClassName,
}: MobileStickyBarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 md:hidden bg-surface border-t border-border safe-area-bottom',
        stickyBarBottomClass(pathname),
        className
      )}
    >
      <div className={cn('px-page py-3', innerClassName)}>{children}</div>
    </div>
  );
}
