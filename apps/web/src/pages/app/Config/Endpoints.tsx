import { useQuery } from '@tanstack/react-query';
import { Link2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { CopyButton } from '@/components/shared/CopyButton';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonRow } from '@/components/shared/SkeletonLoader';
import { cn } from '@/lib/utils';

interface EndpointEntry {
  id: string;
  service: string;
  path: string;
  method: string;
  protocol: string;
  url: string;
}

const PROTOCOL_STYLES: Record<string, string> = {
  'AWS IAM': 'bg-cyan/15 text-cyan border-cyan/25',
  'REST API': 'bg-threat-medium/15 text-threat-medium border-threat-medium/25',
  'AWS Secrets': 'bg-threat-critical/15 text-threat-critical border-threat-critical/25',
  S3: 'bg-threat-safe/15 text-threat-safe border-threat-safe/25',
};

const METHOD_STYLES: Record<string, string> = {
  GET: 'text-threat-safe',
  POST: 'text-threat-medium',
  PUT: 'text-threat-high',
  PATCH: 'text-threat-high',
  DELETE: 'text-threat-critical',
};

export default function Endpoints() {
  const { data: endpoints, isLoading, isError } = useQuery({
    queryKey: ['config', 'endpoints'],
    queryFn: async () => {
      const { data } = await api.get<EndpointEntry[]>('/config/endpoints');
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-card border border-border bg-surface">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-threat-critical" />
          <p className="text-sm text-threat-critical">Failed to load endpoints</p>
        </div>
      </div>
    );
  }

  if (!endpoints || endpoints.length === 0) {
    return (
      <EmptyState
        icon={Link2}
        title="No endpoints configured"
        description="Endpoints will appear here once services are enabled and deployed"
      />
    );
  }

  const grouped = endpoints.reduce<Record<string, EndpointEntry[]>>((acc, ep) => {
    (acc[ep.service] ??= []).push(ep);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <p className="text-sm text-text-secondary">
        All configured deception endpoints. These URLs are read-only and
        determined by your enabled services.
      </p>

      {Object.entries(grouped).map(([service, eps]) => (
        <div key={service}>
          <h3 className="mb-2 font-heading text-sm font-semibold capitalize text-text-primary">
            {service}
          </h3>
          <div className="rounded-card border border-border bg-surface">
            {eps.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center gap-3 border-b border-border px-4 py-2.5 last:border-b-0"
              >
                {/* Method */}
                <span
                  className={cn(
                    'w-12 shrink-0 font-mono text-[11px] font-bold uppercase',
                    METHOD_STYLES[ep.method] ?? 'text-text-secondary'
                  )}
                >
                  {ep.method}
                </span>

                {/* Protocol badge */}
                <span
                  className={cn(
                    'shrink-0 rounded-badge border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                    PROTOCOL_STYLES[ep.protocol] ?? 'border-border bg-elevated text-text-secondary'
                  )}
                >
                  {ep.protocol}
                </span>

                {/* URL */}
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
                  {ep.url}
                </span>

                <CopyButton value={ep.url} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
