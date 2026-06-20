'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function DropdownMenu({ trigger, children, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={cn('relative', className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <div
            className={cn(
              'absolute top-full mt-2 min-w-[12rem] bg-surface border border-border rounded-xl shadow-large z-50 p-2',
              align === 'right' ? 'right-0' : 'left-0'
            )}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}

export interface DropdownMenuItemProps {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
}

export function DropdownMenuItem({ children, onClick, active }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
        active ? 'bg-brand/10 text-brand-hover font-medium' : 'hover:bg-surface-muted text-text-primary'
      )}
    >
      {children}
    </button>
  );
}
