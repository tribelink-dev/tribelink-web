'use client';

import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Tailwind breakpoint below which drawer is shown (default: md) */
  hideAbove?: 'md' | 'lg';
  triggerClassName?: string;
  panelClassName?: string;
  side?: 'right' | 'left';
}

export default function MobileNavDrawer({
  isOpen,
  onToggle,
  onClose,
  children,
  title = 'Menu',
  hideAbove = 'md',
  triggerClassName,
  panelClassName,
  side = 'right',
}: MobileNavDrawerProps) {
  const hideClass = hideAbove === 'lg' ? 'lg:hidden' : 'md:hidden';
  const slideFrom = side === 'right' ? '100%' : '-100%';

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          hideClass,
          'touch-target p-2 rounded-full text-gray-700 hover:bg-gray-100 transition-colors',
          triggerClassName
        )}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]', hideClass)}
              onClick={onClose}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, x: slideFrom }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: slideFrom }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className={cn(
                'fixed top-0 h-full w-[min(100vw,20rem)] bg-white shadow-2xl z-[70] flex flex-col safe-area-top',
                side === 'right' ? 'right-0' : 'left-0',
                hideClass,
                panelClassName
              )}
              role="dialog"
              aria-modal="true"
              aria-label={title}
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
                <span className="text-lg font-semibold text-gray-900">{title}</span>
                <button
                  type="button"
                  onClick={onClose}
                  className="touch-target p-2 rounded-full hover:bg-gray-100 text-gray-600"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 safe-area-bottom">{children}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
