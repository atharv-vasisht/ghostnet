import { ArrowRight } from 'lucide-react';
import { ServiceBadge } from '@/components/sessions/ServiceBadge';
import { cn } from '@/lib/utils';

interface ExplorationPathProps {
  path: string[];
  className?: string;
}

export function ExplorationPath({ path, className }: ExplorationPathProps) {
  if (path.length === 0) {
    return (
      <p className="text-xs text-text-muted italic">
        No exploration path recorded
      </p>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {path.map((service, i) => (
        <span key={`${service}-${i}`} className="inline-flex items-center gap-1.5">
          <ServiceBadge service={service} />
          {i < path.length - 1 && (
            <ArrowRight size={12} className="shrink-0 text-text-muted" />
          )}
        </span>
      ))}
    </div>
  );
}
