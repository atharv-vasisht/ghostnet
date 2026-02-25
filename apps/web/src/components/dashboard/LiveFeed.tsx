import { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, Radio } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useEvents } from '@/hooks/useEvents';
import { LiveDot } from '@/components/shared/LiveDot';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { ServiceBadge } from '@/components/sessions/ServiceBadge';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatTimestamp } from '@/lib/utils';
import type { AgentEvent, RiskLevel } from '@ghostnet/shared';

const MAX_EVENTS = 50;

function inferRiskLevel(event: AgentEvent): RiskLevel {
  const tags = event.tags;
  if (
    tags.includes('exfiltration_attempt') ||
    tags.includes('persistence_attempt')
  )
    return 'CRITICAL';
  if (
    tags.includes('credential_harvesting') ||
    tags.includes('lateral_movement')
  )
    return 'HIGH';
  if (tags.includes('deep_probe')) return 'MEDIUM';
  return 'LOW';
}

interface LiveFeedProps {
  className?: string;
}

export function LiveFeed({ className }: LiveFeedProps) {
  const { subscribe, isConnected } = useSocket();
  const { data: initialData, isLoading } = useEvents({ limit: 25 });
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isUserScrolled = useRef(false);

  useEffect(() => {
    if (initialData?.events) {
      setEvents(initialData.events.slice(0, MAX_EVENTS));
    }
  }, [initialData]);

  useEffect(() => {
    const unsub = subscribe<{ event: AgentEvent }>(
      'event:new',
      ({ event }) => {
        setEvents((prev) => [event, ...prev].slice(0, MAX_EVENTS));
      }
    );
    return unsub;
  }, [subscribe]);

  useEffect(() => {
    if (!isPaused && !isUserScrolled.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events, isPaused]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const scrolledDown = scrollRef.current.scrollTop > 10;
    isUserScrolled.current = scrolledDown;
    if (scrolledDown && !isPaused) {
      setIsPaused(true);
    }
  }, [isPaused]);

  const togglePause = () => {
    setIsPaused((prev) => {
      if (prev && scrollRef.current) {
        scrollRef.current.scrollTop = 0;
        isUserScrolled.current = false;
      }
      return !prev;
    });
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-card border border-border bg-surface p-4',
          className
        )}
      >
        <SkeletonLoader lines={10} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-card border border-border bg-surface',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-cyan" />
          <h3 className="font-heading text-sm font-semibold text-text-primary">
            Live Event Feed
          </h3>
          <LiveDot />
          {isConnected && (
            <span className="text-[10px] uppercase tracking-wider text-threat-safe">
              LIVE
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={togglePause}
          className={cn(
            'flex items-center gap-1.5 rounded-input px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
            isPaused
              ? 'bg-threat-medium/20 text-threat-medium hover:bg-threat-medium/30'
              : 'bg-elevated text-text-secondary hover:text-text-primary'
          )}
        >
          {isPaused ? <Play size={12} /> : <Pause size={12} />}
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Event list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {events.length === 0 ? (
          <EmptyState
            icon={Radio}
            title="No events yet"
            description="Events will appear here as they are captured by deception services"
          />
        ) : (
          <div className="divide-y divide-border">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-elevated"
              >
                <span className="w-[110px] shrink-0 font-mono text-[11px] text-text-muted">
                  {formatTimestamp(event.timestamp)}
                </span>
                <ServiceBadge service={event.targetService} />
                <span className="min-w-0 flex-1 truncate text-xs text-text-primary">
                  {event.action}
                </span>
                <span className="hidden shrink-0 font-mono text-[11px] text-text-secondary md:inline">
                  {event.sourceIp}
                </span>
                <RiskBadge level={inferRiskLevel(event)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
