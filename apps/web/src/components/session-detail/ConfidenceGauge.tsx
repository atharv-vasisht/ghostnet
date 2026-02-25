import { cn } from '@/lib/utils';

interface ConfidenceGaugeProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

function getGaugeColor(value: number): string {
  if (value >= 80) return '#FF3B5C';
  if (value >= 60) return '#FF6B35';
  if (value >= 40) return '#FFB800';
  return '#00D4FF';
}

function getGaugeLabel(value: number): string {
  if (value >= 80) return 'Very High';
  if (value >= 60) return 'High';
  if (value >= 40) return 'Moderate';
  if (value >= 20) return 'Low';
  return 'Minimal';
}

export function ConfidenceGauge({
  value,
  size = 100,
  strokeWidth = 8,
  label,
  className,
}: ConfidenceGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const color = getGaugeColor(clamped);

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-border"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-lg font-bold"
            style={{ color }}
          >
            {clamped}
          </span>
        </div>
      </div>
      <span className="text-[11px] font-medium text-text-secondary">
        {label ?? getGaugeLabel(clamped)}
      </span>
    </div>
  );
}
