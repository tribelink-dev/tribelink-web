import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeader({ title, description, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 md:mb-8', className)} {...props}>
      <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">{title}</h1>
      {description && (
        <p className="text-sm md:text-base text-text-secondary mt-1 max-w-3xl">{description}</p>
      )}
    </div>
  );
}
