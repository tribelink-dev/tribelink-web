'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  side?: 'bottom' | 'right';
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
  side = 'bottom',
}: SheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'absolute bg-surface shadow-large border border-border',
          side === 'bottom' &&
            'inset-x-0 bottom-0 rounded-t-2xl max-h-[85vh] overflow-y-auto safe-area-bottom mobile-dropdown-panel',
          side === 'right' && 'inset-y-0 right-0 w-full max-w-sm rounded-l-2xl overflow-y-auto',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border sticky top-0 bg-surface z-10">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <Button variant="icon" size="icon" onClick={onClose} aria-label="Close">
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
