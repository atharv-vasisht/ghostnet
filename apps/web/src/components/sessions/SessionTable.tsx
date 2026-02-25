import { Users } from 'lucide-react';
import { SessionRow } from '@/components/sessions/SessionRow';
import { SkeletonRow } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import type { AgentSession } from '@ghostnet/shared';

interface SessionTableProps {
  sessions: AgentSession[];
  isLoading?: boolean;
  maxRows?: number;
  className?: string;
}

const COLUMNS = [
  'Risk',
  'Source IP',
  'First Seen',
  'Events',
  'Services',
  'Status',
  '',
];

export function SessionTable({
  sessions,
  isLoading,
  maxRows = 5,
  className,
}: SessionTableProps) {
  const rows = sessions.slice(0, maxRows);

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        className
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <h3 className="font-heading text-sm font-semibold text-text-primary">
          Active Sessions
        </h3>
      </div>

      {isLoading ? (
        <div>
          {Array.from({ length: maxRows }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No active sessions"
          description="Sessions will appear here when attacker agents interact with deception services"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-elevated">
                {COLUMNS.map((col) => (
                  <th
                    key={col || '_arrow'}
                    className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-text-secondary"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
