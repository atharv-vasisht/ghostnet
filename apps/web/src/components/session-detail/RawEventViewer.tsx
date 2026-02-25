import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { JsonViewer } from '@/components/shared/JsonViewer';
import { ServiceBadge } from '@/components/sessions/ServiceBadge';
import { cn, formatRelativeTime, formatTimestamp } from '@/lib/utils';
import type { AgentEvent } from '@ghostnet/shared';

interface RawEventViewerProps {
  event: AgentEvent;
  className?: string;
}

const TAG_COLORS: Record<string, string> = {
  initial_recon: 'bg-cyan/15 text-cyan border-cyan/25',
  credential_harvesting: 'bg-threat-critical/15 text-threat-critical border-threat-critical/25',
  lateral_movement: 'bg-threat-high/15 text-threat-high border-threat-high/25',
  exfiltration_attempt: 'bg-threat-critical/15 text-threat-critical border-threat-critical/25',
  deep_probe: 'bg-threat-medium/15 text-threat-medium border-threat-medium/25',
  persistence_attempt: 'bg-threat-high/15 text-threat-high border-threat-high/25',
};

function formatTag(tag: string): string {
  return tag.replace(/_/g, ' ');
}

export function RawEventViewer({ event, className }: RawEventViewerProps) {
  const [expanded, setExpanded] = useState(false);
  const isSuccess = event.responseCode >= 200 && event.responseCode < 300;
  const isClientError = event.responseCode >= 400 && event.responseCode < 500;
  const isServerError = event.responseCode >= 500;

  return (
    <div
      className={cn(
        'border-b border-border transition-colors duration-150',
        expanded && 'bg-elevated/50',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-elevated"
      >
        <span className="shrink-0 text-text-muted">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>

        <span
          className="shrink-0 font-mono text-[11px] text-text-secondary"
          title={formatTimestamp(event.timestamp)}
        >
          {formatRelativeTime(event.timestamp)}
        </span>

        <ServiceBadge service={event.targetService} />

        <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary">
          {event.action}
        </span>

        <span
          className={cn(
            'shrink-0 rounded-badge border px-1.5 py-0.5 font-mono text-[10px] font-medium',
            isSuccess && 'border-threat-safe/25 bg-threat-safe/15 text-threat-safe',
            isClientError && 'border-threat-critical/25 bg-threat-critical/15 text-threat-critical',
            isServerError && 'border-threat-high/25 bg-threat-high/15 text-threat-high',
            !isSuccess && !isClientError && !isServerError && 'border-border bg-elevated text-text-secondary'
          )}
        >
          {event.responseCode}
        </span>

        <span className="shrink-0 font-mono text-[11px] text-text-muted">
          {event.durationMs}ms
        </span>

        {event.tags.length > 0 && (
          <div className="hidden shrink-0 gap-1 lg:flex">
            {event.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className={cn(
                  'rounded-badge border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                  TAG_COLORS[tag] ?? 'border-border bg-elevated text-text-secondary'
                )}
              >
                {formatTag(tag)}
              </span>
            ))}
            {event.tags.length > 2 && (
              <span className="text-[10px] text-text-muted">
                +{event.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </button>

      {expanded && (
        <div className="space-y-3 px-4 pb-4 pt-1">
          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 lg:hidden">
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'rounded-badge border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide',
                    TAG_COLORS[tag] ?? 'border-border bg-elevated text-text-secondary'
                  )}
                >
                  {formatTag(tag)}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div>
              <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Request
              </h4>
              <JsonViewer
                data={{
                  headers: event.requestHeaders,
                  body: event.requestBody,
                  queryParams: event.queryParams,
                }}
                className="max-h-64"
              />
            </div>
            <div>
              <h4 className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-text-muted">
                Response
              </h4>
              <JsonViewer
                data={{
                  code: event.responseCode,
                  body: event.responseBody,
                }}
                className="max-h-64"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
