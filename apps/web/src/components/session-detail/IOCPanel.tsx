import { Shield, Download } from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { cn } from '@/lib/utils';
import type { AgentSession, AgentEvent, BehavioralTag } from '@ghostnet/shared';

interface IOCPanelProps {
  session: AgentSession;
  events: AgentEvent[];
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

export function IOCPanel({ session, events, className }: IOCPanelProps) {
  const sourceIps = [...new Set([session.sourceIp, ...events.map((e) => e.sourceIp)])];
  const userAgents = [...new Set([session.userAgent, ...events.map((e) => e.userAgent)])].filter(Boolean);

  const allTags = events.flatMap((e) => e.tags);
  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const credentials = (session.believedAssets ?? []).filter(
    (a) => a.type === 'credential'
  );

  const handleExportIOCs = () => {
    const lines = [
      '# GHOSTNET IOC Export',
      `# Session: ${session.id}`,
      `# Generated: ${new Date().toISOString()}`,
      '',
      '## Source IPs',
      ...sourceIps,
      '',
      '## User Agents',
      ...userAgents,
      '',
      '## Behavioral Signatures',
      ...uniqueTags.map(([tag, count]) => `${tag} (${count}x)`),
      '',
      '## Credentials Retrieved',
      ...credentials.map((c) => `${c.value} [source: ${c.source}]`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghostnet-iocs-${session.id.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn('space-y-5', className)}>
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-threat-critical" />
        <h2 className="font-heading text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Indicators of Compromise
        </h2>
      </div>

      {/* Source IPs */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Source IPs
        </span>
        <div className="space-y-1">
          {sourceIps.map((ip) => (
            <div
              key={ip}
              className="flex items-center justify-between rounded-input bg-elevated px-2.5 py-1.5"
            >
              <span className="font-mono text-xs text-text-primary">{ip}</span>
              <CopyButton value={ip} />
            </div>
          ))}
        </div>
      </div>

      {/* User Agents */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          User Agents
        </span>
        <div className="space-y-1">
          {userAgents.map((ua) => (
            <div
              key={ua}
              className="rounded-input bg-elevated px-2.5 py-1.5"
            >
              <span className="break-all font-mono text-[11px] leading-relaxed text-text-primary">
                {ua}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Signatures */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Behavioral Signatures
        </span>
        {uniqueTags.length === 0 ? (
          <p className="text-xs text-text-muted italic">None detected</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {uniqueTags.map(([tag, count]) => (
              <span
                key={tag}
                className={cn(
                  'rounded-badge border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                  TAG_COLORS[tag] ?? 'border-border bg-elevated text-text-secondary'
                )}
              >
                {formatTag(tag)}
                <span className="ml-1 opacity-60">×{count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Credentials Retrieved */}
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-text-muted">
          Credentials Retrieved
        </span>
        {credentials.length === 0 ? (
          <p className="text-xs text-text-muted italic">None retrieved</p>
        ) : (
          <div className="space-y-1">
            {credentials.map((cred, i) => (
              <div
                key={`${cred.value}-${i}`}
                className="rounded-input bg-elevated px-2.5 py-1.5"
              >
                <span className="font-mono text-xs text-threat-critical">
                  {cred.value}
                </span>
                <span className="ml-2 text-[10px] text-text-muted">
                  via {cred.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <button
        type="button"
        onClick={handleExportIOCs}
        className="flex w-full items-center justify-center gap-2 rounded-input border border-border bg-elevated px-4 py-2 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-border hover:text-text-primary"
      >
        <Download size={14} />
        Export IOCs
      </button>
    </div>
  );
}
