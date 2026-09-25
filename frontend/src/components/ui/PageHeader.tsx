import { type ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

/** Standardized page header used across all pages for visual consistency. */
export function PageHeader({ eyebrow, title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 animate-fade-up', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="page-eyebrow">{eyebrow}</p>
        )}
        <h1 className="page-title truncate">{title}</h1>
        {subtitle && (
          <p className="page-subtitle">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0 pt-1">
          {action}
        </div>
      )}
    </div>
  );
}
