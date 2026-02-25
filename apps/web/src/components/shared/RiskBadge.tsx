import type { RiskLevel } from '@ghostnet/shared';
import { cn } from '@/lib/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

const RISK_STYLES: Record<RiskLevel, string> = {
  CRITICAL: 'bg-[#FF3B5C22] text-threat-critical border-[#FF3B5C44]',
  HIGH: 'bg-[#FF6B3522] text-threat-high border-[#FF6B3544]',
  MEDIUM: 'bg-[#FFB80022] text-threat-medium border-[#FFB80044]',
  LOW: 'bg-[#00D4FF22] text-threat-low border-[#00D4FF44]',
};

export function RiskBadge({ level, className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-badge border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide',
        RISK_STYLES[level],
        className
      )}
    >
      {level}
    </span>
  );
}
