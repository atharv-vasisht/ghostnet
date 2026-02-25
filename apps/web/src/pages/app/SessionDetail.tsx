import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Globe,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useSession } from '@/hooks/useSessions';
import { useEvents } from '@/hooks/useEvents';
import { useBeliefState } from '@/hooks/useBeliefState';
import { useAuthStore } from '@/lib/auth';
import { useDemoGuard } from '@/hooks/useDemoGuard';
import { BeliefStatePanel } from '@/components/session-detail/BeliefStatePanel';
import { EventTimeline } from '@/components/session-detail/EventTimeline';
import { IOCPanel } from '@/components/session-detail/IOCPanel';
import { ConfidenceGauge } from '@/components/session-detail/ConfidenceGauge';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { CopyButton } from '@/components/shared/CopyButton';
import { LiveDot } from '@/components/shared/LiveDot';
import { SkeletonLoader, SkeletonCard } from '@/components/shared/SkeletonLoader';
import { cn, formatTimestamp, formatRelativeTime } from '@/lib/utils';
import type { SessionStatus } from '@ghostnet/shared';

const STATUS_DOT_COLORS: Record<SessionStatus, string> = {
  ACTIVE: 'bg-threat-safe',
  IDLE: 'bg-threat-medium',
  CLOSED: 'bg-text-muted',
};

function formatDuration(first: string, last: string): string {
  const ms = new Date(last).getTime() - new Date(first).getTime();
  if (ms < 0) return '—';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDemo = useAuthStore((s) => s.isDemo);
  const { showGuard } = useDemoGuard();
  const basePath = isDemo ? '/demo' : '/app';

  const { data: session, isLoading, isError } = useSession(id);
  const { data: eventsData, isLoading: eventsLoading, isError: eventsError } = useEvents(
    id ? { sessionId: id } : undefined
  );
  const beliefState = useBeliefState(id);

  const events = eventsData?.events ?? [];

  if (isLoading) {
    return (
      <div className="min-h-full bg-void p-6">
        <div className="mx-auto max-w-[1440px] space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-pulse rounded bg-elevated" />
            <SkeletonLoader lines={2} className="w-48" />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr_250px]">
            <SkeletonCard />
            <SkeletonCard className="min-h-[400px]" />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="min-h-full bg-void p-6">
        <div className="mx-auto max-w-[1440px]">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/sessions`)}
            className="mb-6 flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
          >
            <ArrowLeft size={18} />
            Back to Sessions
          </button>
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle size={48} className="mb-4 text-threat-critical" />
            <h2 className="font-heading text-base font-semibold text-text-primary">
              Session not found
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              The session may have been deleted or the ID is invalid.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Back + Header */}
        <div>
          <button
            type="button"
            onClick={() => navigate(`${basePath}/sessions`)}
            className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary transition-colors duration-150 hover:text-text-primary"
          >
            <ArrowLeft size={18} />
            Back to Sessions
          </button>

          <div className="flex flex-wrap items-start justify-between gap-4 rounded-card border border-border bg-surface p-5">
            <div className="flex flex-wrap items-start gap-6">
              {/* Session ID & time */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-text-muted">
                    {session.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <LiveDot color={STATUS_DOT_COLORS[session.status]} />
                    <span
                      className={cn(
                        'text-xs font-medium',
                        session.status === 'ACTIVE' && 'text-threat-safe',
                        session.status === 'IDLE' && 'text-threat-medium',
                        session.status === 'CLOSED' && 'text-text-muted'
                      )}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatTimestamp(session.firstSeenAt)}
                  </span>
                  <span>
                    Duration: {formatDuration(session.firstSeenAt, session.lastSeenAt)}
                  </span>
                </div>
              </div>

              {/* Source IP + UA */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Globe size={14} className="text-text-muted" />
                  <span className="font-mono text-sm text-text-primary">
                    {session.sourceIp}
                  </span>
                  <CopyButton value={session.sourceIp} />
                </div>
                <p
                  className="max-w-xs truncate text-[11px] text-text-muted"
                  title={session.userAgent}
                >
                  {session.userAgent}
                </p>
              </div>

              {/* Risk Badge */}
              <div className="flex items-center gap-3">
                <RiskBadge level={session.riskLevel} />
              </div>
            </div>

            {/* Risk Gauge + Export */}
            <div className="flex items-center gap-6">
              <ConfidenceGauge
                value={session.riskScore}
                size={72}
                strokeWidth={6}
                label="Risk"
              />
              {isDemo ? (
                <button
                  type="button"
                  onClick={showGuard}
                  className="flex items-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary"
                >
                  <FileText size={14} />
                  Export Report
                </button>
              ) : (
                <Link
                  to={`/app/sessions/${session.id}/report`}
                  className="flex items-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary"
                >
                  <FileText size={14} />
                  Export Report
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[30%_45%_25%]">
          {/* Column 1 — Belief State */}
          <div className="rounded-card border border-border bg-surface p-4">
            <BeliefStatePanel session={session} beliefState={beliefState} />
          </div>

          {/* Column 2 — Event Timeline */}
          <div className="rounded-card border border-border bg-surface">
            <EventTimeline
              events={events}
              isLoading={eventsLoading}
              isError={eventsError}
            />
          </div>

          {/* Column 3 — IOC Panel */}
          <div className="rounded-card border border-border bg-surface p-4">
            <IOCPanel session={session} events={events} />
          </div>
        </div>
      </div>
    </div>
  );
}
