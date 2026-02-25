import type { LucideIcon } from 'lucide-react';
import {
  Shield,
  Key,
  Lock,
  Globe,
  Database,
  Radar,
  Download,
} from 'lucide-react';
import { CopyButton } from '@/components/shared/CopyButton';
import { cn } from '@/lib/utils';
import type { ServiceId } from './types';

interface ServiceEndpoint {
  id: ServiceId;
  name: string;
  protocol: string;
  path: string;
  icon: LucideIcon;
}

function getOrgSlug(domain: string): string {
  const parts = domain.split('.');
  return parts[0] || domain.replace(/\./g, '-');
}

function buildServiceEndpoints(
  enabledServices: ServiceId[],
  orgSlug: string
): ServiceEndpoint[] {
  const baseHost = `${orgSlug}.ghostnet.io`;
  const serviceMap: Record<
    ServiceId,
    { name: string; protocol: string; path: string; icon: LucideIcon }
  > = {
    iam: { name: 'AWS IAM', protocol: 'AWS IAM', path: 'iam', icon: Shield },
    oauth: {
      name: 'OAuth/OIDC',
      protocol: 'REST API',
      path: 'oauth',
      icon: Key,
    },
    secrets: {
      name: 'Secrets Manager',
      protocol: 'AWS Secrets',
      path: 'secrets',
      icon: Lock,
    },
    api: {
      name: 'Internal API',
      protocol: 'REST API',
      path: 'api',
      icon: Globe,
    },
    s3: {
      name: 'S3 Storage',
      protocol: 'S3',
      path: 's3',
      icon: Database,
    },
    discovery: {
      name: 'Discovery',
      protocol: 'REST API',
      path: 'discovery',
      icon: Radar,
    },
  };

  return enabledServices.map((id) => {
    const config = serviceMap[id]!;
    const url = `https://${config.path}.${baseHost}`;
    return {
      id,
      name: config.name,
      protocol: config.protocol,
      path: url,
      icon: config.icon,
    };
  });
}

interface Step3DeployProps {
  domain: string;
  enabledServices: ServiceId[];
  onNext: () => void;
  onBack: () => void;
}

export function Step3Deploy({
  domain,
  enabledServices,
  onNext,
  onBack,
}: Step3DeployProps) {
  const orgSlug = getOrgSlug(domain);
  const endpoints = buildServiceEndpoints(enabledServices, orgSlug);

  const handleDownloadGuide = () => {
    const content = `# GHOSTNET Integration Guide

## Your Deception Endpoints

${endpoints
  .map(
    (e) => `### ${e.name} (${e.protocol})
\`\`\`
${e.path}
\`\`\`
`
  )
  .join('\n')}

## Integration Steps

1. Add these URLs to your internal DNS or service registry
2. Configure routing so internal traffic can reach these endpoints
3. Run a test probe to verify connectivity
4. Monitor your GHOSTNET dashboard for incoming signals
`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ghostnet-integration-guide.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {endpoints.map((ep) => {
          const Icon = ep.icon;
          return (
            <div
              key={ep.id}
              className="rounded-card border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-cyan/20 text-cyan">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-sm font-semibold text-text-primary">
                        {ep.name}
                      </h3>
                      <span className="rounded-badge bg-border/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                        {ep.protocol}
                      </span>
                    </div>
                    <code className="mt-1 block font-mono text-xs text-cyan">
                      {ep.path}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-threat-safe">
                    <span className="h-2 w-2 rounded-full bg-threat-safe" />
                    Ready
                  </span>
                  <CopyButton value={ep.path} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={cn(
          'rounded-card border border-border bg-surface p-4',
          'border-cyan/20 bg-cyan-dim/30'
        )}
      >
        <p className="text-sm text-text-secondary">
          Point these URLs at your environment. Add them to internal service
          registries, DNS, or routing tables where your real services would
          appear.
        </p>
      </div>

      <button
        type="button"
        onClick={handleDownloadGuide}
        className="flex items-center gap-2 rounded-input border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-elevated"
      >
        <Download size={16} />
        Download Integration Guide
      </button>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="rounded-input border border-border bg-elevated px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-border hover:text-text-primary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-input bg-cyan px-6 py-2 font-heading text-sm font-semibold text-void transition-opacity hover:opacity-90"
        >
          Next
        </button>
      </div>
    </div>
  );
}
