import { cn } from '@/lib/utils';

interface LiveDotProps {
  color?: string;
  className?: string;
}

export function LiveDot({ color, className }: LiveDotProps) {
  return (
    <span
      className={cn('relative flex h-2 w-2', className)}
    >
      <span
        className={cn(
          'absolute inline-flex h-full w-full animate-live-pulse rounded-full opacity-75',
          color ?? 'bg-threat-safe'
        )}
      />
      <span
        className={cn(
          'relative inline-flex h-2 w-2 rounded-full',
          color ?? 'bg-threat-safe'
        )}
      />
    </span>
  );
}
