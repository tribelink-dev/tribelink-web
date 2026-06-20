'use client';

import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Review trip' },
  { id: 2, label: 'Experiences' },
  { id: 3, label: 'Payment' },
  { id: 4, label: 'Confirmation' },
];

interface CheckoutStepsProps {
  currentStep: number;
  className?: string;
}

export default function CheckoutSteps({ currentStep, className }: CheckoutStepsProps) {
  return (
    <nav aria-label="Checkout progress" className={cn('flex items-center gap-2 mb-8', className)}>
      {STEPS.map((step, i) => (
        <div key={step.id} className="flex items-center gap-2 flex-1">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
              currentStep >= step.id
                ? 'bg-brand text-white'
                : 'bg-surface-muted text-text-secondary'
            )}
          >
            {step.id}
          </div>
          <span
            className={cn(
              'text-xs sm:text-sm hidden sm:block',
              currentStep >= step.id ? 'text-text-primary font-medium' : 'text-text-secondary'
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px mx-2', currentStep > step.id ? 'bg-brand' : 'bg-border')} />
          )}
        </div>
      ))}
    </nav>
  );
}
