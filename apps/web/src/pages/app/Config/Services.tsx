import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Switch from '@radix-ui/react-switch';
import {
  Shield,
  Key,
  Lock,
  Globe,
  Database,
  Radar,
  type LucideIcon,
} from 'lucide-react';
import api from '@/lib/api';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';
import { cn } from '@/lib/utils';

interface ServiceStatus {
  id: string;
  name: string;
  enabled: boolean;
  eventCount: number;
}

interface ServiceMeta {
  icon: LucideIcon;
  protocol: string;
  description: string;
}

const SERVICE_META: Record<string, ServiceMeta> = {
  iam: {
    icon: Shield,
    protocol: 'AWS IAM',
    description: 'Identity and Access Management — user enumeration, role listing, credential validation',
  },
  oauth: {
    icon: Key,
    protocol: 'REST API',
    description: 'OpenID Connect provider — token issuance, user info endpoints',
  },
  secrets: {
    icon: Lock,
    protocol: 'AWS Secrets',
    description: 'AWS-compatible secrets vault — credential storage and retrieval',
  },
  api: {
    icon: Globe,
    protocol: 'REST API',
    description: 'Fake business REST API — employee data, projects, financials',
  },
  s3: {
    icon: Database,
    protocol: 'S3',
    description: 'S3-compatible object storage — buckets with realistic corporate files',
  },
  discovery: {
    icon: Radar,
    protocol: 'REST API',
    description: 'Service registry endpoint — invites agents to explore your environment',
  },
};

export default function Services() {
  const qc = useQueryClient();

  const { data: services, isLoading } = useQuery({
    queryKey: ['config', 'services'],
    queryFn: async () => {
      const { data } = await api.get<ServiceStatus[]>('/config/services');
      return data;
    },
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await api.patch(`/config/services/${id}`, { enabled });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config', 'services'] });
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Toggle deception services on or off. Disabled services will stop
        responding to attacker requests.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(services ?? []).map((service) => {
          const meta = SERVICE_META[service.id];
          const Icon = meta?.icon ?? Globe;
          const enabled = service.enabled;

          return (
            <div
              key={service.id}
              className={cn(
                'rounded-card border bg-surface p-4 transition-all duration-150',
                enabled ? 'border-cyan/40 shadow-glow-cyan' : 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-input',
                      enabled
                        ? 'bg-cyan/20 text-cyan'
                        : 'bg-elevated text-text-muted'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-sm font-semibold text-text-primary">
                      {service.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="inline-block rounded-badge bg-border/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                        {meta?.protocol ?? 'API'}
                      </span>
                      <span className="font-mono text-[10px] text-text-muted">
                        {service.eventCount.toLocaleString()} events
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                      {meta?.description ?? ''}
                    </p>
                  </div>
                </div>
                <Switch.Root
                  checked={enabled}
                  onCheckedChange={(checked) =>
                    toggleMut.mutate({ id: service.id, enabled: checked })
                  }
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150',
                    'data-[state=checked]:bg-cyan data-[state=unchecked]:bg-border',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-surface'
                  )}
                >
                  <Switch.Thumb
                    className={cn(
                      'block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform duration-150',
                      'data-[state=checked]:translate-x-5'
                    )}
                  />
                </Switch.Root>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
