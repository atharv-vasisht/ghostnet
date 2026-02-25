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
import { cn } from '@/lib/utils';
import type { ServiceId } from './types';

interface ServiceConfig {
  id: ServiceId;
  name: string;
  protocol: string;
  description: string;
  icon: LucideIcon;
}

const SERVICES: ServiceConfig[] = [
  {
    id: 'iam',
    name: 'AWS IAM',
    protocol: 'AWS IAM',
    description:
      'Identity and Access Management — user enumeration, role listing, credential validation',
    icon: Shield,
  },
  {
    id: 'oauth',
    name: 'OAuth/OIDC',
    protocol: 'REST API',
    description:
      'OpenID Connect provider — token issuance, user info endpoints',
    icon: Key,
  },
  {
    id: 'secrets',
    name: 'Secrets Manager',
    protocol: 'AWS Secrets',
    description:
      'AWS-compatible secrets vault — credential storage and retrieval',
    icon: Lock,
  },
  {
    id: 'api',
    name: 'Internal API',
    protocol: 'REST API',
    description:
      'Fake business REST API — employee data, projects, financials',
    icon: Globe,
  },
  {
    id: 's3',
    name: 'S3 Storage',
    protocol: 'S3',
    description:
      'S3-compatible object storage — buckets with realistic corporate files',
    icon: Database,
  },
  {
    id: 'discovery',
    name: 'Discovery',
    protocol: 'REST API',
    description:
      'Service registry endpoint — invites agents to explore your environment',
    icon: Radar,
  },
];

interface Step2ServicesProps {
  enabledServices: ServiceId[];
  onToggle: (id: ServiceId, enabled: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Services({
  enabledServices,
  onToggle,
  onNext,
  onBack,
}: Step2ServicesProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          const enabled = enabledServices.includes(service.id);

          return (
            <div
              key={service.id}
              className={cn(
                'rounded-card border bg-surface p-4 transition-all duration-150',
                enabled
                  ? 'border-cyan/40 shadow-glow-cyan'
                  : 'border-border'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-input',
                      enabled ? 'bg-cyan/20 text-cyan' : 'bg-elevated text-text-muted'
                    )}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-sm font-semibold text-text-primary">
                      {service.name}
                    </h3>
                    <span className="mt-0.5 inline-block rounded-badge bg-border/80 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-secondary">
                      {service.protocol}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                      {service.description}
                    </p>
                  </div>
                </div>
                <Switch.Root
                  checked={enabled}
                  onCheckedChange={(checked) => onToggle(service.id, checked)}
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
