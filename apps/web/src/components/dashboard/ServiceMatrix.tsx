import { Shield, KeyRound, Lock, Globe, HardDrive, Search } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ServiceConfig {
  id: string;
  label: string;
  icon: LucideIcon;
}

const SERVICES: ServiceConfig[] = [
  { id: 'iam', label: 'IAM', icon: Shield },
  { id: 'oauth', label: 'OAuth', icon: KeyRound },
  { id: 'secrets', label: 'Secrets', icon: Lock },
  { id: 'api', label: 'Internal API', icon: Globe },
  { id: 's3', label: 'S3', icon: HardDrive },
  { id: 'discovery', label: 'Discovery', icon: Search },
];

function getIntensityClass(count: number, maxCount: number): string {
  if (maxCount === 0 || count === 0) return 'bg-elevated';
  const ratio = count / maxCount;
  if (ratio > 0.75) return 'bg-cyan/20 shadow-glow-cyan';
  if (ratio > 0.5) return 'bg-cyan/[0.12]';
  if (ratio > 0.25) return 'bg-cyan/[0.07]';
  return 'bg-cyan/[0.04]';
}

interface ServiceMatrixProps {
  serviceActivity: Record<string, number>;
  className?: string;
}

export function ServiceMatrix({
  serviceActivity,
  className,
}: ServiceMatrixProps) {
  const maxCount = Math.max(...Object.values(serviceActivity), 1);

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        className
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          Service Activity
        </h3>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Event distribution by service
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {SERVICES.map(({ id, label, icon: Icon }) => {
          const count = serviceActivity[id] ?? 0;
          return (
            <div
              key={id}
              className={cn(
                'flex items-center gap-3 rounded-card border border-border p-3 transition-all duration-150',
                getIntensityClass(count, maxCount)
              )}
            >
              <Icon size={18} className="shrink-0 text-cyan" />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-text-secondary">
                  {label}
                </div>
                <div className="font-mono text-lg font-semibold text-cyan">
                  {count}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
