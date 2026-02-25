import { useState, useCallback } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiskLevel, SessionFilters as FilterState } from '@ghostnet/shared';

interface SessionFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

const RISK_LEVELS: { value: RiskLevel; label: string; color: string }[] = [
  { value: 'CRITICAL', label: 'Critical', color: 'text-threat-critical' },
  { value: 'HIGH', label: 'High', color: 'text-threat-high' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-threat-medium' },
  { value: 'LOW', label: 'Low', color: 'text-threat-low' },
];

const SERVICES = [
  { id: 'iam', label: 'IAM' },
  { id: 'oauth', label: 'OAuth' },
  { id: 'secrets', label: 'Secrets' },
  { id: 'api', label: 'Internal API' },
  { id: 's3', label: 'S3' },
  { id: 'discovery', label: 'Discovery' },
];

export function SessionFilters({
  filters,
  onChange,
  className,
}: SessionFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleRisk = useCallback(
    (level: RiskLevel) => {
      const current = filters.riskLevels ?? [];
      const next = current.includes(level)
        ? current.filter((l) => l !== level)
        : [...current, level];
      onChange({ ...filters, riskLevels: next.length > 0 ? next : undefined });
    },
    [filters, onChange]
  );

  const toggleService = useCallback(
    (svc: string) => {
      const current = filters.services ?? [];
      const next = current.includes(svc)
        ? current.filter((s) => s !== svc)
        : [...current, svc];
      onChange({ ...filters, services: next.length > 0 ? next : undefined });
    },
    [filters, onChange]
  );

  const hasActiveFilters =
    (filters.riskLevels?.length ?? 0) > 0 ||
    (filters.services?.length ?? 0) > 0 ||
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.sourceIp;

  const clearAll = () => {
    onChange({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    });
  };

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        className
      )}
    >
      {/* Toggle bar */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-elevated"
      >
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">
            Filters
          </span>
          {hasActiveFilters && (
            <span className="rounded-badge bg-cyan/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-cyan">
              Active
            </span>
          )}
        </div>
        <span className="text-[11px] text-text-muted">
          {isExpanded ? 'Collapse' : 'Expand'}
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-4 py-4">
          <div className="flex flex-wrap items-start gap-6">
            {/* Risk Levels */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Risk Level
              </label>
              <div className="flex flex-wrap gap-2">
                {RISK_LEVELS.map(({ value, label, color }) => {
                  const active = filters.riskLevels?.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleRisk(value)}
                      className={cn(
                        'rounded-input border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                        active
                          ? `border-current bg-current/10 ${color}`
                          : 'border-border text-text-secondary hover:border-text-muted'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Services */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Service Touched
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICES.map(({ id, label }) => {
                  const active = filters.services?.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleService(id)}
                      className={cn(
                        'rounded-input border px-2.5 py-1 text-xs font-medium transition-colors duration-150',
                        active
                          ? 'border-cyan/40 bg-cyan/10 text-cyan'
                          : 'border-border text-text-secondary hover:border-text-muted'
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date range */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dateFrom: e.target.value || undefined,
                    })
                  }
                  className="rounded-input border border-border bg-elevated px-2.5 py-1 font-mono text-xs text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
                />
                <span className="text-[11px] text-text-muted">to</span>
                <input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      dateTo: e.target.value || undefined,
                    })
                  }
                  className="rounded-input border border-border bg-elevated px-2.5 py-1 font-mono text-xs text-text-primary outline-none transition-colors duration-150 focus:border-cyan"
                />
              </div>
            </div>

            {/* Source IP */}
            <div>
              <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                Source IP
              </label>
              <input
                type="text"
                placeholder="e.g. 10.0.0.1"
                value={filters.sourceIp ?? ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    sourceIp: e.target.value || undefined,
                  })
                }
                className="w-36 rounded-input border border-border bg-elevated px-2.5 py-1 font-mono text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
              />
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="mt-4 border-t border-border pt-3">
              <button
                type="button"
                onClick={clearAll}
                className="flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
              >
                <X size={14} />
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
