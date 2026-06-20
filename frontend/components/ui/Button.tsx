'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-hover shadow-sm disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-surface text-text-primary border border-border hover:bg-surface-muted disabled:opacity-50',
  ghost:
    'bg-transparent text-text-primary hover:bg-surface-muted disabled:opacity-50',
  outline:
    'bg-transparent text-text-primary border border-text-primary hover:bg-surface-muted disabled:opacity-50',
  icon:
    'bg-transparent text-text-primary hover:bg-surface-muted p-0 disabled:opacity-50',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm rounded-lg',
  md: 'h-11 px-6 text-sm font-semibold rounded-xl',
  lg: 'h-12 px-8 text-base font-semibold rounded-xl',
  icon: 'h-10 w-10 rounded-full flex items-center justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', type = 'button', ...props }, ref) => {
    const resolvedSize = variant === 'icon' ? 'icon' : size;

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-colors touch-target',
          variantStyles[variant],
          sizeStyles[resolvedSize],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
