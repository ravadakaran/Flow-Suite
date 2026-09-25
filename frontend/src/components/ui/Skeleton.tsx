import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'title' | 'card' | 'avatar' | 'badge';
  width?: string;
}

export function Skeleton({ className, variant = 'text', width }: SkeletonProps) {
  const base = 'skeleton';
  const variants: Record<string, string> = {
    text:   'skeleton-text',
    title:  'skeleton-title',
    card:   'skeleton-card',
    avatar: 'w-10 h-10 rounded-xl',
    badge:  'h-6 w-20 rounded-full',
  };

  return (
    <div
      className={cn(base, variants[variant], className)}
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  );
}

/** Skeleton for a stat card (matches the stat-card layout) */
export function StatCardSkeleton() {
  return (
    <div className="stat-card space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
        <Skeleton variant="avatar" />
      </div>
      <Skeleton variant="title" width="40%" />
    </div>
  );
}

/** Skeleton for a project card */
export function ProjectCardSkeleton() {
  return (
    <div className="card-glass space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton variant="avatar" />
        <Skeleton variant="badge" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="title" width="70%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="50%" />
      </div>
    </div>
  );
}

/** Skeleton for a task row */
export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)]">
      <Skeleton variant="avatar" className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
      </div>
      <Skeleton variant="badge" />
      <Skeleton variant="badge" />
    </div>
  );
}

/** Skeleton for a Kanban column */
export function KanbanColumnSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton variant="card" className="h-12" />
      {[1, 2, 3].map(i => (
        <div key={i} className="card-glass space-y-3">
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="50%" />
          <div className="flex gap-2">
            <Skeleton variant="badge" />
            <Skeleton variant="badge" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a team member row */
export function MemberRowSkeleton() {
  return (
    <div className="card-glass flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="45%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <Skeleton variant="badge" />
    </div>
  );
}
