import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Webhook,
  BarChart3,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import api from '@/lib/api';
import { LiveDot } from '@/components/shared/LiveDot';
import { SkeletonCard } from '@/components/shared/SkeletonLoader';
import { cn } from '@/lib/utils';

interface IntegrationConfig {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, string>;
}

interface IntegrationMeta {
  icon: LucideIcon;
  description: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const INTEGRATION_META: Record<string, IntegrationMeta> = {
  slack: {
    icon: MessageSquare,
    description: 'Send real-time alerts and session summaries to Slack channels',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'channel', label: 'Channel', placeholder: '#ghostnet-alerts' },
    ],
  },
  webhook: {
    icon: Webhook,
    description: 'Forward events and alerts to any HTTP endpoint',
    fields: [
      { key: 'url', label: 'Endpoint URL', placeholder: 'https://your-api.com/ghostnet' },
      { key: 'secret', label: 'Signing Secret', placeholder: 'whsec_...', type: 'password' },
    ],
  },
  splunk: {
    icon: BarChart3,
    description: 'Stream events to Splunk via HTTP Event Collector (HEC)',
    fields: [
      { key: 'hecUrl', label: 'HEC URL', placeholder: 'https://splunk.example.com:8088' },
      { key: 'hecToken', label: 'HEC Token', placeholder: 'your-hec-token', type: 'password' },
      { key: 'index', label: 'Index', placeholder: 'ghostnet' },
    ],
  },
  sentinel: {
    icon: ShieldCheck,
    description: 'Send security events to Microsoft Sentinel workspace',
    fields: [
      { key: 'workspaceId', label: 'Workspace ID', placeholder: 'xxxxxxxx-xxxx-...' },
      { key: 'sharedKey', label: 'Shared Key', placeholder: 'Primary or secondary key', type: 'password' },
      { key: 'logType', label: 'Log Type', placeholder: 'GhostnetEvents' },
    ],
  },
};

function IntegrationCard({
  integration,
  onSave,
  onTest,
  saving,
  testing,
  testResult,
}: {
  integration: IntegrationConfig;
  onSave: (id: string, config: Record<string, string>) => void;
  onTest: (id: string) => void;
  saving: boolean;
  testing: boolean;
  testResult: 'success' | 'error' | null;
}) {
  const meta = INTEGRATION_META[integration.id];
  const Icon = meta?.icon ?? Webhook;

  const [localConfig, setLocalConfig] = useState(integration.config);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLocalConfig(integration.config);
    setDirty(false);
  }, [integration.config]);

  const handleChange = (key: string, value: string) => {
    setLocalConfig((p) => ({ ...p, [key]: value }));
    setDirty(true);
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-input bg-elevated text-text-secondary">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-text-primary">
              {integration.name}
            </h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              {meta?.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <LiveDot
            color={integration.enabled ? 'bg-threat-safe' : 'bg-text-muted'}
          />
          <span
            className={cn(
              'text-[11px] font-medium',
              integration.enabled ? 'text-threat-safe' : 'text-text-muted'
            )}
          >
            {integration.enabled ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {(meta?.fields ?? []).map(({ key, label, placeholder, type }) => (
          <div key={key}>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-text-secondary">
              {label}
            </label>
            <input
              type={type ?? 'text'}
              value={localConfig[key] ?? ''}
              onChange={(e) => handleChange(key, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-input border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted outline-none transition-colors duration-150 focus:border-cyan"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => onSave(integration.id, localConfig)}
          disabled={!dirty || saving}
          className="flex items-center gap-1.5 rounded-input bg-cyan px-4 py-1.5 text-xs font-medium text-void transition-colors duration-150 hover:bg-cyan/90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Check size={14} />
          )}
          Save
        </button>
        <button
          type="button"
          onClick={() => onTest(integration.id)}
          disabled={testing}
          className="flex items-center gap-1.5 rounded-input border border-border px-4 py-1.5 text-xs font-medium text-text-secondary transition-colors duration-150 hover:bg-elevated hover:text-text-primary disabled:opacity-50"
        >
          {testing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Zap size={14} />
          )}
          Test
        </button>
        {testResult === 'success' && (
          <span className="text-xs text-threat-safe">Connection successful</span>
        )}
        {testResult === 'error' && (
          <span className="text-xs text-threat-critical">Connection failed</span>
        )}
      </div>
    </div>
  );
}

export default function Integrations() {
  const qc = useQueryClient();

  const { data: integrations, isLoading, isError } = useQuery({
    queryKey: ['config', 'integrations'],
    queryFn: async () => {
      const { data } = await api.get<IntegrationConfig[]>('/config/integrations');
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Record<string, string> }) => {
      await api.put(`/config/integrations/${id}`, { config });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['config', 'integrations'] });
    },
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error'>>({});

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await api.post(`/config/integrations/${id}/test`);
      setTestResults((p) => ({ ...p, [id]: 'success' }));
    } catch {
      setTestResults((p) => ({ ...p, [id]: 'error' }));
    } finally {
      setTestingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="min-h-[200px]" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-card border border-threat-critical/30 bg-threat-critical/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-threat-critical" />
          <p className="text-sm text-threat-critical">Failed to load integrations</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-secondary">
        Connect external tools to receive alerts and event data from GHOSTNET
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(Array.isArray(integrations) ? integrations : []).map((integration) => (
          <IntegrationCard
            key={integration.id}
            integration={integration}
            onSave={(id, config) => saveMut.mutate({ id, config })}
            onTest={handleTest}
            saving={saveMut.isPending}
            testing={testingId === integration.id}
            testResult={testResults[integration.id] ?? null}
          />
        ))}
      </div>
    </div>
  );
}
