import { Activity, AlertCircle } from 'lucide-react';
import { RawEventViewer } from './RawEventViewer';
import { SkeletonRow } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { AgentEvent } from '@ghostnet/shared';

interface EventTimelineProps {
  events: AgentEvent[];
  isLoading?: boolean;
  isError?: boolean;
  className?: string;
}

export function EventTimeline({
  events,
  isLoading,
  isError,
  className,
}: EventTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Activity size={18} className="text-cyan" />
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Event Timeline
        </h2>
        {events.length > 0 && (
          <span className="rounded-badge bg-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan">
            {events.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 px-4 py-6">
            <AlertCircle size={18} className="text-threat-critical" />
            <p className="text-sm text-threat-critical">Failed to load events</p>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No events yet"
            description="Events will appear here as the agent interacts with deception services"
          />
        ) : (
          <div>
            {sorted.map((event) => (
              <RawEventViewer key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
