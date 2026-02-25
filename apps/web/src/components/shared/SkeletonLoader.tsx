import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  lines?: number;
}

function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-badge bg-elevated',
        className
      )}
    />
  );
}

export function SkeletonLoader({ className, lines = 3 }: SkeletonLoaderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-4',
        className
      )}
    >
      <SkeletonLine className="mb-3 h-4 w-1/3" />
      <SkeletonLine className="mb-2 h-3 w-full" />
      <SkeletonLine className="mb-2 h-3 w-full" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 border-b border-border px-4 py-3',
        className
      )}
    >
      <SkeletonLine className="h-3 w-16" />
      <SkeletonLine className="h-3 w-24" />
      <SkeletonLine className="h-3 flex-1" />
      <SkeletonLine className="h-3 w-20" />
    </div>
  );
}
