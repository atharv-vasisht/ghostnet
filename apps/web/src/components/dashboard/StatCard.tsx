import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  delta: number;
  deltaLabel: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  className,
}: StatCardProps) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
          {label}
        </span>
        <div className="rounded-badge bg-elevated p-1.5">
          <Icon size={18} className="text-cyan" />
        </div>
      </div>

      <div className="mt-2 font-heading text-[36px] font-semibold leading-tight text-text-primary">
        {value}
      </div>

      <div
        className={cn(
          'mt-2 flex items-center gap-1 text-xs',
          isPositive && 'text-threat-safe',
          isNegative && 'text-threat-critical',
          !isPositive && !isNegative && 'text-text-muted'
        )}
      >
        {isPositive && <ArrowUp size={12} />}
        {isNegative && <ArrowDown size={12} />}
        {!isPositive && !isNegative && <Minus size={12} />}
        <span className="font-mono">
          {isPositive ? '+' : ''}
          {delta}
        </span>
        <span className="text-text-muted">{deltaLabel}</span>
      </div>
    </div>
  );
}
