import { useState, useCallback } from 'react';
import {
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useSessions } from '@/hooks/useSessions';
import { useAuthStore } from '@/lib/auth';
import { useDemoGuard } from '@/hooks/useDemoGuard';
import { SessionFilters } from '@/components/sessions/SessionFilters';
import { SessionRow } from '@/components/sessions/SessionRow';
import { SkeletonRow } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { SessionFilters as FilterState } from '@ghostnet/shared';

type SortField = 'firstSeenAt' | 'lastSeenAt' | 'riskScore' | 'eventCount';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'firstSeenAt', label: 'First Seen' },
  { value: 'lastSeenAt', label: 'Last Seen' },
  { value: 'riskScore', label: 'Risk Score' },
  { value: 'eventCount', label: 'Event Count' },
];

const COLUMNS = [
  'Risk',
  'Source IP',
  'First Seen',
  'Last Seen',
  'Events',
  'Services',
  'Status',
  '',
];

const PAGE_SIZE = 25;

export default function Sessions() {
  const isDemo = useAuthStore((s) => s.isDemo);
  const { showGuard } = useDemoGuard();
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'lastSeenAt',
    sortOrder: 'desc',
    page: 1,
    limit: PAGE_SIZE,
  });

  const { data, isLoading, isError, error } = useSessions(filters);
  const sessions = data?.sessions ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = filters.page ?? 1;

  const [isExporting, setIsExporting] = useState(false);

  const handleFilterChange = useCallback((next: FilterState) => {
    setFilters((prev) => ({ ...next, page: 1, limit: prev.limit }));
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      setFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder:
          prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc',
        page: 1,
      }));
    },
    []
  );

  const handlePageChange = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const handleExport = useCallback(async () => {
    if (isDemo) {
      showGuard();
      return;
    }
    setIsExporting(true);
    try {
      const { data: blob } = await api.get('/sessions/export', {
        params: filters,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ghostnet-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    } finally {
      setIsExporting(false);
    }
  }, [filters, isDemo, showGuard]);

  return (
    <div className="min-h-full bg-void p-6">
      <div className="mx-auto max-w-[1440px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">
              Sessions
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {total} session{total !== 1 ? 's' : ''} tracked
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || sessions.length === 0}
            className="flex items-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary disabled:opacity-50"
          >
            <Download size={18} />
            {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* Filters */}
        <SessionFilters
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={14} className="text-text-muted" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            Sort by
          </span>
          <div className="flex gap-1.5">
            {SORT_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleSort(value)}
                className={cn(
                  'rounded-input border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                  filters.sortBy === value
                    ? 'border-cyan/40 bg-cyan/10 text-cyan'
                    : 'border-border text-text-secondary hover:border-text-muted'
                )}
              >
                {label}
                {filters.sortBy === value && (
                  <span className="ml-1 text-[10px]">
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-threat-critical" />
              <p className="text-sm text-threat-critical">
                Failed to load sessions
                {error instanceof Error ? `: ${error.message}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-card border border-border bg-surface">
          {isLoading ? (
            <div>
              <div className="flex items-center bg-elevated px-4 py-2.5">
                {COLUMNS.map((col) => (
                  <div
                    key={col || '_arrow'}
                    className="flex-1 text-[11px] font-medium uppercase tracking-wider text-text-secondary"
                  >
                    {col}
                  </div>
                ))}
              </div>
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No sessions found"
              description="No sessions match your current filters. Try adjusting the filters or wait for new attacker activity."
              action={{
                label: 'Clear Filters',
                onClick: () =>
                  setFilters({
                    sortBy: 'lastSeenAt',
                    sortOrder: 'desc',
                    page: 1,
                    limit: PAGE_SIZE,
                  }),
              }}
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
                  {sessions.map((session) => (
                    <SessionRow key={session.id} session={session} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text-secondary">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, total)} of {total}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1.5 rounded-input border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              <span className="font-mono text-xs text-text-primary">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1.5 rounded-input border border-border px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary disabled:opacity-30 disabled:hover:bg-transparent"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
