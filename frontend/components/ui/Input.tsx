'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary',
          'placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
          error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }
>(({ className, error, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
        error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
        className
      )}
      {...props}
    />
  );
});

Select.displayName = 'Select';
