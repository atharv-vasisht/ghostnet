import { useState, useCallback } from 'react';
import {
  FileText,
  ChevronDown,
  AlertCircle,
  Brain,
  Activity,
  Shield,
  Lightbulb,
  Printer,
} from 'lucide-react';
import { useSessions, useSession } from '@/hooks/useSessions';
import { useEvents } from '@/hooks/useEvents';
import { useBeliefState } from '@/hooks/useBeliefState';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { ServiceBadge } from '@/components/sessions/ServiceBadge';
import { ExplorationPath } from '@/components/session-detail/ExplorationPath';
import { ConfidenceGauge } from '@/components/session-detail/ConfidenceGauge';
import { CopyButton } from '@/components/shared/CopyButton';
import { SkeletonLoader, SkeletonCard } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatTimestamp, formatRelativeTime } from '@/lib/utils';
import type { AgentSession, AgentEvent } from '@ghostnet/shared';

const TAG_LABELS: Record<string, string> = {
  initial_recon: 'Initial Reconnaissance',
  credential_harvesting: 'Credential Harvesting',
  lateral_movement: 'Lateral Movement',
  exfiltration_attempt: 'Exfiltration Attempt',
  deep_probe: 'Deep Probe',
  persistence_attempt: 'Persistence Attempt',
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

function generateRecommendations(
  session: AgentSession,
  events: AgentEvent[]
): string[] {
  const recs: string[] = [];
  const tags = events.flatMap((e) => e.tags);
  const uniqueServices = [...new Set(events.map((e) => e.targetService))];

  if (session.riskScore >= 70) {
    recs.push(
      'CRITICAL: Immediately rotate all credentials that were accessed during this session and audit IAM policies.'
    );
  }

  if (tags.includes('credential_harvesting')) {
    recs.push(
      'Review all credentials retrieved by the agent. Mark any real credentials for immediate rotation.'
    );
  }

  if (tags.includes('lateral_movement')) {
    recs.push(
      'The agent demonstrated lateral movement capability. Review network segmentation and service-to-service authentication.'
    );
  }

  if (tags.includes('exfiltration_attempt')) {
    recs.push(
      'Exfiltration behavior detected. Verify DLP controls and monitor for similar patterns on production infrastructure.'
    );
  }

  if (uniqueServices.length >= 4) {
    recs.push(
      'The agent explored multiple services extensively. Consider increasing deception depth to prolong engagement and gather more intelligence.'
    );
  }

  if (session.eventCount > 50) {
    recs.push(
      'High event volume suggests an automated agent. Update rate-limiting rules and detection signatures.'
    );
  }

  if (recs.length === 0) {
    recs.push(
      'Continue monitoring. No immediate action required based on current threat assessment.'
    );
  }

  return recs;
}

// ─── Session Selector ─────────────────────────────────────────────────

function SessionSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useSessions({
    sortBy: 'lastSeenAt',
    sortOrder: 'desc',
    limit: 50,
  });

  const sessions = data?.sessions ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between gap-2 rounded-input border border-border bg-elevated px-4 py-2.5 text-sm text-text-primary transition-colors duration-150 hover:bg-border"
      >
        <span className={selectedId ? 'text-text-primary' : 'text-text-muted'}>
          {selectedId
            ? `Session ${selectedId.slice(0, 8)}…`
            : 'Select a session to generate report'}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-muted transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-lg">
          {isLoading ? (
            <div className="p-3">
              <SkeletonLoader lines={3} />
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-4 py-3 text-xs text-text-muted">
              No sessions available
            </p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(s.id);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors duration-150 last:border-b-0 hover:bg-elevated',
                  selectedId === s.id && 'bg-cyan/5'
                )}
              >
                <RiskBadge level={s.riskLevel} />
                <span className="font-mono text-xs text-text-primary">
                  {s.sourceIp}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {formatRelativeTime(s.lastSeenAt)}
                </span>
                <span className="ml-auto font-mono text-[10px] text-text-muted">
                  {s.id.slice(0, 8)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Report View ──────────────────────────────────────────────────────

function ReportView({ sessionId }: { sessionId: string }) {
  const { data: session, isLoading, isError } = useSession(sessionId);
  const { data: eventsData, isLoading: eventsLoading } = useEvents({
    sessionId,
  });
  const beliefState = useBeliefState(sessionId);

  const events = eventsData?.events ?? [];
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  if (isLoading || eventsLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard className="min-h-[200px]" />
        <SkeletonCard className="min-h-[200px]" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="flex items-center gap-2 rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
        <AlertCircle size={18} className="text-threat-critical" />
        <p className="text-sm text-threat-critical">Failed to load session data</p>
      </div>
    );
  }

  const goal = beliefState?.inferredGoal?.goal ?? session.inferredGoal;
  const explorationPath = beliefState?.explorationPath ?? session.explorationPath;
  const assets = beliefState?.discoveredAssets ?? session.believedAssets ?? [];
  const recommendations = generateRecommendations(session, events);

  const allTags = events.flatMap((e) => e.tags);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="print-report space-y-6">
      {/* ── Executive Summary ──────────────────────────────── */}
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileText size={18} className="text-cyan" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Executive Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Session ID
            </span>
            <p className="mt-1 font-mono text-xs text-text-primary">
              {session.id.slice(0, 12)}…
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Risk Level
            </span>
            <div className="mt-1">
              <RiskBadge level={session.riskLevel} />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Duration
            </span>
            <p className="mt-1 font-mono text-xs text-text-primary">
              {formatDuration(session.firstSeenAt, session.lastSeenAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Total Events
            </span>
            <p className="mt-1 font-mono text-xs text-text-primary">
              {session.eventCount}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-6 lg:grid-cols-4">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Source IP
            </span>
            <div className="mt-1 flex items-center gap-1">
              <span className="font-mono text-xs text-text-primary">
                {session.sourceIp}
              </span>
              <CopyButton value={session.sourceIp} />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              First Seen
            </span>
            <p className="mt-1 text-xs text-text-primary">
              {formatTimestamp(session.firstSeenAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Last Seen
            </span>
            <p className="mt-1 text-xs text-text-primary">
              {formatTimestamp(session.lastSeenAt)}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Services Touched
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {session.servicesTouched.map((svc) => (
                <ServiceBadge key={svc} service={svc} />
              ))}
            </div>
          </div>
        </div>

        {goal && (
          <div className="mt-4 rounded-input border border-border bg-elevated px-4 py-3">
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Inferred Goal
            </span>
            <p className="mt-1 text-sm font-medium text-text-primary">
              {goal}
            </p>
          </div>
        )}
      </section>

      {/* ── Timeline ───────────────────────────────────────── */}
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Activity size={18} className="text-cyan" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Event Timeline
          </h2>
        </div>
        {sortedEvents.length === 0 ? (
          <p className="text-xs text-text-muted italic">No events recorded</p>
        ) : (
          <div className="space-y-1">
            {sortedEvents.map((event, i) => (
              <div
                key={event.id}
                className="flex items-center gap-3 border-b border-border py-2 last:border-b-0"
              >
                <span className="w-6 shrink-0 text-right font-mono text-[10px] text-text-muted">
                  {i + 1}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-text-secondary">
                  {formatTimestamp(event.timestamp)}
                </span>
                <ServiceBadge service={event.targetService} />
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
                  {event.action}
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[11px]',
                    event.responseCode < 300 ? 'text-threat-safe' : 'text-threat-critical'
                  )}
                >
                  {event.responseCode}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-text-muted">
                  {event.durationMs}ms
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Belief State ───────────────────────────────────── */}
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Brain size={18} className="text-cyan" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Belief State Analysis
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Exploration Path
            </span>
            <div className="mt-2">
              <ExplorationPath path={explorationPath} />
            </div>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Discovered Assets ({assets.length})
            </span>
            <div className="mt-2 space-y-1">
              {assets.length === 0 ? (
                <p className="text-xs text-text-muted italic">None</p>
              ) : (
                assets.map((a, i) => (
                  <div key={`${a.value}-${i}`} className="flex items-center gap-2">
                    <span className="rounded-badge bg-border px-1.5 py-0.5 text-[9px] uppercase text-text-muted">
                      {a.type}
                    </span>
                    <span className="truncate font-mono text-xs text-text-primary">
                      {a.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <span className="mb-2 text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Confidence Score
            </span>
            <ConfidenceGauge
              value={Math.round(session.goalConfidence * 100)}
              size={80}
              strokeWidth={6}
            />
          </div>
        </div>
      </section>

      {/* ── IOCs ───────────────────────────────────────────── */}
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-threat-critical" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Indicators of Compromise
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Source IP
            </span>
            <p className="mt-1 font-mono text-xs text-text-primary">
              {session.sourceIp}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              User Agent
            </span>
            <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-text-primary">
              {session.userAgent}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
              Behavioral Signatures
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {Object.entries(tagCounts).length === 0 ? (
                <p className="text-xs text-text-muted italic">None</p>
              ) : (
                Object.entries(tagCounts).map(([tag, count]) => (
                  <span
                    key={tag}
                    className="rounded-badge border border-border bg-elevated px-2 py-0.5 text-[10px] font-medium text-text-secondary"
                  >
                    {TAG_LABELS[tag] ?? tag} ×{count}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Recommendations ────────────────────────────────── */}
      <section className="rounded-card border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb size={18} className="text-threat-medium" />
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-text-secondary">
            Recommendations
          </h2>
        </div>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm leading-relaxed text-text-primary"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated font-mono text-[10px] text-text-secondary">
                {i + 1}
              </span>
              {rec}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ─── Main Reports Page ────────────────────────────────────────────────

export default function Reports() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">
              Reports
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Generate and download session analysis reports
            </p>
          </div>
          {selectedSessionId && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary"
            >
              <Printer size={18} />
              Download PDF
            </button>
          )}
        </div>

        {/* Session Selector */}
        <div className="max-w-md print:hidden">
          <SessionSelector
            selectedId={selectedSessionId}
            onSelect={setSelectedSessionId}
          />
        </div>

        {/* Report Content */}
        {selectedSessionId ? (
          <ReportView sessionId={selectedSessionId} />
        ) : (
          <EmptyState
            icon={FileText}
            title="No session selected"
            description="Select a session above to generate a detailed threat analysis report"
          />
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print-report { break-inside: avoid; }
          .print-report section { border-color: #ddd !important; background: white !important; }
          .print-report * { color: #1a1a1a !important; }
        }
      `}</style>
    </div>
  );
}
