import {
  Activity,
  Zap,
  AlertTriangle,
  TrendingUp,
  Bell,
  Clock,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useSessions } from '@/hooks/useSessions';
import { useAlerts } from '@/hooks/useAlerts';
import { StatCard } from '@/components/dashboard/StatCard';
import { LiveFeed } from '@/components/dashboard/LiveFeed';
import { ServiceMatrix } from '@/components/dashboard/ServiceMatrix';
import { RiskTimeline } from '@/components/dashboard/RiskTimeline';
import { SessionTable } from '@/components/sessions/SessionTable';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Alert } from '@ghostnet/shared';

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <div className="flex items-start gap-3 border-b border-border px-4 py-3 transition-colors duration-150 last:border-b-0 hover:bg-elevated">
      <div className="mt-0.5 shrink-0">
        <RiskBadge level={alert.severity} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-text-primary">
          {alert.title}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-text-secondary">
          {alert.description}
        </p>
      </div>
      <span className="shrink-0 font-mono text-[11px] text-text-muted">
        {formatRelativeTime(alert.createdAt)}
      </span>
    </div>
  );
}

function RecentAlerts({
  alerts,
  isLoading,
  className,
}: {
  alerts: Alert[];
  isLoading: boolean;
  className?: string;
}) {
  const recent = alerts
    .filter((a) => !a.acknowledged)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bell size={18} className="text-threat-critical" />
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          Recent Alerts
        </h3>
        {recent.length > 0 && (
          <span className="rounded-badge bg-threat-critical/15 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-threat-critical">
            {recent.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-4">
          <SkeletonCard />
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No recent alerts"
          description="Alert rules will trigger notifications when suspicious patterns are detected"
        />
      ) : (
        <div>
          {recent.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
  } = useDashboardStats();

  const {
    data: sessionsData,
    isLoading: sessionsLoading,
  } = useSessions({
    sortBy: 'lastSeenAt',
    sortOrder: 'desc',
    limit: 5,
  });

  const {
    data: alerts,
    isLoading: alertsLoading,
  } = useAlerts();

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        {/* Row 1 — Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                label="Active Sessions"
                value={stats?.activeSessions ?? 0}
                delta={stats?.sessionsDelta ?? 0}
                deltaLabel="from yesterday"
                icon={Activity}
              />
              <StatCard
                label="Total Events"
                value={stats?.totalEvents ?? 0}
                delta={stats?.eventsDelta ?? 0}
                deltaLabel="from yesterday"
                icon={Zap}
              />
              <StatCard
                label="Active Alerts"
                value={stats?.activeAlerts ?? 0}
                delta={stats?.alertsDelta ?? 0}
                deltaLabel="from yesterday"
                icon={AlertTriangle}
              />
              <StatCard
                label="Avg Risk Score"
                value={stats?.avgRiskScore ?? 0}
                delta={stats?.riskDelta ?? 0}
                deltaLabel="from yesterday"
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Row 2 — Live Feed + Service Matrix */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3" style={{ minHeight: 420 }}>
            <LiveFeed className="h-full" />
          </div>
          <div className="lg:col-span-2">
            <ServiceMatrix
              serviceActivity={stats?.serviceActivity ?? {}}
              className="h-full"
            />
          </div>
        </div>

        {/* Row 3 — Risk Timeline */}
        <RiskTimeline data={stats?.riskTimeline ?? []} />

        {/* Row 4 — Sessions + Alerts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SessionTable
              sessions={sessionsData?.sessions ?? []}
              isLoading={sessionsLoading}
              maxRows={5}
            />
          </div>
          <div className="lg:col-span-2">
            <RecentAlerts
              alerts={Array.isArray(alerts) ? alerts : []}
              isLoading={alertsLoading}
            />
          </div>
        </div>

        {/* Timestamp footer */}
        <div className="flex items-center gap-2 pb-2">
          <Clock size={12} className="text-text-muted" />
          <span className="font-mono text-[10px] text-text-muted">
            Dashboard auto-refreshes every 30s
          </span>
        </div>
      </div>
    </div>
  );
}
