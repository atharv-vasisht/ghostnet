import { cn } from '@/lib/utils';

interface ServiceBadgeProps {
  service: string;
  className?: string;
}

const SERVICE_STYLES: Record<string, string> = {
  iam: 'bg-cyan/15 text-cyan border-cyan/25',
  oauth: 'bg-threat-high/15 text-threat-high border-threat-high/25',
  secrets: 'bg-threat-critical/15 text-threat-critical border-threat-critical/25',
  api: 'bg-threat-medium/15 text-threat-medium border-threat-medium/25',
  s3: 'bg-threat-safe/15 text-threat-safe border-threat-safe/25',
  discovery: 'bg-text-secondary/15 text-text-secondary border-text-secondary/25',
};

const SERVICE_LABELS: Record<string, string> = {
  iam: 'IAM',
  oauth: 'OAuth',
  secrets: 'Secrets',
  api: 'API',
  s3: 'S3',
  discovery: 'Disc',
};

export function ServiceBadge({ service, className }: ServiceBadgeProps) {
  const key = service.toLowerCase();

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-badge border px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wide',
        SERVICE_STYLES[key] ?? 'bg-elevated text-text-secondary border-border',
        className
      )}
    >
      {SERVICE_LABELS[key] ?? service}
    </span>
  );
}
